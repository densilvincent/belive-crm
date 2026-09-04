import { buildCustomerWhatsAppLink } from './whatsapp'

// wa.me links can only pre-fill text - there is no URL-based way to attach a
// file to a WhatsApp message (that requires the WhatsApp Business API, which
// needs Meta approval and is a post-launch item). The Web Share API is the
// actual way to hand a real file to WhatsApp from a browser: on a phone it
// opens the native OS share sheet with the PDF attached, and WhatsApp appears
// as one of the targets. Desktop browsers mostly don't support sharing files
// this way, so there we download the PDF and open a pre-filled chat instead,
// for the staff member to attach manually.
export async function shareQuoteOnWhatsApp({ trip, itinerary, hotel, driver }) {
  const { generateQuotePDF } = await import('./pdfGenerator')
  const doc = await generateQuotePDF({ trip, itinerary, hotel, driver })
  const filename = `belive-quote-${trip.quote_id || trip.id}.pdf`
  const blob = doc.output('blob')
  const file = new File([blob], filename, { type: 'application/pdf' })
  const text = `Hi ${trip.customer_name || ''}, here's your Belive Holidays quote (${trip.quote_id || ''}).`

  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: 'Belive Holidays Quote', text })
      return { mode: 'shared' }
    } catch (err) {
      if (err.name === 'AbortError') return { mode: 'cancelled' }
      throw err
    }
  }

  doc.save(filename)
  window.open(buildCustomerWhatsAppLink(trip), '_blank', 'noopener')
  return { mode: 'fallback' }
}
