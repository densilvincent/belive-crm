import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { formatCurrency, formatDate } from './formatters'
import { buildWhatsAppLink } from './whatsapp'
import logoUrl from '../assets/belive-logo.png'

export { buildWhatsAppLink }

const TEAL = [11, 125, 140]
const GOLD = [212, 165, 116]
const GRAY = [107, 114, 128]
const DARK = [31, 41, 55]

const COMPANY = {
  name: 'BELIVE HOLIDAYS',
  tagline: 'Your Gateway to Memorable Travels',
  address: 'Kanjoor-Airport Rd Thuravumkara, Nedumbassery, Kochi, Kerala 683575',
  phone1: '+91 9895514845',
  phone2: '+91 8089 699 499',
  email: 'beliveholidays@gmail.com',
  website: 'www.beliveholidays.com',
}

let cachedLogoDataUrl = null
async function getLogoDataUrl() {
  if (cachedLogoDataUrl) return cachedLogoDataUrl
  const res = await fetch(logoUrl)
  const blob = await res.blob()
  cachedLogoDataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
  return cachedLogoDataUrl
}

export async function generateQuotePDF({ trip, itinerary, hotel, driver }) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 40
  let y = 40

  // Header
  try {
    const logo = await getLogoDataUrl()
    doc.addImage(logo, 'PNG', pageWidth / 2 - 34, y, 68, 68)
  } catch {
    // logo optional — continue without it if it fails to load
  }
  y += 78

  doc.setTextColor(...TEAL)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(20)
  doc.text(COMPANY.name, pageWidth / 2, y, { align: 'center' })
  y += 18

  doc.setTextColor(...GOLD)
  doc.setFont('helvetica', 'italic')
  doc.setFontSize(11)
  doc.text(COMPANY.tagline, pageWidth / 2, y, { align: 'center' })
  y += 16

  doc.setTextColor(...GRAY)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.text(COMPANY.address, pageWidth / 2, y, { align: 'center', maxWidth: pageWidth - margin * 2 })
  y += 20

  doc.setDrawColor(...TEAL)
  doc.setLineWidth(1.5)
  doc.line(margin, y, pageWidth - margin, y)
  y += 24

  // Quote details
  doc.setTextColor(...DARK)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text('Quote Details', margin, y)
  y += 16

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  const quoteMeta = [
    [`Quote ID: ${trip.quote_id || '—'}`, `Quote Date: ${formatDate(trip.date)}`],
    [`Customer: ${trip.customer_name || '—'}`, `Phone: ${trip.customer_phone || '—'}`],
    [`Email: ${trip.customer_email || '—'}`, `Reference #: ${trip.booking_id || '—'}`],
  ]
  quoteMeta.forEach(([left, right]) => {
    doc.text(left, margin, y)
    doc.text(right, pageWidth / 2 + 10, y)
    y += 15
  })
  y += 10

  // Itinerary
  if (itinerary) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.text('Itinerary', margin, y)
    y += 16
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.text(`${itinerary.name || '—'}`, margin, y)
    y += 14
    doc.text(`Destination: ${itinerary.destination || '—'}   |   Duration: ${itinerary.duration_days || '—'} day(s)`, margin, y)
    y += 18

    const days = Array.isArray(itinerary.day_by_day_itinerary) ? itinerary.day_by_day_itinerary : []
    if (days.length) {
      autoTable(doc, {
        startY: y,
        margin: { left: margin, right: margin },
        head: [['Day', 'Activities', 'Accommodation', 'Meal Plan']],
        body: days.map((d) => [
          `Day ${d.day_number ?? ''}`,
          d.activities || '—',
          d.accommodation_type || '—',
          d.meal_plan || '—',
        ]),
        headStyles: { fillColor: TEAL, textColor: 255, fontSize: 9 },
        bodyStyles: { fontSize: 9, textColor: DARK },
        alternateRowStyles: { fillColor: [249, 250, 251] },
      })
      y = doc.lastAutoTable.finalY + 20
    }
  }

  // Accommodation
  if (hotel) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.text('Accommodation', margin, y)
    y += 16
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.text(`${hotel.name || '—'} (${hotel.type || '—'})  —  ${hotel.location || '—'}`, margin, y)
    y += 14
    doc.text(`Check-in: ${hotel.check_in_time || '—'}   Check-out: ${hotel.check_out_time || '—'}   Contact: ${hotel.contact_phone || '—'}`, margin, y)
    y += 20
  }

  // Transportation
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text('Transportation', margin, y)
  y += 16
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.text(`Driver: ${driver?.name || 'To be confirmed'}   |   Vehicle: ${driver?.vehicle_assigned || 'To be confirmed'}`, margin, y)
  y += 24

  // Pricing
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text('Pricing Breakdown', margin, y)
  y += 10

  const basePrice = Number(itinerary?.base_price || 0)
  const total = Number(trip.amount_quoted || basePrice)
  const accomLine = hotel ? [['Accommodation', formatCurrency(0)]] : []

  autoTable(doc, {
    startY: y + 6,
    margin: { left: margin, right: margin },
    body: [
      ['Base Itinerary Price', formatCurrency(basePrice)],
      ...accomLine,
      ['Driver / Transportation', driver ? 'Included' : 'To be confirmed'],
      ['Total Quote Price', formatCurrency(total)],
    ],
    theme: 'plain',
    styles: { fontSize: 10, textColor: DARK },
    columnStyles: { 1: { halign: 'right' } },
    didParseCell: (data) => {
      if (data.row.index === (accomLine.length ? 3 : 2)) {
        data.cell.styles.fontStyle = 'bold'
        data.cell.styles.fontSize = 12
        data.cell.styles.textColor = TEAL
      }
    },
  })
  y = doc.lastAutoTable.finalY + 20

  // Payment terms
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text('Payment Terms', margin, y)
  y += 15
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...GRAY)
  ;['30% advance payment required to confirm booking.', 'Balance amount payable on arrival.', 'Cancellations within 48 hours of travel date are non-refundable.'].forEach(
    (line) => {
      doc.text(`•  ${line}`, margin, y)
      y += 13
    }
  )
  y += 10

  // Contact / CTA
  doc.setDrawColor(...GOLD)
  doc.setLineWidth(1)
  doc.line(margin, y, pageWidth - margin, y)
  y += 20

  doc.setTextColor(...TEAL)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text('Confirm Your Booking', margin, y)
  y += 16
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...DARK)
  doc.text(`Phone: ${COMPANY.phone1} / ${COMPANY.phone2}`, margin, y)
  y += 13
  doc.text(`Email: ${COMPANY.email}`, margin, y)
  y += 13
  doc.text(`Website: ${COMPANY.website}`, margin, y)
  y += 13
  doc.setTextColor(...TEAL)
  doc.textWithLink('WhatsApp: Confirm Booking →', margin, y, { url: buildWhatsAppLink(trip) })
  y += 24

  // Footer
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(...GRAY)
  const footerY = doc.internal.pageSize.getHeight() - 40
  doc.text(
    'Terms & Conditions: Prices are subject to availability at the time of confirmation. Belive Holidays is not liable for delays caused by weather, traffic, or force majeure events.',
    margin,
    footerY,
    { maxWidth: pageWidth - margin * 2 }
  )
  doc.setTextColor(...TEAL)
  doc.setFont('helvetica', 'bold')
  doc.text('Thank you for choosing Belive Holidays', pageWidth / 2, footerY + 18, { align: 'center' })

  return doc
}

export async function downloadQuotePDF(args) {
  const doc = await generateQuotePDF(args)
  doc.save(`belive-quote-${args.trip.quote_id || args.trip.id}.pdf`)
}

export async function getQuotePDFBlob(args) {
  const doc = await generateQuotePDF(args)
  return doc.output('blob')
}
