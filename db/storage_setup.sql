-- Create storage buckets
insert into storage.buckets (id, name, public) values ('kyc-docs', 'kyc-docs', false);
insert into storage.buckets (id, name, public) values ('collateral', 'collateral', false);
insert into storage.buckets (id, name, public) values ('payment-proofs', 'payment-proofs', false);



-- Policy: Allow authenticated users to upload to 'kyc-docs' (own folder)
create policy "Users can upload kyc-docs" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'kyc-docs' and auth.uid()::text = (storage.foldername(name))[1]);

-- Policy: Allow authenticated users to read 'kyc-docs' (own folder)
create policy "Users can read own kyc-docs" on storage.objects
  for select to authenticated
  using (bucket_id = 'kyc-docs' and auth.uid()::text = (storage.foldername(name))[1]);

-- Policy: Allow authenticated users to upload to 'collateral' (own folder)
create policy "Users can upload collateral" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'collateral' and auth.uid()::text = (storage.foldername(name))[1]);

-- Policy: Allow authenticated users to read 'collateral' (own folder)
create policy "Users can read own collateral" on storage.objects
  for select to authenticated
  using (bucket_id = 'collateral' and auth.uid()::text = (storage.foldername(name))[1]);

-- Policy: Allow authenticated users to upload to 'payment-proofs' (own folder)
create policy "Users can upload payment-proofs" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'payment-proofs' and auth.uid()::text = (storage.foldername(name))[1]);

-- Policy: Allow authenticated users to read 'payment-proofs' (own folder)
create policy "Users can read own payment-proofs" on storage.objects
  for select to authenticated
  using (bucket_id = 'payment-proofs' and auth.uid()::text = (storage.foldername(name))[1]);
  
-- Policy: Allow ADMINS to read ALL files in these buckets
create policy "Admins can read all kyc-docs" on storage.objects
  for select to authenticated
  using (bucket_id = 'kyc-docs' and exists (select 1 from public.users where id = auth.uid() and role = 'admin'));

create policy "Admins can read all collateral" on storage.objects
  for select to authenticated
  using (bucket_id = 'collateral' and exists (select 1 from public.users where id = auth.uid() and role = 'admin'));
  
create policy "Admins can read all payment-proofs" on storage.objects
  for select to authenticated
  using (bucket_id = 'payment-proofs' and exists (select 1 from public.users where id = auth.uid() and role = 'admin'));
