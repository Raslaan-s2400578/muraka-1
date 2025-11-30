# Pricing System

## Room Rates (GBP)

**All Locations - Same Pricing:**
| Room Type | Off-Peak | Peak |
|-----------|----------|------|
| Standard Double | £120 | £180 |
| Deluxe King | £180 | £250 |
| Family Suite | £240 | £320 |
| Penthouse | £500 | £750 |

## Services

| Service | Price | Unit |
|---------|-------|------|
| Airport Transfer | £50 | Per transfer |
| Breakfast | £20 | Per person/day |
| Spa Access | £35 | Per person/day |
| Late Checkout | £40 | Per occurrence |

## Cancellation Policy

| Days Before Check-in | Fee |
|----------------------|-----|
| > 14 days | FREE (0%) |
| 3-14 days | 50% of first night |
| < 72 hours | 100% of first night |

## Peak Seasons

- Summer: Jul 1 - Aug 31 (1.2x multiplier)
- Christmas: Dec 15 - Jan 5 (1.3x multiplier)
- Easter: Mar 20 - Apr 10 (1.15x multiplier)

## Implementation

- **Database**: PostgreSQL functions for calculations
- **API**: `/api/pricing/estimate` and `/api/pricing/cancellation-fee`
- **Calculations**: Peak pricing auto-detected by check-in date
- **VAT**: 20% applied to all bookings

## Files

- `lib/pricing/calculator.ts` - Pricing logic
- `app/api/pricing/` - API endpoints
- `components/pricing/` - React components
- `types/pricing.ts` - TypeScript types
