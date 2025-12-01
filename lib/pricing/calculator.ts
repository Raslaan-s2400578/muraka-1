/**
 * Pricing Calculator Utilities
 * Comprehensive pricing calculations for bookings, services, and cancellation fees
 */

import {
  ItemizedBookingCost,
  CancellationFeeCalculation,
  RoomPriceCalculation,
  BookingService,
  Currency,
  ServiceUnitType,
  CancellationFeeType,
} from '@/types/pricing'

// ========================================
// DATE UTILITIES
// ========================================

/**
 * Calculate number of nights between check-in and check-out
 */
export function calculateNights(checkIn: Date | string, checkOut: Date | string): number {
  const start = typeof checkIn === 'string' ? new Date(checkIn) : checkIn
  const end = typeof checkOut === 'string' ? new Date(checkOut) : checkOut
  const diffTime = Math.abs(end.getTime() - start.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays
}

/**
 * Calculate days between two dates
 */
export function calculateDaysBetween(date1: Date | string, date2: Date | string): number {
  const d1 = typeof date1 === 'string' ? new Date(date1) : date1
  const d2 = typeof date2 === 'string' ? new Date(date2) : date2
  const diffTime = Math.abs(d2.getTime() - d1.getTime())
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

/**
 * Check if date falls within a date range
 */
export function isDateInRange(date: Date | string, start: Date | string, end: Date | string): boolean {
  const d = typeof date === 'string' ? new Date(date) : date
  const s = typeof start === 'string' ? new Date(start) : start
  const e = typeof end === 'string' ? new Date(end) : end
  return d >= s && d <= e
}

// ========================================
// ROOM PRICING
// ========================================

/**
 * Calculate room price for given dates
 * Returns base price, applied price (peak or off-peak), and total
 */
export function calculateRoomPrice(
  priceOffPeak: number,
  pricePeak: number,
  nights: number,
  isPeakSeason: boolean
): RoomPriceCalculation {
  const appliedPrice = isPeakSeason ? pricePeak : priceOffPeak
  const totalPrice = appliedPrice * nights

  return {
    base_price: priceOffPeak,
    is_peak: isPeakSeason,
    applied_price: appliedPrice,
    num_nights: nights,
    total_price: totalPrice,
  }
}

/**
 * Calculate room price based on check-in and check-out dates
 */
export function calculateRoomPriceByDates(
  priceOffPeak: number,
  pricePeak: number,
  checkIn: Date | string,
  checkOut: Date | string,
  isPeakSeason: boolean
): RoomPriceCalculation {
  const nights = calculateNights(checkIn, checkOut)
  return calculateRoomPrice(priceOffPeak, pricePeak, nights, isPeakSeason)
}

// ========================================
// SERVICE COSTS
// ========================================

/**
 * Calculate cost for a single service
 */
export function calculateServiceCost(
  price: number,
  quantity: number,
  unitType: ServiceUnitType,
  numNights?: number
): number {
  switch (unitType) {
    case ServiceUnitType.PER_OCCURRENCE:
      return price * quantity
    case ServiceUnitType.PER_TRANSFER:
      return price * quantity
    case ServiceUnitType.PER_PERSON_PER_DAY:
      if (!numNights) throw new Error('numNights required for per_person_per_day calculation')
      return price * quantity * numNights
    default:
      return price * quantity
  }
}

/**
 * Calculate total services cost with itemization
 */
export function calculateServicesCost(
  services: Array<{
    id: string
    name: string
    price: number
    unit_type: ServiceUnitType
    quantity: number
  }>,
  numNights: number
): { total: number; items: BookingService[] } {
  let total = 0
  const items: BookingService[] = []

  for (const service of services) {
    const cost = calculateServiceCost(service.price, service.quantity, service.unit_type, numNights)
    total += cost

    items.push({
      service_id: service.id,
      service_name: service.name,
      quantity: service.quantity,
      unit_type: service.unit_type,
      price_per_unit: service.price,
      total_cost: cost,
    })
  }

  return { total, items }
}

// ========================================
// CANCELLATION FEES
// ========================================

/**
 * Calculate cancellation fee based on cancellation date and policy
 */
export function calculateCancellationFee(
  checkInDate: Date | string,
  cancellationDate: Date | string,
  firstNightPrice: number,
  totalBookingPrice: number,
  cancellationPolicy: {
    days_before: number
    fee_type: CancellationFeeType
    fee_value: number
  }
): CancellationFeeCalculation {
  const checkIn = typeof checkInDate === 'string' ? new Date(checkInDate) : checkInDate
  const cancellation = typeof cancellationDate === 'string' ? new Date(cancellationDate) : cancellationDate

  const daysBeforeCheckIn = calculateDaysBetween(cancellation, checkIn)

  let feeAmount = 0
  let feePercentage = 0

  switch (cancellationPolicy.fee_type) {
    case CancellationFeeType.PERCENTAGE:
      feePercentage = cancellationPolicy.fee_value
      feeAmount = (totalBookingPrice * cancellationPolicy.fee_value) / 100
      break

    case CancellationFeeType.NIGHTS:
      // fee_value represents number of nights to charge
      feeAmount = firstNightPrice * cancellationPolicy.fee_value
      feePercentage = (feeAmount / totalBookingPrice) * 100
      break

    case CancellationFeeType.FIXED:
      feeAmount = cancellationPolicy.fee_value
      feePercentage = (feeAmount / totalBookingPrice) * 100
      break
  }

  return {
    fee_amount: Math.round(feeAmount * 100) / 100,
    fee_percentage: Math.round(feePercentage * 100) / 100,
    description: `${cancellationPolicy.days_before} days before check-in: ${feePercentage.toFixed(0)}% charge`,
    refund_amount: Math.round((totalBookingPrice - feeAmount) * 100) / 100,
    days_before_checkin: daysBeforeCheckIn,
    currency: 'GBP' as Currency,
  }
}

/**
 * Get applicable cancellation fee rule based on days before check-in
 */
export function getApplicableCancellationRule(
  daysBeforeCheckIn: number,
  rules: Array<{
    days_before_checkin_min: number
    days_before_checkin_max: number
    fee_type: CancellationFeeType
    fee_value: number
  }>
): (typeof rules)[0] | null {
  return (
    rules.find(
      (rule) =>
        daysBeforeCheckIn >= rule.days_before_checkin_min &&
        daysBeforeCheckIn <= rule.days_before_checkin_max
    ) || null
  )
}

// ========================================
// COMPLETE BOOKING COST CALCULATION
// ========================================

/**
 * Calculate complete itemized booking cost
 */
export function calculateItemizedBookingCost(
  roomCostBreakdown: RoomPriceCalculation,
  services: Array<{
    id: string
    name: string
    price: number
    unit_type: ServiceUnitType
    quantity: number
  }> = [],
  taxRate: number = 0.2, // 20% VAT
  currency: Currency = Currency.GBP
): ItemizedBookingCost {
  // Calculate room costs
  const roomCost = roomCostBreakdown.total_price

  // Calculate service costs
  const { total: servicesCost, items: serviceItems } = calculateServicesCost(
    services,
    roomCostBreakdown.num_nights
  )

  // Calculate subtotal
  const subtotal = roomCost + servicesCost

  // Calculate tax
  const taxAmount = subtotal * taxRate

  // Calculate total
  const totalCost = subtotal + taxAmount

  return {
    room_cost: Math.round(roomCost * 100) / 100,
    room_nights: roomCostBreakdown.num_nights,
    room_per_night: roomCostBreakdown.applied_price,
    is_peak: roomCostBreakdown.is_peak,
    services_cost: Math.round(servicesCost * 100) / 100,
    services: serviceItems,
    subtotal: Math.round(subtotal * 100) / 100,
    tax_amount: Math.round(taxAmount * 100) / 100,
    tax_rate: taxRate,
    total_cost: Math.round(totalCost * 100) / 100,
    currency,
  }
}

// ========================================
// PRICING FORMATTING
// ========================================

/**
 * Format currency amount to string with proper symbols
 */
export function formatCurrency(amount: number, currency: Currency = Currency.GBP): string {
  const symbols: Record<Currency, string> = {
    GBP: '£',
    USD: '$',
    EUR: '€',
  }

  const symbol = symbols[currency] || '£'
  return `${symbol}${amount.toFixed(2)}`
}

/**
 * Format price per night display
 */
export function formatPricePerNight(price: number, currency: Currency = Currency.GBP): string {
  return `${formatCurrency(price, currency)}/night`
}

/**
 * Create formatted booking summary
 */
export function createBookingSummary(cost: ItemizedBookingCost): string[] {
  const lines: string[] = []

  lines.push('=== BOOKING SUMMARY ===')
  lines.push('')
  lines.push('ROOM CHARGES')
  const peakLabel = cost.is_peak ? '(PEAK)' : '(OFF-PEAK)'
  const nightLabel = cost.room_nights > 1 ? 's' : ''
  lines.push(`  ${cost.room_nights} night${nightLabel} @ ${formatCurrency(cost.room_per_night)} ${peakLabel}  ${formatCurrency(cost.room_cost)}`)

  if (cost.services.length > 0) {
    lines.push('')
    lines.push('SERVICES')
    cost.services.forEach((service) => {
      lines.push(`  ${service.service_name} x${service.quantity}  ${formatCurrency(service.total_cost)}`)
    })
  }

  lines.push('')
  lines.push('PRICING SUMMARY')
  lines.push(`  Subtotal:  ${formatCurrency(cost.subtotal, cost.currency)}`)
  lines.push(`  Tax (${(cost.tax_rate * 100).toFixed(0)}%):  ${formatCurrency(cost.tax_amount, cost.currency)}`)
  lines.push(`  TOTAL:  ${formatCurrency(cost.total_cost, cost.currency)}`)

  return lines
}

// ========================================
// PRICE RANGE CALCULATIONS
// ========================================

/**
 * Calculate price range for date span
 */
export function calculatePriceRange(
  priceOffPeak: number,
  pricePeak: number,
  nights: number,
  minNights: number = 1,
  maxNights: number = nights
): {
  min: number
  max: number
  range: string
} {
  const minPrice = priceOffPeak * minNights
  const maxPrice = pricePeak * maxNights

  return {
    min: minPrice,
    max: maxPrice,
    range: `${formatCurrency(minPrice)} - ${formatCurrency(maxPrice)}`,
  }
}

// ========================================
// VALIDATION
// ========================================

/**
 * Validate booking dates
 */
export function validateBookingDates(checkIn: Date | string, checkOut: Date | string): {
  valid: boolean
  error?: string
} {
  const start = typeof checkIn === 'string' ? new Date(checkIn) : checkIn
  const end = typeof checkOut === 'string' ? new Date(checkOut) : checkOut

  if (start >= end) {
    return {
      valid: false,
      error: 'Check-out date must be after check-in date',
    }
  }

  if (start < new Date()) {
    return {
      valid: false,
      error: 'Check-in date cannot be in the past',
    }
  }

  return { valid: true }
}

/**
 * Validate quantity values
 */
export function validateServiceQuantity(quantity: number, minQuantity: number = 1): {
  valid: boolean
  error?: string
} {
  if (quantity < minQuantity) {
    return {
      valid: false,
      error: `Quantity must be at least ${minQuantity}`,
    }
  }

  if (!Number.isInteger(quantity)) {
    return {
      valid: false,
      error: 'Quantity must be a whole number',
    }
  }

  return { valid: true }
}
