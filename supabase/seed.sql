-- Insert hotels
INSERT INTO hotels (name, location, address) VALUES
('Muraka Male', 'Male', 'Ibrahim Nasir International Airport, Male 20026, Maldives'),
('Muraka Laamu', 'Laamu', 'Laamu Atoll, Maldives'),
('Muraka Faafu', 'Faafu', 'Faafu Atoll, Maldives');

-- Get hotel IDs for reference
DO $$
DECLARE
    male_hotel_id UUID;
    laamu_hotel_id UUID;
    faafu_hotel_id UUID;
    room_type_id UUID;
    service_id UUID;
BEGIN
    -- Get hotel IDs
    SELECT id INTO male_hotel_id FROM hotels WHERE location = 'Male';
    SELECT id INTO laamu_hotel_id FROM hotels WHERE location = 'Laamu';
    SELECT id INTO faafu_hotel_id FROM hotels WHERE location = 'Faafu';

    -- Insert room types for Male hotel
    INSERT INTO room_types (hotel_id, name, capacity, price_off_peak, price_peak, description) VALUES
    (male_hotel_id, 'Standard Double', 2, 120.00, 180.00, 'Comfortable double room with city view'),
    (male_hotel_id, 'Deluxe King', 2, 200.00, 280.00, 'Spacious king room with premium amenities'),
    (male_hotel_id, 'Family Suite', 4, 350.00, 450.00, 'Large suite perfect for families'),
    (male_hotel_id, 'Penthouse', 6, 800.00, 1200.00, 'Luxury penthouse with panoramic views');

    -- Insert room types for Laamu hotel
    INSERT INTO room_types (hotel_id, name, capacity, price_off_peak, price_peak, description) VALUES
    (laamu_hotel_id, 'Standard Double', 2, 150.00, 220.00, 'Comfortable double room with ocean view'),
    (laamu_hotel_id, 'Deluxe King', 2, 250.00, 350.00, 'Spacious king room with private balcony'),
    (laamu_hotel_id, 'Family Suite', 4, 400.00, 550.00, 'Large suite with separate living area'),
    (laamu_hotel_id, 'Penthouse', 6, 900.00, 1400.00, 'Luxury penthouse with private pool');

    -- Insert room types for Faafu hotel
    INSERT INTO room_types (hotel_id, name, capacity, price_off_peak, price_peak, description) VALUES
    (faafu_hotel_id, 'Standard Double', 2, 140.00, 200.00, 'Comfortable double room with garden view'),
    (faafu_hotel_id, 'Deluxe King', 2, 230.00, 320.00, 'Spacious king room with modern amenities'),
    (faafu_hotel_id, 'Family Suite', 4, 380.00, 500.00, 'Family-friendly suite with kitchenette'),
    (faafu_hotel_id, 'Penthouse', 6, 850.00, 1300.00, 'Luxury penthouse with sunset terrace');

    -- Insert rooms for Male hotel
    FOR room_type_rec IN SELECT id, name FROM room_types WHERE hotel_id = male_hotel_id
    LOOP
        FOR i IN 1..10 LOOP
            INSERT INTO rooms (hotel_id, room_type_id, room_number, status) VALUES
            (male_hotel_id, room_type_rec.id,
             CASE
                WHEN room_type_rec.name = 'Standard Double' THEN '10' || LPAD(i::TEXT, 2, '0')
                WHEN room_type_rec.name = 'Deluxe King' THEN '20' || LPAD(i::TEXT, 2, '0')
                WHEN room_type_rec.name = 'Family Suite' THEN '30' || LPAD(i::TEXT, 2, '0')
                WHEN room_type_rec.name = 'Penthouse' THEN '40' || LPAD(i::TEXT, 2, '0')
             END,
             CASE WHEN i <= 8 THEN 'Available' ELSE 'Occupied' END);
        END LOOP;
    END LOOP;

    -- Insert rooms for Laamu hotel
    FOR room_type_rec IN SELECT id, name FROM room_types WHERE hotel_id = laamu_hotel_id
    LOOP
        FOR i IN 1..10 LOOP
            INSERT INTO rooms (hotel_id, room_type_id, room_number, status) VALUES
            (laamu_hotel_id, room_type_rec.id,
             CASE
                WHEN room_type_rec.name = 'Standard Double' THEN '10' || LPAD(i::TEXT, 2, '0')
                WHEN room_type_rec.name = 'Deluxe King' THEN '20' || LPAD(i::TEXT, 2, '0')
                WHEN room_type_rec.name = 'Family Suite' THEN '30' || LPAD(i::TEXT, 2, '0')
                WHEN room_type_rec.name = 'Penthouse' THEN '40' || LPAD(i::TEXT, 2, '0')
             END,
             CASE WHEN i <= 7 THEN 'Available' ELSE 'Occupied' END);
        END LOOP;
    END LOOP;

    -- Insert rooms for Faafu hotel
    FOR room_type_rec IN SELECT id, name FROM room_types WHERE hotel_id = faafu_hotel_id
    LOOP
        FOR i IN 1..10 LOOP
            INSERT INTO rooms (hotel_id, room_type_id, room_number, status) VALUES
            (faafu_hotel_id, room_type_rec.id,
             CASE
                WHEN room_type_rec.name = 'Standard Double' THEN '10' || LPAD(i::TEXT, 2, '0')
                WHEN room_type_rec.name = 'Deluxe King' THEN '20' || LPAD(i::TEXT, 2, '0')
                WHEN room_type_rec.name = 'Family Suite' THEN '30' || LPAD(i::TEXT, 2, '0')
                WHEN room_type_rec.name = 'Penthouse' THEN '40' || LPAD(i::TEXT, 2, '0')
             END,
             CASE WHEN i <= 9 THEN 'Available' ELSE 'Occupied' END);
        END LOOP;
    END LOOP;

END $$;

-- Insert services
INSERT INTO services (name, price) VALUES
('Airport Transfer', 50.00),
('Breakfast', 20.00),
('Spa Access', 35.00),
('Late Checkout', 40.00);

-- Function to create test user profile (call after signup)
CREATE OR REPLACE FUNCTION create_test_user_profile(
    user_id UUID,
    user_email TEXT,
    user_role TEXT,
    user_name TEXT
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO profiles (id, role, full_name, phone)
    VALUES (user_id, user_role, user_name, '+960-7777777')
    ON CONFLICT (id) DO UPDATE SET
        role = EXCLUDED.role,
        full_name = EXCLUDED.full_name,
        phone = EXCLUDED.phone;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;