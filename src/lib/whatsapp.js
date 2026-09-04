const WA_NUMBER = '919895514845'

export function buildWhatsAppLink(trip) {
  const text = `Hi Belive, interested in quote ${trip.quote_id || ''} - ${trip.customer_name || ''}`
  return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`
}
