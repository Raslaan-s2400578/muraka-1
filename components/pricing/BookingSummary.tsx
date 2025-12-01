/**
 * BookingSummary Component
 * Display complete booking cost breakdown with itemization
 */

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ItemizedBookingCost, Currency } from '@/types/pricing'
import { formatCurrency } from '@/lib/pricing/calculator'

interface BookingSummaryProps {
  itemized: ItemizedBookingCost
  showTax?: boolean
  compact?: boolean
}

export function BookingSummary({ itemized, showTax = true, compact = false }: BookingSummaryProps) {
  if (compact) {
    return (
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Room ({itemized.room_nights} nights):</span>
          <span className="font-medium">{formatCurrency(itemized.room_cost, itemized.currency)}</span>
        </div>

        {itemized.services_cost > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Services:</span>
            <span className="font-medium">{formatCurrency(itemized.services_cost, itemized.currency)}</span>
          </div>
        )}

        {showTax && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Tax ({(itemized.tax_rate * 100).toFixed(0)}%):</span>
            <span className="font-medium">{formatCurrency(itemized.tax_amount, itemized.currency)}</span>
          </div>
        )}

        <div className="border-t pt-2 flex justify-between text-base font-bold">
          <span>Total:</span>
          <span>{formatCurrency(itemized.total_cost, itemized.currency)}</span>
        </div>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Booking Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Room Charges */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-medium">Room Charges</span>
            {itemized.is_peak && <Badge variant="destructive">Peak Season</Badge>}
          </div>
          <div className="pl-4 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">
                {itemized.room_nights} night{itemized.room_nights > 1 ? 's' : ''}
              </span>
              <span>
                {formatCurrency(itemized.room_per_night, itemized.currency)} × {itemized.room_nights}
              </span>
            </div>
            <div className="flex justify-between font-medium border-t pt-1">
              <span>Room Total:</span>
              <span>{formatCurrency(itemized.room_cost, itemized.currency)}</span>
            </div>
          </div>
        </div>

        {/* Services */}
        {itemized.services.length > 0 && (
          <div className="space-y-2">
            <div className="font-medium">Services</div>
            <div className="pl-4 space-y-1 text-sm">
              {itemized.services.map((service, idx) => (
                <div key={idx} className="flex justify-between">
                  <span className="text-gray-600">
                    {service.service_name} × {service.quantity}
                  </span>
                  <span>{formatCurrency(service.total_cost, itemized.currency)}</span>
                </div>
              ))}
              <div className="flex justify-between font-medium border-t pt-1">
                <span>Services Total:</span>
                <span>{formatCurrency(itemized.services_cost, itemized.currency)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Price Summary */}
        <div className="space-y-2 border-t pt-4">
          <div className="flex justify-between">
            <span className="text-gray-600">Subtotal:</span>
            <span>{formatCurrency(itemized.subtotal, itemized.currency)}</span>
          </div>

          {showTax && (
            <div className="flex justify-between">
              <span className="text-gray-600">Tax ({(itemized.tax_rate * 100).toFixed(0)}%):</span>
              <span>{formatCurrency(itemized.tax_amount, itemized.currency)}</span>
            </div>
          )}

          <div className="flex justify-between text-lg font-bold border-t pt-2">
            <span>Total Price:</span>
            <span className="text-green-600">{formatCurrency(itemized.total_cost, itemized.currency)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default BookingSummary
