-- Définit (ou remplace) le secret de modération du livre d'or.
-- 1) Remplacer REMPLACER-PAR-UNE-PHRASE-LONGUE par votre phrase (20 caractères minimum).
-- 2) Exécuter dans l'éditeur SQL Supabase. Ne jamais committer le vrai secret.
insert into private.moderation (id, secret_hash)
values (true, extensions.crypt('REMPLACER-PAR-UNE-PHRASE-LONGUE', extensions.gen_salt('bf')))
on conflict (id) do update set secret_hash = excluded.secret_hash;
