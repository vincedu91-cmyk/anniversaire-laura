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
