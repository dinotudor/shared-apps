-- Accent-insensitive dish search: "feijao" finds "Feijão" (docs/adr/0008).
-- unaccent is a trusted extension, so the database owner can create it without superuser.
-- Extensions belong to the whole database, not to a module, so it lives in public.
CREATE EXTENSION IF NOT EXISTS unaccent WITH SCHEMA public;
