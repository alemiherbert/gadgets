-- Move the default setup admin to the store's support inbox so that
-- "Forgot password" emails reach a real mailbox.
update admins
set email = 'support@ojsonlinestore.com'
where email = 'admin@store.com'
  and not exists (select 1 from admins where email = 'support@ojsonlinestore.com');
