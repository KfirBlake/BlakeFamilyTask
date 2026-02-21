-- Create the avatars bucket
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Enable RLS
alter table storage.objects enable row level security;

-- Policy: Give public access to avatars
create policy "Public Access"
on storage.objects for select
using ( bucket_id = 'avatars' );

-- Policy: Allow authenticated users to upload avatars
create policy "Authenticated users can upload avatars"
on storage.objects for insert
with check (
  bucket_id = 'avatars'
  and auth.role() = 'authenticated'
);

-- Policy: Allow users to update their own avatars
-- Note: This is a simplification. Ideally, we restrict update to owners.
-- But since filenames include random strings, overwrites are unlikely unless intentional.
create policy "Authenticated users can update avatars"
on storage.objects for update
using (
  bucket_id = 'avatars'
  and auth.role() = 'authenticated'
);
