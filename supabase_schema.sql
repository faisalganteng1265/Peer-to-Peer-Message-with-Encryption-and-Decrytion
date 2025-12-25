create table users (
  id uuid default gen_random_uuid() primary key,
  username text unique not null,
  email text unique not null,
  password text not null,
  public_key text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table messages (
  id uuid default gen_random_uuid() primary key,
  sender_id uuid references users(id) on delete cascade not null,
  receiver_id uuid references users(id) on delete cascade not null,
  encrypted_content text not null,
  sender_encrypted_content text,
  is_read boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index messages_sender_idx on messages(sender_id);
create index messages_receiver_idx on messages(receiver_id);
create index messages_created_at_idx on messages(created_at desc);
