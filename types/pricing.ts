/**
 * Pricing System Types and Interfaces
 * Complete type definitions for the Muraka Hotel Management System pricing structure
 */

// ========================================
// ENUMS
// ========================================

export enum Currency {
  GBP = 'GBP',
  USD = 'USD',
  EUR = 'EUR',
}

export enum RoomType {
  STANDARD_DOUBLE = 'Standard Double',
  DELUXE_KING = 'Deluxe King',
  FAMILY_SUITE = 'Family Suite',
  PENTHOUSE = 'Penthouse',
}

export enum ServiceCategory {
  TRANSFER = 'transfer',
  FOOD = 'food',
  WELLNESS = 'wellness',
  OTHER = 'other',
}

export enum ServiceUnitType {
  PER_OCCURRENCE = 'per_occurrence',
  PER_PERSON_PER_DAY = 'per_person_per_day',
  PER_TRANSFER = 'per_transfer',
}

export enum CancellationFeeType {
  PERCENTAGE = 'percentage',
  FIXED = 'fixed',
  NIGHTS = 'nights',
}

// ========================================
// ROOM TYPES & PRICING
// ========================================

export interface RoomTypeDefinition {
  id: string;
  name: RoomType;
  capacity: number;
  price_off_peak: number;
  price_peak: number;
  currency: Currency;
  description: string;
  description_full?: string;
  amenities?: string[];
  hotel_id: string;
  created_at: string;
}

export interface RoomPricingInfo {
  room_type_id: string;
  room_name: string;
  capacity: number;
  price_off_peak: number;
  price_peak: number;
  currency: Currency;
  availability_status: 'Available' | 'Occupied' | 'Cleaning' | 'Out of Service';
}

// ========================================
// PEAK SEASONS
// ========================================

export interface PeakSeasonDefinition {
  id: string;
  hotel_id: string;
  name: string;
  start_date: string; // ISO date format YYYY-MM-DD
  end_date: string;
  multiplier: number; // 1.0 = base price, 1.5 = 50% increase
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PeakSeasonInput {
  hotel_id: string;
  name: string;
  start_date: string;
  end_date: string;
  multiplier?: number;
}

// ========================================
// SERVICES & ANCILLARY FEES
// ========================================

export interface ServiceDefinition {
  id: string;
  name: string;
  price: number;
  currency: Currency;
  unit_type: ServiceUnitType;
  category: ServiceCategory;
  is_active: boolean;
  created_at: string;
}

export const STANDARD_SERVICES: Record<string, ServiceDefinition> = {
  AIRPORT_TRANSFER: {
    id: '',
    name: 'Airport Transfer (One-way)',
    price: 50,
    currency: Currency.GBP,
    unit_type: ServiceUnitType.PER_TRANSFER,
    category: ServiceCategory.TRANSFER,
    is_active: true,
    created_at: '',
  },
  BREAKFAST: {
    id: '',
    name: 'Full English Breakfast',
    price: 20,
    currency: Currency.GBP,
    unit_type: ServiceUnitType.PER_PERSON_PER_DAY,
    category: ServiceCategory.FOOD,
    is_active: true,
    created_at: '',
  },
  SPA_ACCESS: {
    id: '',
    name: 'Spa Access',
    price: 35,
    currency: Currency.GBP,
    unit_type: ServiceUnitType.PER_PERSON_PER_DAY,
    category: ServiceCategory.WELLNESS,
    is_active: true,
    created_at: '',
  },
  LATE_CHECKOUT: {
    id: '',
    name: 'Late Check-out (until 2 PM)',
    price: 40,
    currency: Currency.GBP,
    unit_type: ServiceUnitType.PER_OCCURRENCE,
    category: ServiceCategory.OTHER,
    is_active: true,
    created_at: '',
  },
};

export interface BookingService {
  service_id: string;
  service_name: string;
  quantity: number;
  unit_type: ServiceUnitType;
  price_per_unit: number;
  total_cost: number;
}

// ========================================
// CANCELLATION FEES
// ========================================

export interface CancellationFeeRule {
  id: string;
  hotel_id: string;
  days_before_checkin_min: number;
  days_before_checkin_max: number;
  fee_type: CancellationFeeType;
  fee_value: number;
  description: string;
  is_active: boolean;
  created_at: string;
}

// Standard cancellation policy:
// >14 days: £0 (free)
// 3-14 days: 50% of first night
// <72 hours: 100% of first night
// No-show: 100% of entire booking

export const STANDARD_CANCELLATION_POLICY: Record<string, Omit<CancellationFeeRule, 'id' | 'hotel_id' | 'created_at'>> = {
  FREE: {
    days_before_checkin_min: 15,
    days_before_checkin_max: 9999,
    fee_type: CancellationFeeType.PERCENTAGE,
    fee_value: 0,
    description: 'More than 14 days before check-in: Free cancellation',
    is_active: true,
  },
  PARTIAL: {
    days_before_checkin_min: 3,
    days_before_checkin_max: 14,
    fee_type: CancellationFeeType.NIGHTS,
    fee_value: 1, // 50% of first night (1 night at price)
    description: '3-14 days before check-in: 50% of first night stay',
    is_active: true,
  },
  FULL_NIGHT: {
    days_before_checkin_min: 0,
    days_before_checkin_max: 2,
    fee_type: CancellationFeeType.NIGHTS,
    fee_value: 1, // 100% of first night
    description: 'Less than 72 hours before check-in: 100% of first night stay',
    is_active: true,
  },
};

export interface CancellationFeeCalculation {
  fee_amount: number;
  fee_percentage: number;
  description: string;
  refund_amount: number;
  days_before_checkin: number;
  currency: Currency;
}

// ========================================
// BOOKING COST CALCULATIONS
// ========================================

export interface RoomPriceCalculation {
  base_price: number;
  is_peak: boolean;
  applied_price: number;
  num_nights: number;
  total_price: number;
}

export interface ItemizedBookingCost {
  // Room charges
  room_cost: number;
  room_nights: number;
  room_per_night: number;
  is_peak: boolean;

  // Services
  services_cost: number;
  services: BookingService[];

  // Totals
  subtotal: number;
  tax_amount: number;
  tax_rate: number;
  total_cost: number;

  // Currency
  currency: Currency;
}

export interface BookingCostBreakdown {
  itemized: ItemizedBookingCost;
  payment_due: number;
  currency: Currency;
  breakdown_items: {
    label: string;
    amount: number;
  }[];
}

// ========================================
// PRICING API RESPONSES
// ========================================

export interface PricingEstimate {
  check_in: string;
  check_out: string;
  hotel_id: string;
  room_type_id: string;
  room_name: string;
  price_per_night: number;
  is_peak_season: boolean;
  num_nights: number;
  room_total: number;
  available_services: ServiceDefinition[];
  estimated_total: number;
  currency: Currency;
}

export interface CancellationPolicyInfo {
  hotel_id: string;
  rules: CancellationFeeRule[];
  description: string;
  examples: {
    days_before: number;
    fee_percentage: number;
    description: string;
  }[];
}

// ========================================
// PRICING AUDIT
// ========================================

export interface PricingAuditEntry {
  id: string;
  room_type_id?: string;
  service_id?: string;
  old_price: number;
  new_price: number;
  changed_by: string;
  change_reason?: string;
  created_at: string;
}

// ========================================
// REQUEST/RESPONSE TYPES
// ========================================

export interface CreatePeakSeasonRequest {
  hotel_id: string;
  name: string;
  start_date: string;
  end_date: string;
  multiplier?: number;
}

export interface UpdateServicePriceRequest {
  service_id: string;
  new_price: number;
  reason?: string;
}

export interface UpdateRoomPriceRequest {
  room_type_id: string;
  price_off_peak?: number;
  price_peak?: number;
  reason?: string;
}

export interface GetPricingEstimateRequest {
  hotel_id: string;
  check_in: string;
  check_out: string;
  room_type_id: string;
  services?: Array<{
    service_id: string;
    quantity: number;
  }>;
}

export interface GetCancellationFeeRequest {
  hotel_id: string;
  check_in: string;
  cancellation_date: string;
  first_night_price: number;
  total_booking_price: number;
}
