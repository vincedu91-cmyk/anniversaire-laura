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
