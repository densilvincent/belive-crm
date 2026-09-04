import { buildCustomerWhatsAppLink } from './whatsapp'

// wa.me links can only pre-fill text - there is no URL-based way to attach a
// file to a WhatsApp message (that requires the WhatsApp Business API, which
// needs Meta approval and is a post-launch item). The Web Share API is the
// actual way to hand a real file to WhatsApp from a browser: on a phone it
// opens the native OS share sheet with the PDF attached, and WhatsApp appears
// as one of the targets. Desktop browsers mostly don't support sharing files
// this way, so there we download the PDF and open a pre-filled chat instead,
// for the staff member to attach manually.
//
// `fallbackWindow`: a tab the caller opened *synchronously* on click (before
// any await). PDF generation is async, so by the time we'd call
// `window.open()` here it may no longer count as a trusted user gesture on
// some mobile browsers (notably iOS Safari) and get silently dropped -
// filling in an already-open tab sidesteps that. Closed unused if native
// sharing succeeds instead.
export async function shareQuoteOnWhatsApp({ trip, itinerary, hotel, driver, fallbackWindow }) {
  const { generateQuotePDF } = await import('./pdfGenerator')
  const doc = await generateQuotePDF({ trip, itinerary, hotel, driver })
  const filename = `belive-quote-${trip.quote_id || trip.id}.pdf`
  const blob = doc.output('blob')
  const file = new File([blob], filename, { type: 'application/pdf' })
  const text = `Hi ${trip.customer_name || ''}, here's your Belive Holidays quote (${trip.quote_id || ''}).`

  if (navigator.canShare?.({ files: [file] })) {
    try {
      fallbackWindow?.close()
      await navigator.share({ files: [file], title: 'Belive Holidays Quote', text })
      return { mode: 'shared' }
    } catch (err) {
      if (err.name === 'AbortError') return { mode: 'cancelled' }
      throw err
    }
  }

  doc.save(filename)
  const waLink = buildCustomerWhatsAppLink(trip)
  if (fallbackWindow && !fallbackWindow.closed) fallbackWindow.location.href = waLink
  else window.open(waLink, '_blank', 'noopener')
  return { mode: 'fallback' }
}
