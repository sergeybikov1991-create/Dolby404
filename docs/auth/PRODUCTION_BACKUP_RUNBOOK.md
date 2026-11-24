# FLOUSTREAM — no-cost pre-Clerk backup runbook

Status: preparation only. No backup has been created or downloaded by this runbook.

## Why this is mandatory

The current Supabase Free plan does not provide automatic daily database backups. A SQL rollback file is not a data backup. A complete recovery point must include:
1. PostgreSQL schema and data, including `auth.users` password hashes and `storage.objects` metadata.
2. Every Storage object from every bucket.
3. A local, encrypted copy that has been checked for readability.

The Supabase CLI `db dump` command deliberately excludes Supabase-managed `auth` and `storage` schemas. Do not use it as the only backup for this migration.

## Current Storage inventory

The production project currently has 10 buckets. The read-only audit found 60 objects across 7 buckets; no object names or user file contents were retrieved.

| Bucket | Objects |
|---|---:|
| `avatars` | 8 |
| `message-media` | 27 |
| `music-private` | 0 |
| `music-public` | 1 |
| `photo-albums` | 16 |
| `posts` | 5 |
| `private-albums` | 2 |
| `private-video-albums` | 0 |
| `video-albums` | 1 |

## Database backup

Use a local trusted device with PostgreSQL 17 client tools. Do not put credentials in GitHub, this repository, screenshots, or ChatGPT messages.

1. In Supabase Dashboard → Connect, copy the **Session pooler** connection string. Connect as `postgres`.
2. In a terminal, enter the URL without saving it in shell history:

```bash
read -r -s -p "Supabase Session Pooler URL: " SUPABASE_DB_URL
echo
export SUPABASE_DB_URL
```

3. Create a protected backup directory and dump the complete database directly with `pg_dump` (not `supabase db dump`):

```bash
umask 077
mkdir -p floustream-pre-clerk-backup/database
pg_dump --format=custom --no-owner --no-acl \
  --dbname="$SUPABASE_DB_URL" \
  --file=floustream-pre-clerk-backup/database/full.dump
pg_restore --list floustream-pre-clerk-backup/database/full.dump > /dev/null
```

The dump includes the database schemas and data, including the Auth and Storage metadata schemas. Keep the file encrypted and private because it contains password hashes and user data.

## Storage objects backup

1. Install the Supabase CLI and sign in locally with `supabase login`. The access token is entered into the CLI prompt and must not be pasted into chat.
2. Link the project:

```bash
supabase link --project-ref qhpobdktlbhdqsnajypr
```

3. Download every bucket recursively. Use a separate destination directory for each bucket:

```bash
mkdir -p floustream-pre-clerk-backup/storage
for bucket in avatars message-media music-private music-public photo-albums posts private-albums private-video-albums video-albums; do
  mkdir -p "floustream-pre-clerk-backup/storage/$bucket"
  supabase storage cp -r --experimental --remote=qhpobdktlbhdqsnajypr \
    "ss:///$bucket" "floustream-pre-clerk-backup/storage/$bucket"
done
```

4. Count the downloaded files and compare them with the inventory above. If the CLI version rejects the recursive copy syntax, stop and check `supabase storage cp --help`; do not substitute a destructive command.

## Encrypt and verify

Encrypt the database dump and Storage archive with a strong passphrase that is stored separately from the backup:

```bash
gpg --symmetric --cipher-algo AES256 \
  --output floustream-pre-clerk-backup/database/full.dump.gpg \
  floustream-pre-clerk-backup/database/full.dump

tar -C floustream-pre-clerk-backup -czf - storage | \
  gpg --symmetric --cipher-algo AES256 \
  --output floustream-pre-clerk-backup/storage.tar.gz.gpg
```

Verify both encrypted files by decrypting into a temporary directory on the same trusted device:

```bash
mkdir -p /tmp/floustream-backup-verify
gpg --decrypt floustream-pre-clerk-backup/database/full.dump.gpg \
  > /tmp/floustream-backup-verify/full.dump
pg_restore --list /tmp/floustream-backup-verify/full.dump > /dev/null

gpg --decrypt floustream-pre-clerk-backup/storage.tar.gz.gpg \
  > /tmp/floustream-backup-verify/storage.tar.gz
tar -tzf /tmp/floustream-backup-verify/storage.tar.gz > /dev/null
```

Only after both checks succeed should you remove the unencrypted intermediate copies and temporary verification directory. Keep a second copy of the encrypted backup on a separate device or offline medium; do not upload it to this public GitHub repository.

A successful archive-list check is not a restore rehearsal. Restore the dump into a disposable local Supabase/PostgreSQL environment matching the production PostgreSQL major version, and verify that the restored `auth.users`, `public.profiles`, `storage.buckets`, and `storage.objects` counts match the source audit. Restore the Storage archive to a separate local directory and compare all 60 object files. Never restore over the production project during this rehearsal.

## Cutover gate

Do not apply the Clerk identity/RLS migration or switch any provider until:
- database dump is present and passes the archive check;
- all 10 bucket directories are accounted for and the 60 existing objects are present;
- encrypted backups exist in two separate locations;
- a restore rehearsal has been completed on an isolated PostgreSQL instance;
- the user has approved the cutover window.

This procedure uses existing Supabase Free and local tools; it does not require creating a paid Supabase branch or enabling a paid backup add-on.
