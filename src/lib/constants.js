export const ROLES = {
  OWNER: 'owner',
  PARTNER: 'partner',
  TELECALLER: 'telecaller',
}

export const TRIP_TYPES = [
  { value: '1-on-1-cab', label: '1-on-1 Cab' },
  { value: 'tour-package', label: 'Tour Package' },
  { value: 'overflow-referral', label: 'Overflow Referral' },
  { value: 'other', label: 'Other' },
]

export const TRIP_STATUSES = [
  'Quote-Generated',
  'Quote-Sent',
  'Quote-Confirmed',
  'Booked',
  'Paid',
  'Cancelled',
]

export const PAYMENT_STATUSES = ['Unpaid', 'Partial', 'Paid', 'Cancelled']

export const COMMISSION_TYPES = [
  { value: 'hotel', label: 'Hotel' },
  { value: 'houseboat', label: 'Houseboat' },
  { value: 'overflow-referral', label: 'Overflow Referral' },
  { value: 'airbnb', label: 'Airbnb' },
  { value: 'trivago', label: 'Trivago' },
  { value: 'booking.com', label: 'Booking.com' },
  { value: 'other-operator', label: 'Other Operator' },
  { value: 'other', label: 'Other' },
]

export const STATUS_COLORS = {
  'Quote-Generated': '#3B82F6',
  'Quote-Sent': '#8B5CF6',
  'Quote-Confirmed': '#EAB308',
  Booked: '#22C55E',
  Paid: '#15803D',
  Cancelled: '#DC2626',
  Pending: '#F97316',
  Received: '#15803D',
  Unpaid: '#DC2626',
  Partial: '#EAB308',
}

export const CHART_COLORS = ['#0B7D8C', '#2BA89F', '#D4A574', '#6B7280', '#8B5CF6', '#EAB308', '#DC2626', '#3B82F6']
