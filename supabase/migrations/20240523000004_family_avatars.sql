-- Create the family_avatars bucket
insert into storage.buckets (id, name, public)
values ('family_avatars', 'family_avatars', true)
on conflict (id) do nothing;

-- Enable RLS
alter table storage.objects enable row level security;

-- Policy: Public read access
create policy "Public Read Access"
on storage.objects for select
using ( bucket_id = 'family_avatars' );

-- Policy: Authenticated users can upload (Insert)
create policy "Authenticated users can upload"
on storage.objects for insert
with check (
  bucket_id = 'family_avatars'
  and auth.role() = 'authenticated'
);

-- Policy: Authenticated users can update
create policy "Authenticated users can update"
on storage.objects for update
using (
  bucket_id = 'family_avatars'
  and auth.role() = 'authenticated'
);
