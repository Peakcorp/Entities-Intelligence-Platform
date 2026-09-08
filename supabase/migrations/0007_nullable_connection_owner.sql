-- email_connections and chat_sessions required user_id NOT NULL, which breaks the
-- realistic case of an IT admin connecting a mailbox before that employee has an
-- auth.users row of their own, and system-generated chat threads with no single owner.

alter table email_connections alter column user_id drop not null;
alter table chat_sessions alter column user_id drop not null;
