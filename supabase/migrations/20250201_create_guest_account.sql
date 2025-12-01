-- Create a single guest account directly
INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_user_meta_data,
    created_at,
    updated_at
)
VALUES (
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000000',
    'guest@muraka.dev',
    crypt('Welcome@123', gen_salt('bf')),
    now(),
    '{"full_name":"Guest User","role":"guest"}'::jsonb,
    now(),
    now()
)
ON CONFLICT DO NOTHING;
