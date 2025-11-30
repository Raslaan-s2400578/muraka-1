/**
 * CancellationPolicyDisplay Component
 * Display hotel cancellation policy with fee examples
 */

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertTriangle, CheckCircle } from 'lucide-react'
import { CancellationFeeRule, Currency } from '@/types/pricing'
import { formatCurrency } from '@/lib/pricing/calculator'

interface CancellationPolicyDisplayProps {
  rules: CancellationFeeRule[]
  hotelName?: string
  currency?: Currency
  bookingTotal?: number
  firstNightPrice?: number
}

export function CancellationPolicyDisplay({
  rules,
  hotelName,
  currency = Currency.GBP,
  bookingTotal,
  firstNightPrice,
}: CancellationPolicyDisplayProps) {
  // Sort rules by days_before_checkin_max (descending)
  const sortedRules = [...rules].sort((a, b) => b.days_before_checkin_max - a.days_before_checkin_max)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Cancellation Policy</CardTitle>
        {hotelName && <p className="text-sm text-gray-600">{hotelName}</p>}
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Review the cancellation fees below. Non-refundable bookings cannot be cancelled.
          </AlertDescription>
        </Alert>

        <div className="space-y-3">
          {sortedRules.map((rule, idx) => {
            const isFreeCancellation = rule.fee_value === 0 && rule.fee_type === 'percentage'

            let feeDescription = ''
            if (rule.fee_type === 'percentage') {
              feeDescription = `${rule.fee_value}% charge`
            } else if (rule.fee_type === 'nights') {
              feeDescription = `${rule.fee_value} night${rule.fee_value > 1 ? 's' : ''} charge`
            } else {
              feeDescription = `${formatCurrency(rule.fee_value, currency)} charge`
            }

            return (
              <div
                key={idx}
                className={`p-3 rounded-lg border ${
                  isFreeCancellation ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  {isFreeCancellation ? (
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                  )}

                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{rule.description}</div>
                    <div className="text-sm text-gray-600 mt-1">
                      {rule.days_before_checkin_min === rule.days_before_checkin_max
                        ? `${rule.days_before_checkin_min} days`
                        : rule.days_before_checkin_max === 9999
                        ? `${rule.days_before_checkin_min}+ days`
                        : `${rule.days_before_checkin_min}-${rule.days_before_checkin_max} days`}{' '}
                      before check-in: {feeDescription}
                    </div>

                    {bookingTotal && firstNightPrice && (
                      <div className="text-sm mt-2 pt-2 border-t">
                        <div className="flex justify-between">
                          <span>Example fee:</span>
                          <span className="font-medium">
                            {rule.fee_type === 'percentage'
                              ? formatCurrency((bookingTotal * rule.fee_value) / 100, currency)
                              : rule.fee_type === 'nights'
                              ? formatCurrency(firstNightPrice * rule.fee_value, currency)
                              : formatCurrency(rule.fee_value, currency)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <Alert className="bg-blue-50 border-blue-200">
          <AlertTriangle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-900">
            Cancellation deadlines are based on your local time at the property's location.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}

export default CancellationPolicyDisplay
