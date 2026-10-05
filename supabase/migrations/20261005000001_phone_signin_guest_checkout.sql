-- Customers can sign up with just a phone number; email becomes optional.
alter table customers alter column email drop not null;

-- Phone numbers are stored as +256XXXXXXXXX and used to sign in, so they must be unique.
update customers
set phone = '+256' || right(regexp_replace(phone, '[^0-9]', '', 'g'), 9)
where regexp_replace(phone, '[^0-9]', '', 'g') ~ '^(256|0)?[3-9][0-9]{8}$';

create unique index if not exists idx_customers_phone_unique
  on customers (phone)
  where phone <> '';

-- Guest checkout: email is optional on orders.
alter table orders alter column email set default '';
