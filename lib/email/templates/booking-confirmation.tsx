import * as React from 'react'
import { Heading, Text, Link, Section, Row, Column } from '@react-email/components'
import { BaseEmail } from './base'
import { EMAIL_CONFIG } from '../config'

interface BookingConfirmationProps {
  guestName: string
  bookingId: string
  hotelName: string
  roomNumber: string
  roomType: string
  checkIn: string
  checkOut: string
  numberOfGuests: number
  totalAmount: number
  phone?: string
  specialRequests?: string
}

export function BookingConfirmationEmail({
  guestName,
  bookingId,
  hotelName,
  roomNumber,
  roomType,
  checkIn,
  checkOut,
  numberOfGuests,
  totalAmount,
  phone,
  specialRequests,
}: BookingConfirmationProps) {
  return (
    <BaseEmail previewText={`Booking confirmed at ${hotelName}`}>
      <Heading className="mb-4 text-2xl font-bold text-gray-900">
        Booking Confirmed!
      </Heading>

      <Text className="mb-6 text-base leading-6 text-gray-700">
        Dear {guestName}, your reservation has been confirmed. We look forward to welcoming you!
      </Text>

      {/* Booking Details Card */}
      <Section className="mb-6 rounded-lg bg-gray-50 p-5">
        <table className="w-full text-sm">
          <tbody>
            <tr>
              <td className="pb-3 text-gray-600">Booking ID:</td>
              <td className="pb-3 font-bold text-gray-900">#{bookingId.slice(0, 8)}</td>
            </tr>
            <tr>
              <td className="pb-3 text-gray-600">Hotel:</td>
              <td className="pb-3 font-bold text-gray-900">{hotelName}</td>
            </tr>
            <tr>
              <td className="pb-3 text-gray-600">Room:</td>
              <td className="pb-3 font-bold text-gray-900">
                Room {roomNumber} - {roomType}
              </td>
            </tr>
            <tr>
              <td className="pb-3 text-gray-600">Check-in:</td>
              <td className="pb-3 font-bold text-gray-900">{checkIn}</td>
            </tr>
            <tr>
              <td className="pb-3 text-gray-600">Check-out:</td>
              <td className="pb-3 font-bold text-gray-900">{checkOut}</td>
            </tr>
            <tr>
              <td className="pb-3 text-gray-600">Guests:</td>
              <td className="pb-3 font-bold text-gray-900">{numberOfGuests}</td>
            </tr>
            {phone && (
              <tr>
                <td className="pb-3 text-gray-600">Phone:</td>
                <td className="pb-3 font-bold text-gray-900">{phone}</td>
              </tr>
            )}
            <tr>
              <td className="border-t border-gray-200 pt-3 text-gray-600">Total Amount:</td>
              <td className="border-t border-gray-200 pt-3 text-lg font-bold" style={{ color: EMAIL_CONFIG.brandColor }}>
                ${totalAmount.toFixed(2)}
              </td>
            </tr>
          </tbody>
        </table>
      </Section>

      {specialRequests && (
        <Section className="mb-6 rounded-lg bg-blue-50 p-5">
          <Text className="m-0 mb-2 text-sm font-semibold text-gray-900">
            Your Special Requests:
          </Text>
          <Text className="m-0 text-sm text-gray-700">
            {specialRequests}
          </Text>
        </Section>
      )}

      {/* CTA Button */}
      <Section className="mb-6 text-center">
        <Link
          href={`${EMAIL_CONFIG.appUrl}/dashboard/guest`}
          className="inline-block rounded-md px-6 py-3 font-bold text-white no-underline"
          style={{ backgroundColor: EMAIL_CONFIG.brandColor }}
        >
          View Booking Details
        </Link>
      </Section>

      <Text className="text-sm text-gray-600">
        If you have any questions or need to make changes to your booking, please don't hesitate to contact us.
      </Text>
    </BaseEmail>
  )
}
