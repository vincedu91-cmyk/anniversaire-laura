-- SCHÉMA COMPLET (livre d'or + invitations). À coller UNE FOIS dans l'éditeur SQL Supabase, puis Run.
-- Ensuite, exécuter set-moderation-secret.sql après avoir remplacé la phrase secrète.

-- Livre d'or de Laura: messages des proches, modération avant affichage.
-- Projet Supabase: Anniversaire-18-ans-laura (wzgrupqpupqdyjvbumnf).
-- Principe de sécurité: un visiteur (rôle anon) peut seulement DÉPOSER un message "pending"
-- et LIRE les messages approuvés (et révélés). Toute modération passe par des fonctions
-- protégées par un secret hashé (bcrypt) avec limitation des essais.

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to anon, authenticated;

-- Réglages (une seule ligne). reveal_at null = messages visibles dès leur approbation.
create table private.settings (
  id boolean primary key default true check (id),
  reveal_at timestamptz
);
insert into private.settings (id, reveal_at) values (true, null);

-- Secret de modération (hash bcrypt, jamais en clair) et journal anti force brute.
create table private.moderation (
  id boolean primary key default true check (id),
  secret_hash text not null
);
create table private.moderation_attempts (
  id bigserial primary key,
  attempted_at timestamptz not null default now(),
  success boolean not null
);

create function private.is_revealed()
returns boolean language sql stable security definer set search_path = ''
as $$
  select coalesce((select reveal_at <= now() from private.settings where id), true);
$$;
revoke execute on function private.is_revealed() from public;
grant execute on function private.is_revealed() to anon, authenticated;

create function private.check_secret(p_secret text)
returns boolean language plpgsql security definer set search_path = ''
as $$
declare
  recent_failures int;
  valid boolean;
begin
  select count(*) into recent_failures
  from private.moderation_attempts
  where not success and attempted_at > now() - interval '10 minutes';
  if recent_failures >= 8 then
    return false;
  end if;
  select exists (
    select 1 from private.moderation m
    where m.secret_hash = extensions.crypt(p_secret, m.secret_hash)
  ) into valid;
  insert into private.moderation_attempts (success) values (valid);
  delete from private.moderation_attempts where attempted_at < now() - interval '1 day';
  return valid;
end;
$$;
revoke execute on function private.check_secret(text) from public, anon, authenticated;

-- Messages
create table public.guestbook_messages (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  author_name text not null check (char_length(btrim(author_name)) between 1 and 60),
  kind text not null check (kind in ('text', 'voice')),
  body text check (body is null or char_length(body) <= 1200),
  audio_path text check (audio_path is null or audio_path ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(webm|mp4|ogg|m4a|mp3)$'),
  audio_seconds int check (audio_seconds is null or audio_seconds between 1 and 90),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reviewed_at timestamptz,
  constraint guestbook_content_present check (
    (kind = 'text' and body is not null and char_length(btrim(body)) > 0)
    or (kind = 'voice' and audio_path is not null)
  )
);
create index guestbook_messages_status_created_idx on public.guestbook_messages (status, created_at);

alter table public.guestbook_messages enable row level security;

-- Droits par colonne: un visiteur ne peut jamais choisir le statut.
revoke all on public.guestbook_messages from anon, authenticated;
grant insert (author_name, kind, body, audio_path, audio_seconds) on public.guestbook_messages to anon, authenticated;
grant select (id, created_at, author_name, kind, body, audio_path, audio_seconds) on public.guestbook_messages to anon, authenticated;

create policy guestbook_insert_pending on public.guestbook_messages
  for insert to anon, authenticated
  with check (status = 'pending' and reviewed_at is null);

create policy guestbook_read_approved on public.guestbook_messages
  for select to anon, authenticated
  using (status = 'approved' and private.is_revealed());

-- Fonctions publiques (appelées en RPC)
create function public.guestbook_status()
returns jsonb language sql stable security definer set search_path = ''
as $$
  select jsonb_build_object('revealed', private.is_revealed(), 'reveal_at', (select reveal_at from private.settings where id));
$$;
revoke execute on function public.guestbook_status() from public;
grant execute on function public.guestbook_status() to anon, authenticated;

create function public.moderation_list(p_secret text)
returns jsonb language plpgsql security definer set search_path = ''
as $$
begin
  if not private.check_secret(p_secret) then
    return jsonb_build_object('ok', false);
  end if;
  return jsonb_build_object(
    'ok', true,
    'rows', coalesce((select jsonb_agg(to_jsonb(m) order by m.created_at desc) from public.guestbook_messages m), '[]'::jsonb)
  );
end;
$$;
revoke execute on function public.moderation_list(text) from public;
grant execute on function public.moderation_list(text) to anon, authenticated;

create function public.moderation_set_status(p_secret text, p_id uuid, p_status text)
returns jsonb language plpgsql security definer set search_path = ''
as $$
begin
  if p_status not in ('pending', 'approved', 'rejected') then
    return jsonb_build_object('ok', false);
  end if;
  if not private.check_secret(p_secret) then
    return jsonb_build_object('ok', false);
  end if;
  update public.guestbook_messages
     set status = p_status,
         reviewed_at = case when p_status = 'pending' then null else now() end
   where id = p_id;
  return jsonb_build_object('ok', true);
end;
$$;
revoke execute on function public.moderation_set_status(text, uuid, text) from public;
grant execute on function public.moderation_set_status(text, uuid, text) to anon, authenticated;

-- Messages vocaux: dépôt anonyme limité en taille et en type, noms imposés (uuid).
-- Le bucket est public en lecture (URL non devinable); la modération masque les messages non approuvés.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('guestbook-audio', 'guestbook-audio', true, 3145728,
        array['audio/webm', 'audio/mp4', 'audio/ogg', 'audio/mpeg', 'audio/x-m4a', 'audio/aac'])
on conflict (id) do nothing;

create policy guestbook_audio_upload on storage.objects
  for insert to anon, authenticated
  with check (
    bucket_id = 'guestbook-audio'
    and name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(webm|mp4|ogg|m4a|mp3)$'
  );


-- Invitations: liste des invités, lien de réponse personnel, réponse en un clic.
-- À appliquer APRÈS 20261007000000_guestbook_schema.sql (réutilise private.check_secret).
-- Les données des invités (nom, e-mail) vivent dans le schéma "private": jamais exposées par l'API.
-- Un invité ne peut que lire son prénom et répondre, avec son jeton personnel (144 bits, non devinable).

create table private.guests (
  id uuid primary key default gen_random_uuid(),
  token text not null unique default encode(extensions.gen_random_bytes(18), 'hex'),
  first_name text not null check (char_length(btrim(first_name)) between 1 and 60),
  last_name text not null default '' check (char_length(last_name) <= 60),
  email text not null check (char_length(email) between 5 and 160 and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  status text not null default 'pending' check (status in ('pending', 'yes', 'maybe', 'no')),
  responded_at timestamptz,
  created_at timestamptz not null default now()
);
create unique index guests_email_unique on private.guests (lower(email));
alter table private.guests enable row level security;
revoke all on private.guests from anon, authenticated;

-- Côté invité --------------------------------------------------------------

create function public.rsvp_get(p_token text)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare
  g record;
begin
  if p_token is null or char_length(p_token) < 20 then
    return jsonb_build_object('ok', false);
  end if;
  select first_name, status, responded_at into g from private.guests where token = p_token;
  if not found then
    return jsonb_build_object('ok', false);
  end if;
  return jsonb_build_object('ok', true, 'first_name', g.first_name, 'status', g.status, 'responded_at', g.responded_at);
end;
$$;

create function public.rsvp_respond(p_token text, p_status text)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare
  updated int;
begin
  if p_token is null or char_length(p_token) < 20 or p_status not in ('yes', 'maybe', 'no') then
    return jsonb_build_object('ok', false);
  end if;
  update private.guests set status = p_status, responded_at = now() where token = p_token;
  get diagnostics updated = row_count;
  return jsonb_build_object('ok', updated = 1);
end;
$$;

-- Côté organisateur (secret requis) -----------------------------------------

create function public.admin_guests_list(p_secret text)
returns jsonb language plpgsql security definer set search_path = ''
as $$
begin
  if not private.check_secret(p_secret) then
    return jsonb_build_object('ok', false);
  end if;
  return jsonb_build_object(
    'ok', true,
    'rows', coalesce((select jsonb_agg(to_jsonb(g) order by lower(g.first_name), lower(g.last_name)) from private.guests g), '[]'::jsonb)
  );
end;
$$;

create function public.admin_guest_save(p_secret text, p_id uuid, p_first_name text, p_last_name text, p_email text)
returns jsonb language plpgsql security definer set search_path = ''
as $$
begin
  if not private.check_secret(p_secret) then
    return jsonb_build_object('ok', false, 'error', 'secret');
  end if;
  if p_id is null then
    insert into private.guests (first_name, last_name, email)
    values (btrim(p_first_name), btrim(coalesce(p_last_name, '')), btrim(p_email));
  else
    update private.guests
       set first_name = btrim(p_first_name), last_name = btrim(coalesce(p_last_name, '')), email = btrim(p_email)
     where id = p_id;
  end if;
  return jsonb_build_object('ok', true);
exception
  when unique_violation then
    return jsonb_build_object('ok', false, 'error', 'duplicate');
  when check_violation then
    return jsonb_build_object('ok', false, 'error', 'invalid');
end;
$$;

create function public.admin_guest_set_status(p_secret text, p_id uuid, p_status text)
returns jsonb language plpgsql security definer set search_path = ''
as $$
begin
  if p_status not in ('pending', 'yes', 'maybe', 'no') or not private.check_secret(p_secret) then
    return jsonb_build_object('ok', false);
  end if;
  update private.guests
     set status = p_status,
         responded_at = case when p_status = 'pending' then null else now() end
   where id = p_id;
  return jsonb_build_object('ok', true);
end;
$$;

create function public.admin_guest_delete(p_secret text, p_id uuid)
returns jsonb language plpgsql security definer set search_path = ''
as $$
begin
  if not private.check_secret(p_secret) then
    return jsonb_build_object('ok', false);
  end if;
  delete from private.guests where id = p_id;
  return jsonb_build_object('ok', true);
end;
$$;

-- Import en masse: [{"first_name": "...", "last_name": "...", "email": "..."}]
create function public.admin_guests_import(p_secret text, p_rows jsonb)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare
  r jsonb;
  added int := 0;
  duplicates int := 0;
  invalid int := 0;
begin
  if not private.check_secret(p_secret) then
    return jsonb_build_object('ok', false);
  end if;
  if jsonb_typeof(p_rows) <> 'array' or jsonb_array_length(p_rows) > 500 then
    return jsonb_build_object('ok', false);
  end if;
  for r in select * from jsonb_array_elements(p_rows) loop
    begin
      insert into private.guests (first_name, last_name, email)
      values (btrim(coalesce(r->>'first_name', '')), btrim(coalesce(r->>'last_name', '')), btrim(coalesce(r->>'email', '')));
      added := added + 1;
    exception
      when unique_violation then duplicates := duplicates + 1;
      when check_violation then invalid := invalid + 1;
    end;
  end loop;
  return jsonb_build_object('ok', true, 'added', added, 'duplicates', duplicates, 'invalid', invalid);
end;
$$;

-- Droits: seules ces fonctions sont appelables par l'API.
revoke execute on function public.rsvp_get(text) from public;
revoke execute on function public.rsvp_respond(text, text) from public;
revoke execute on function public.admin_guests_list(text) from public;
revoke execute on function public.admin_guest_save(text, uuid, text, text, text) from public;
revoke execute on function public.admin_guest_set_status(text, uuid, text) from public;
revoke execute on function public.admin_guest_delete(text, uuid) from public;
revoke execute on function public.admin_guests_import(text, jsonb) from public;

grant execute on function public.rsvp_get(text) to anon, authenticated;
grant execute on function public.rsvp_respond(text, text) to anon, authenticated;
grant execute on function public.admin_guests_list(text) to anon, authenticated;
grant execute on function public.admin_guest_save(text, uuid, text, text, text) to anon, authenticated;
grant execute on function public.admin_guest_set_status(text, uuid, text) to anon, authenticated;
grant execute on function public.admin_guest_delete(text, uuid) to anon, authenticated;
grant execute on function public.admin_guests_import(text, jsonb) to anon, authenticated;
