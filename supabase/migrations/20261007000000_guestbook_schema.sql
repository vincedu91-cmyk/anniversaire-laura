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
