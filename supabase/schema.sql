-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create hotels table
CREATE TABLE hotels (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    location TEXT NOT NULL CHECK (location IN ('Male', 'Laamu', 'Faafu')),
    address TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create room_types table
CREATE TABLE room_types (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    hotel_id UUID REFERENCES hotels(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    capacity INTEGER NOT NULL,
    price_off_peak DECIMAL(10,2) NOT NULL,
    price_peak DECIMAL(10,2) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create rooms table
CREATE TABLE rooms (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    hotel_id UUID REFERENCES hotels(id) ON DELETE CASCADE,
    room_type_id UUID REFERENCES room_types(id) ON DELETE CASCADE,
    room_number TEXT NOT NULL,
    status TEXT DEFAULT 'Available' CHECK (status IN ('Available', 'Occupied', 'Cleaning', 'Out of Service')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(hotel_id, room_number)
);

-- Create profiles table (extends Supabase auth.users)
CREATE TABLE profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    role TEXT DEFAULT 'guest' CHECK (role IN ('guest', 'staff', 'manager', 'admin')),
    full_name TEXT NOT NULL,
    phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create bookings table
CREATE TABLE bookings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    guest_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    hotel_id UUID REFERENCES hotels(id) ON DELETE CASCADE,
    check_in DATE NOT NULL,
    check_out DATE NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CHECK (check_out > check_in)
);

-- Create booking_rooms table (many-to-many between bookings and rooms)
CREATE TABLE booking_rooms (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
    room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
    price_per_night DECIMAL(10,2) NOT NULL,
    UNIQUE(booking_id, room_id)
);

-- Create services table
CREATE TABLE services (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create booking_services table (many-to-many between bookings and services)
CREATE TABLE booking_services (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
    service_id UUID REFERENCES services(id) ON DELETE CASCADE,
    quantity INTEGER DEFAULT 1 CHECK (quantity > 0),
    UNIQUE(booking_id, service_id)
);

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE hotels ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_services ENABLE ROW LEVEL SECURITY;

-- Profiles table - RLS disabled to prevent recursion issues
-- Access control handled at application level

-- Hotels policies (public read access)
CREATE POLICY "Hotels are viewable by everyone" ON hotels
    FOR SELECT USING (true);

-- Room types policies (public read access)
CREATE POLICY "Room types are viewable by everyone" ON room_types
    FOR SELECT USING (true);

-- Rooms policies
CREATE POLICY "Rooms are viewable by everyone" ON rooms
    FOR SELECT USING (true);

CREATE POLICY "Staff can update room status" ON rooms
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('staff', 'manager', 'admin')
        )
    );

-- Services policies (public read access)
CREATE POLICY "Services are viewable by everyone" ON services
    FOR SELECT USING (true);

-- Bookings policies
CREATE POLICY "Users can view own bookings" ON bookings
    FOR SELECT USING (
        guest_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('staff', 'manager', 'admin')
        )
    );

CREATE POLICY "Guests can create bookings" ON bookings
    FOR INSERT WITH CHECK (guest_id = auth.uid());

CREATE POLICY "Users can update own bookings" ON bookings
    FOR UPDATE USING (
        guest_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('staff', 'manager', 'admin')
        )
    );

-- Booking rooms policies
CREATE POLICY "Booking rooms viewable by booking owner or staff" ON booking_rooms
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM bookings
            WHERE bookings.id = booking_id
            AND (bookings.guest_id = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM profiles
                    WHERE profiles.id = auth.uid()
                    AND profiles.role IN ('staff', 'manager', 'admin')
                )
            )
        )
    );

CREATE POLICY "Booking rooms insertable by booking owner" ON booking_rooms
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM bookings
            WHERE bookings.id = booking_id
            AND bookings.guest_id = auth.uid()
        )
    );

-- Booking services policies
CREATE POLICY "Booking services viewable by booking owner or staff" ON booking_services
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM bookings
            WHERE bookings.id = booking_id
            AND (bookings.guest_id = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM profiles
                    WHERE profiles.id = auth.uid()
                    AND profiles.role IN ('staff', 'manager', 'admin')
                )
            )
        )
    );

CREATE POLICY "Booking services insertable by booking owner" ON booking_services
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM bookings
            WHERE bookings.id = booking_id
            AND bookings.guest_id = auth.uid()
        )
    );

-- Function to handle profile creation after user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
        COALESCE(NEW.raw_user_meta_data->>'role', 'guest')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create profile after user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at
    BEFORE UPDATE ON bookings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();