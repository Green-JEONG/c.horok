-- Move horok-tech domain tables from public to horok_tech.
-- Keep shared auth/account tables such as public.users in public.
-- Run this only after verifying backups and checking app downtime window.

BEGIN;

CREATE SCHEMA IF NOT EXISTS horok_tech;

ALTER TABLE IF EXISTS public.categories SET SCHEMA horok_tech;
ALTER TABLE IF EXISTS public.posts SET SCHEMA horok_tech;
ALTER TABLE IF EXISTS public.comments SET SCHEMA horok_tech;
ALTER TABLE IF EXISTS public.post_likes SET SCHEMA horok_tech;
ALTER TABLE IF EXISTS public.post_views SET SCHEMA horok_tech;
ALTER TABLE IF EXISTS public.stop_words SET SCHEMA horok_tech;

COMMIT;

-- Tables intentionally left in public by default:
-- public.users
-- public.verification_tokens
--
-- Tables below need a product decision before moving because they may be shared
-- across platforms depending on your roadmap:
-- public.friends
-- public.notifications
-- public.chat_threads
-- public.chat_messages
