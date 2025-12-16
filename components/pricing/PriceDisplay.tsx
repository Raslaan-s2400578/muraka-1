/**
 * Hotel Management System - Muraka
 * 
 * @student Aminath Yaula Yaarid - S2400576
 * @student Hawwa Saha Nasih - S2400566
 * @student Milyaaf Abdul Sattar - S2300565
 * @student Mohamed Raslaan Najeeb - S2400578
 * 
 * Module: UFCF8S-30-2 Advanced Software Development
 * Institution: UWE Bristol
 */

/**
 * PriceDisplay Component
 * Display room pricing with peak/off-peak indicators
 */

import React from 'react'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatPricePerNight } from '@/lib/pricing/calculator'
import { Currency } from '@/types/pricing'

interface PriceDisplayProps {
  priceOffPeak: number
  pricePeak: number
  isPeak: boolean
  currency?: Currency
  showLabel?: boolean
  compact?: boolean
}

export function PriceDisplay({
  priceOffPeak,
  pricePeak,
  isPeak,
  currency = Currency.GBP,
  showLabel = true,
  compact = false,
}: PriceDisplayProps) {
  const currentPrice = isPeak ? pricePeak : priceOffPeak
  const otherPrice = isPeak ? priceOffPeak : pricePeak

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <span className="font-bold text-lg">{formatCurrency(currentPrice, currency)}</span>
        {isPeak && <Badge variant="destructive">Peak</Badge>}
        {!isPeak && <Badge variant="secondary">Off-Peak</Badge>}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {showLabel && (
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium">Price per night:</p>
          {isPeak && <Badge variant="destructive">Peak Season</Badge>}
          {!isPeak && <Badge variant="secondary">Off-Peak</Badge>}
        </div>
      )}

      <div className="text-2xl font-bold text-gray-900">
        {formatCurrency(currentPrice, currency)}
        <span className="text-sm font-normal text-gray-600">/night</span>
      </div>

      {priceOffPeak !== pricePeak && (
        <div className="text-sm text-gray-600">
          {isPeak ? (
            <>
              Off-peak price: <span className="font-medium">{formatCurrency(otherPrice, currency)}</span>
            </>
          ) : (
            <>
              Peak price: <span className="font-medium">{formatCurrency(otherPrice, currency)}</span>
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default PriceDisplay
