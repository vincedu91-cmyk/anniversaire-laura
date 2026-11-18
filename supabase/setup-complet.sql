-- SCHÉMA COMPLET (livre d'or + invitations + galerie photo de la soirée). À coller UNE FOIS dans l'éditeur SQL Supabase, puis Run.
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

-- =====================================================================================
-- GALERIE PHOTO DE LA SOIRÉE (migration 20261009000000_party_photos.sql)
-- =====================================================================================

-- Galerie photo collaborative de la soirée (+ souvenirs d'avant).
-- À appliquer APRÈS 20261007000000_guestbook_schema.sql (réutilise private.check_secret).
--
-- Principe de sécurité:
--  * La table des photos est FERMÉE à l'API publique (RLS + aucun droit): tout passe par des fonctions.
--  * Une clé secrète (celle du QR code) est exigée pour déposer, lire, aimer une photo. Elle est dans private.party_settings.
--  * Un dépôt se fait en trois temps: réservation (clé exigée) > envoi des fichiers (autorisé UNIQUEMENT pour un
--    identifiant réservé, une seule fois) > publication. Impossible de remplir le stockage sans réservation.
--  * Un appareil (identifiant aléatoire gardé dans son navigateur) peut retirer ses propres photos et aimer une fois.
--  * Modération a posteriori: les photos sont publiées tout de suite, l'organisateur (secret) peut les masquer.

-- Réglages: clé du QR code et fenêtre d'ouverture des dépôts "soirée" (null = toujours ouvert).
create table private.party_settings (
  id boolean primary key default true check (id),
  upload_key text not null check (char_length(upload_key) >= 8),
  open_from timestamptz,
  open_until timestamptz
);

do $$
declare
  alphabet constant text := 'abcdefghjkmnpqrstuvwxyz23456789'; -- sans caractères ambigus (i, l, o, 0, 1)
  bytes bytea := extensions.gen_random_bytes(12);
  generated text := '';
  i int;
begin
  for i in 0..11 loop
    generated := generated || substr(alphabet, 1 + (get_byte(bytes, i) % 31), 1);
  end loop;
  insert into private.party_settings (id, upload_key) values (true, generated);
end;
$$;
alter table private.party_settings enable row level security;
revoke all on private.party_settings from anon, authenticated;

-- Photos
create table public.party_photos (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  kind text not null default 'soiree' check (kind in ('soiree', 'souvenir')),
  author_name text check (author_name is null or char_length(btrim(author_name)) between 1 and 60),
  caption text check (caption is null or char_length(caption) <= 140),
  challenge text check (challenge is null or challenge ~ '^[a-z0-9-]{2,30}$'),
  year int check (year is null or year between 1990 and 2030),
  width int check (width is null or width between 16 and 6000),
  height int check (height is null or height between 16 and 6000),
  hearts int not null default 0 check (hearts >= 0),
  status text not null default 'reserved' check (status in ('reserved', 'approved', 'hidden', 'removed'))
);
create index party_photos_status_updated_idx on public.party_photos (status, updated_at);
alter table public.party_photos enable row level security;
revoke all on public.party_photos from anon, authenticated;

-- Propriétaire (appareil) et cœurs: jamais exposés.
create table private.party_owner (
  photo_id uuid primary key references public.party_photos (id) on delete cascade,
  device uuid not null
);
create index party_owner_device_idx on private.party_owner (device);
alter table private.party_owner enable row level security;
revoke all on private.party_owner from anon, authenticated;

create table private.party_hearts (
  photo_id uuid not null references public.party_photos (id) on delete cascade,
  device uuid not null,
  primary key (photo_id, device)
);
alter table private.party_hearts enable row level security;
revoke all on private.party_hearts from anon, authenticated;

-- Outils internes ------------------------------------------------------------

create function private.party_key_ok(p_key text)
returns boolean language sql stable security definer set search_path = ''
as $$
  select p_key is not null and exists (
    select 1 from private.party_settings s where s.id and s.upload_key = lower(btrim(p_key))
  );
$$;
revoke execute on function private.party_key_ok(text) from public, anon, authenticated;

create function private.party_open(p_kind text)
returns boolean language sql stable security definer set search_path = ''
as $$
  select p_kind = 'souvenir' or coalesce((
    select (s.open_from is null or s.open_from <= now()) and (s.open_until is null or s.open_until >= now())
    from private.party_settings s where s.id
  ), false);
$$;
revoke execute on function private.party_open(text) from public, anon, authenticated;

-- Le stockage n'accepte un fichier que pour une photo réservée (moins de 2 h) et jamais deux fois.
create function private.party_upload_ok(p_name text)
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.party_photos p
    where p.status = 'reserved'
      and p.created_at > now() - interval '2 hours'
      and p_name in (p.id::text || '.jpg', p.id::text || '_t.jpg')
  );
$$;
revoke execute on function private.party_upload_ok(text) from public;
grant execute on function private.party_upload_ok(text) to anon, authenticated;

-- Stockage -------------------------------------------------------------------
-- Public en lecture (noms = uuid, impossibles à deviner), JPEG uniquement, 2 Mo maximum par fichier.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('party-photos', 'party-photos', true, 2097152, array['image/jpeg'])
on conflict (id) do nothing;

create policy party_photos_upload on storage.objects
  for insert to anon, authenticated
  with check (bucket_id = 'party-photos' and private.party_upload_ok(name));

-- Côté invité ----------------------------------------------------------------

create function public.party_status(p_key text)
returns jsonb language plpgsql stable security definer set search_path = ''
as $$
declare
  s record;
begin
  if not private.party_key_ok(p_key) then
    return jsonb_build_object('ok', false);
  end if;
  select open_from, open_until into s from private.party_settings where id;
  return jsonb_build_object(
    'ok', true,
    'open', private.party_open('soiree'),
    'open_from', s.open_from,
    'open_until', s.open_until,
    'count', (select count(*) from public.party_photos where status = 'approved')
  );
end;
$$;

-- Étape 1: réserver un emplacement (limites par appareil et au total).
create function public.party_reserve(p_key text, p_device uuid, p_kind text default 'soiree', p_year int default null)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare
  new_id uuid;
  by_device int;
  in_total int;
begin
  if p_device is null or not private.party_key_ok(p_key) then
    return jsonb_build_object('ok', false, 'error', 'key');
  end if;
  if p_kind not in ('soiree', 'souvenir') then
    return jsonb_build_object('ok', false, 'error', 'invalid');
  end if;
  if not private.party_open(p_kind) then
    return jsonb_build_object('ok', false, 'error', 'closed');
  end if;

  select count(*) into by_device
  from public.party_photos p join private.party_owner o on o.photo_id = p.id
  where o.device = p_device
    and p.status <> 'removed'
    and not (p.status = 'reserved' and p.created_at < now() - interval '2 hours');
  select count(*) into in_total
  from public.party_photos p
  where p.status <> 'removed'
    and not (p.status = 'reserved' and p.created_at < now() - interval '2 hours');
  if by_device >= 120 or in_total >= 1500 then
    return jsonb_build_object('ok', false, 'error', 'limit');
  end if;

  insert into public.party_photos (kind, year)
  values (p_kind, case when p_kind = 'souvenir' then p_year else null end)
  returning id into new_id;
  insert into private.party_owner (photo_id, device) values (new_id, p_device);
  return jsonb_build_object('ok', true, 'id', new_id);
exception
  when check_violation then
    return jsonb_build_object('ok', false, 'error', 'invalid');
end;
$$;

-- Étape 3: publier (les deux fichiers doivent exister dans le stockage).
create function public.party_publish(
  p_id uuid, p_device uuid, p_author text, p_caption text, p_challenge text, p_width int, p_height int
)
returns jsonb language plpgsql security definer set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.party_photos p join private.party_owner o on o.photo_id = p.id
    where p.id = p_id and o.device = p_device and p.status = 'reserved'
  ) then
    return jsonb_build_object('ok', false, 'error', 'unknown');
  end if;
  if (select count(*) from storage.objects
      where bucket_id = 'party-photos' and name in (p_id::text || '.jpg', p_id::text || '_t.jpg')) < 2 then
    return jsonb_build_object('ok', false, 'error', 'missing');
  end if;
  update public.party_photos
     set author_name = nullif(left(btrim(coalesce(p_author, '')), 60), ''),
         caption = nullif(left(btrim(coalesce(p_caption, '')), 140), ''),
         challenge = nullif(btrim(coalesce(p_challenge, '')), ''),
         width = p_width,
         height = p_height,
         status = 'approved',
         updated_at = now()
   where id = p_id;
  return jsonb_build_object('ok', true);
exception
  when check_violation then
    return jsonb_build_object('ok', false, 'error', 'invalid');
end;
$$;

-- Lecture: tout (p_since null) ou seulement ce qui a changé depuis (photos ajoutées, cœurs, masquées/retirées).
create function public.party_list(p_key text, p_since timestamptz default null)
returns jsonb language plpgsql security definer set search_path = ''
as $$
begin
  if not private.party_key_ok(p_key) then
    return jsonb_build_object('ok', false);
  end if;
  return jsonb_build_object(
    'ok', true,
    'server_now', clock_timestamp(),
    'rows', coalesce((
      select jsonb_agg(r order by r.updated_at, r.id)
      from (
        select
          p.id, p.status, p.updated_at,
          case when p.status = 'approved' then p.created_at end as created_at,
          case when p.status = 'approved' then p.kind end as kind,
          case when p.status = 'approved' then p.author_name end as author_name,
          case when p.status = 'approved' then p.caption end as caption,
          case when p.status = 'approved' then p.challenge end as challenge,
          case when p.status = 'approved' then p.year end as year,
          case when p.status = 'approved' then p.width end as width,
          case when p.status = 'approved' then p.height end as height,
          case when p.status = 'approved' then p.hearts end as hearts
        from public.party_photos p
        where (p_since is null and p.status = 'approved')
           or (p_since is not null and p.status in ('approved', 'hidden', 'removed') and p.updated_at > p_since)
        order by p.updated_at, p.id
        limit 1500
      ) r
    ), '[]'::jsonb)
  );
end;
$$;

-- Cœur: un par appareil et par photo, un second appel le retire.
create function public.party_heart(p_key text, p_photo uuid, p_device uuid)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare
  total int;
  now_hearted boolean;
begin
  if p_device is null or not private.party_key_ok(p_key) then
    return jsonb_build_object('ok', false);
  end if;
  if not exists (select 1 from public.party_photos where id = p_photo and status = 'approved') then
    return jsonb_build_object('ok', false);
  end if;
  if exists (select 1 from private.party_hearts where photo_id = p_photo and device = p_device) then
    delete from private.party_hearts where photo_id = p_photo and device = p_device;
    now_hearted := false;
  else
    insert into private.party_hearts (photo_id, device) values (p_photo, p_device);
    now_hearted := true;
  end if;
  select count(*) into total from private.party_hearts where photo_id = p_photo;
  update public.party_photos set hearts = total, updated_at = now() where id = p_photo;
  return jsonb_build_object('ok', true, 'hearted', now_hearted, 'hearts', total);
end;
$$;

-- Retrait par son propriétaire (l'appareil qui l'a envoyée).
create function public.party_remove(p_id uuid, p_device uuid)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare
  changed int;
begin
  update public.party_photos p
     set status = 'removed', updated_at = now()
   where p.id = p_id
     and p.status in ('reserved', 'approved', 'hidden')
     and exists (select 1 from private.party_owner o where o.photo_id = p.id and o.device = p_device);
  get diagnostics changed = row_count;
  return jsonb_build_object('ok', changed = 1);
end;
$$;

-- Côté organisateur (secret requis) ------------------------------------------

create function public.party_admin_get(p_secret text)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare
  s record;
begin
  if not private.check_secret(p_secret) then
    return jsonb_build_object('ok', false);
  end if;
  select upload_key, open_from, open_until into s from private.party_settings where id;
  return jsonb_build_object(
    'ok', true,
    'key', s.upload_key,
    'open_from', s.open_from,
    'open_until', s.open_until,
    'rows', coalesce((
      select jsonb_agg(to_jsonb(p) order by p.created_at desc)
      from (
        select id, created_at, updated_at, kind, author_name, caption, challenge, year, width, height, hearts, status
        from public.party_photos
        where status <> 'reserved'
        order by created_at desc
        limit 2000
      ) p
    ), '[]'::jsonb)
  );
end;
$$;

create function public.party_admin_set_status(p_secret text, p_id uuid, p_status text)
returns jsonb language plpgsql security definer set search_path = ''
as $$
begin
  if p_status not in ('approved', 'hidden', 'removed') or not private.check_secret(p_secret) then
    return jsonb_build_object('ok', false);
  end if;
  update public.party_photos set status = p_status, updated_at = now()
   where id = p_id and status <> 'reserved';
  return jsonb_build_object('ok', true);
end;
$$;

create function public.party_admin_set_window(p_secret text, p_from timestamptz, p_until timestamptz)
returns jsonb language plpgsql security definer set search_path = ''
as $$
begin
  if not private.check_secret(p_secret) then
    return jsonb_build_object('ok', false);
  end if;
  update private.party_settings set open_from = p_from, open_until = p_until where id;
  return jsonb_build_object('ok', true);
end;
$$;

-- Droits d'exécution: tout est fermé, puis on ouvre ce qui doit l'être.
revoke execute on function
  public.party_status(text),
  public.party_reserve(text, uuid, text, int),
  public.party_publish(uuid, uuid, text, text, text, int, int),
  public.party_list(text, timestamptz),
  public.party_heart(text, uuid, uuid),
  public.party_remove(uuid, uuid),
  public.party_admin_get(text),
  public.party_admin_set_status(text, uuid, text),
  public.party_admin_set_window(text, timestamptz, timestamptz)
from public;
grant execute on function
  public.party_status(text),
  public.party_reserve(text, uuid, text, int),
  public.party_publish(uuid, uuid, text, text, text, int, int),
  public.party_list(text, timestamptz),
  public.party_heart(text, uuid, uuid),
  public.party_remove(uuid, uuid),
  public.party_admin_get(text),
  public.party_admin_set_status(text, uuid, text),
  public.party_admin_set_window(text, timestamptz, timestamptz)
to anon, authenticated;
