-- Business Documents Table
create table public.business_documents (
  id uuid default gen_random_uuid() primary key,
  business_id uuid references public.businesses(id) not null,
  document_type text not null, -- 'registration', 'tax', 'license', 'other'
  file_url text not null,
  status text default 'pending' not null, -- 'pending', 'verified', 'rejected'
  uploaded_at timestamptz default now() not null,
  verified_at timestamptz,
  notes text
);

-- RLS
alter table public.business_documents enable row level security;

-- Policies for Business Documents
-- Business admins can read their own documents
create policy "Business admins can read own docs" on public.business_documents
  for select using (
    exists (
      select 1 from public.business_memberships bm
      where bm.business_id = business_documents.business_id
      and bm.user_id = auth.uid()
      and bm.role in ('owner', 'admin', 'finance_officer')
    )
  );

-- Business admins can insert their own documents
create policy "Business admins can insert own docs" on public.business_documents
  for insert with check (
    exists (
      select 1 from public.business_memberships bm
      where bm.business_id = business_documents.business_id
      and bm.user_id = auth.uid()
      and bm.role in ('owner', 'admin')
    )
  );

-- System admins (if any) or Business Admins can update (e.g. status or delete)
-- For now, let business admins delete or update notes? Status should be system/super-admin managed ideally, 
-- but for this MVP, business admins upload them. 
create policy "Business admins can update own docs" on public.business_documents
  for update using (
    exists (
      select 1 from public.business_memberships bm
      where bm.business_id = business_documents.business_id
      and bm.user_id = auth.uid()
      and bm.role in ('owner', 'admin')
    )
  );


-- Storage Bucket Policies (Simulated SQL for setup)
-- insert into storage.buckets (id, name, public) values ('business-docs', 'business-docs', false);

-- Storage Objects Policies
-- Allow business admins to upload to business-docs bucket
-- (This usually requires matching the path prefix to business_id)
-- For pilot, we'll assume the path is `{business_id}/{filename}`
