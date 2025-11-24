-- ========================================
-- DELETE ALL EXISTING USERS - START FRESH
-- ========================================
-- WARNING: This will delete ALL users and their related data
-- Run this in Supabase SQL Editor to clean everything up

-- Step 1: Delete all profiles (dependent on auth.users)
DELETE FROM public.profiles;

-- Step 2: Delete all bookings and related data
DELETE FROM public.booking_services;
DELETE FROM public.booking_rooms;
DELETE FROM public.bookings;

-- Step 3: Delete all payments
DELETE FROM public.payments;

-- Step 4: Delete all auth users
-- Note: Profiles must be deleted first due to foreign key constraints
DELETE FROM auth.users;

-- Verify deletion
SELECT 'Total auth users remaining:' as status, COUNT(*) FROM auth.users;
SELECT 'Total profiles remaining:' as status, COUNT(*) FROM public.profiles;
SELECT 'Total bookings remaining:' as status, COUNT(*) FROM public.bookings;
SELECT 'Total payments remaining:' as status, COUNT(*) FROM public.payments;

-- If you want to see what will be deleted before running the DELETE commands:
-- SELECT 'Auth users to delete:' as status, COUNT(*) FROM auth.users;
-- SELECT 'Profiles to delete:' as status, COUNT(*) FROM public.profiles;
-- SELECT 'Bookings to delete:' as status, COUNT(*) FROM public.bookings;
-- SELECT 'Payments to delete:' as status, COUNT(*) FROM public.payments;
