import jsPDF from 'jspdf';

/**
 * Helper function to add UroVital logo to PDF documents
 * @param doc - jsPDF document instance
 * @param x - X position (default: 10)
 * @param y - Y position (default: 10)
 * @param width - Logo width (default: 40)
 */
export function addUroVitalLogo(doc: jsPDF, x: number = 10, y: number = 10, width: number = 40): void {
  try {
    // Add logo image to PDF
    // Note: In production, the logo path should be accessible from the public directory
    doc.addImage('/images/logo/urovital-logo.png', 'PNG', x, y, width, width * 0.5);
  } catch (error) {
    console.warn('Could not add logo to PDF:', error);
    // Fallback: Add text logo if image fails
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(58, 109, 255);
    doc.text('UroVital', x, y + 8);
  }
}

/**
 * Helper function to add header with logo and title to PDF documents
 * @param doc - jsPDF document instance
 * @param title - Document title
 * @param subtitle - Optional subtitle
 */
export function addPDFHeader(doc: jsPDF, title: string, subtitle?: string): void {
  // Add logo
  addUroVitalLogo(doc);
  
  // Add title
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(58, 109, 255);
  doc.text(title, doc.internal.pageSize.getWidth() / 2, 20, { align: 'center' });
  
  // Add subtitle if provided
  if (subtitle) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100);
    doc.text(subtitle, doc.internal.pageSize.getWidth() / 2, 30, { align: 'center' });
  }
}
