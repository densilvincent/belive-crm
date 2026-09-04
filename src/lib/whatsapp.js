const BELIVE_NUMBER = '919895514845'

// wa.me only ever accepts a 10-digit local number or a full country-code
// number - normalize whatever a customer_phone field happens to contain.
function normalizeIndianPhone(phone) {
  const digits = (phone || '').replace(/\D/g, '')
  if (!digits) return null
  if (digits.length === 10) return `91${digits}`
  if (digits.length === 12 && digits.startsWith('91')) return digits
  return digits
}

// For the PDF's own "Confirm Booking" link: the customer texts Belive.
export function buildWhatsAppLink(trip) {
  const text = `Hi Belive, interested in quote ${trip.quote_id || ''} - ${trip.customer_name || ''}`
  return `https://wa.me/${BELIVE_NUMBER}?text=${encodeURIComponent(text)}`
}

// For staff sending a quote to the customer: opposite direction, opens a
// chat TO the customer's number (falls back to no target number - WhatsApp's
// own contact picker - if we don't have one on file).
export function buildCustomerWhatsAppLink(trip) {
  const number = normalizeIndianPhone(trip.customer_phone)
  const text = `Hi ${trip.customer_name || ''}, here's your Belive Holidays quote (${trip.quote_id || ''}). Please find the PDF attached.`
  const base = number ? `https://wa.me/${number}` : 'https://wa.me/'
  return `${base}?text=${encodeURIComponent(text)}`
}
