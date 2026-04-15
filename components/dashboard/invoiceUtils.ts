/**
 * generateInvoicePDF
 * Client-side PDF generation using html2canvas + jsPDF.
 * Must be called only inside a browser context (useEffect / event handler).
 */

import type { InvoiceData } from './InvoiceTemplate'

export async function generateInvoicePDF(data: InvoiceData): Promise<void> {
  // Dynamic imports — both packages are browser-only
  const html2canvas = (await import('html2canvas')).default
  const { jsPDF }   = await import('jspdf')

  const element = document.getElementById('almaz-invoice')
  if (!element) {
    console.error('[Invoice] #almaz-invoice element not found in DOM')
    return
  }

  const canvas = await html2canvas(element, {
    scale:           2,          // 2× for crisp print quality
    useCORS:         true,
    allowTaint:      true,
    backgroundColor: '#ffffff',
    logging:         false,
    windowWidth:     794,        // A4 width in px at 96dpi
    windowHeight:    1123,
  })

  const imgData = canvas.toDataURL('image/jpeg', 0.92)

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit:        'mm',
    format:      'a4',
  })

  const A4_W = 210
  const A4_H = 297
  const ratio = canvas.height / canvas.width
  const pdfH  = A4_W * ratio

  // If taller than one page, split across multiple pages
  if (pdfH <= A4_H) {
    pdf.addImage(imgData, 'JPEG', 0, 0, A4_W, pdfH)
  } else {
    let position = 0
    let remaining = pdfH
    while (remaining > 0) {
      pdf.addImage(imgData, 'JPEG', 0, position, A4_W, pdfH)
      remaining -= A4_H
      position  -= A4_H
      if (remaining > 0) pdf.addPage()
    }
  }

  pdf.save(`almaz-invoice-${data.invoiceNumber}.pdf`)
}

/**
 * buildWhatsAppMessage
 * Constructs a professional RTL WhatsApp message summarising the sale.
 */
export function buildWhatsAppMessage(data: InvoiceData): string {
  const itemsList = data.items
    .map(i => `• ${i.productName}${i.serialNumber ? ` (SN: ${i.serialNumber})` : ''} — ${i.actualUnitPrice.toLocaleString('ar-EG')} ج.م`)
    .join('\n')

  return encodeURIComponent(
    `🖤 *ألمظ استور — Apple Premium Reseller*\n` +
    `─────────────────────\n` +
    `📄 *فاتورة رقم:* ${data.invoiceNumber}\n` +
    `📅 *التاريخ:* ${data.date} — ${data.time}\n` +
    `👤 *العميل:* ${data.customer}\n` +
    `─────────────────────\n` +
    `🛒 *المنتجات:*\n${itemsList}\n` +
    `─────────────────────\n` +
    (data.discount > 0 ? `🏷️ *الخصم:* ${data.discount.toLocaleString('ar-EG')} ج.م\n` : '') +
    `💰 *الإجمالي:* ${data.totalSalePrice.toLocaleString('ar-EG')} ج.م\n` +
    `💳 *الدفع:* ${data.paymentMethod}\n` +
    `─────────────────────\n` +
    `✅ شكراً لثقتكم في ألمظ استور 🙏\n` +
    `للاستفسار أو الضمان يرجى الاحتفاظ بهذه الرسالة.`
  )
}

/**
 * openWhatsApp
 * Opens wa.me with a pre-formatted message.
 * Sanitises the phone number (removes leading 0 / spaces / dashes).
 */
export function openWhatsApp(phone: string, data: InvoiceData): void {
  // Normalise Egypt numbers
  let sanitised = phone.replace(/[\s\-\(\)]/g, '')
  if (sanitised.startsWith('0')) sanitised = '2' + sanitised   // 01xxxxxxx → 201xxxxxxx
  if (!sanitised.startsWith('+')) sanitised = '+' + sanitised

  const msg = buildWhatsAppMessage(data)
  window.open(`https://wa.me/${sanitised.replace(/\+/g, '')}?text=${msg}`, '_blank')
}
