import { jsPDF } from 'jspdf';
import { Complaint } from '@/types/complaint';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import toast from 'react-hot-toast';
import logoHeader from '@/images/lgo-header.png';

// Helpers
const safeText = (text: any) => (text === null || text === undefined || text === '' ? '-' : String(text));
const stripHtml = (html: string) => html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim() || '-';

const urlToDataUrl = async (url: string): Promise<string | null> => {
  if (!url) return null;
  if (url.startsWith('data:image')) return url;

  let finalUrl = url;
  if (!url.startsWith('http')) {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5555';
    finalUrl = `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
  }

  try {
    const response = await fetch(finalUrl);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  } catch (e) {
    console.error('Failed to convert image:', finalUrl, e);
    return null;
  }
};

const addImageSafe = (doc: jsPDF, dataUrl: string | undefined | null, x: number, y: number, w: number, h: number) => {
  if (dataUrl) {
    try {
      let imgFormat = 'PNG';
      if (dataUrl.includes('image/jpeg') || dataUrl.includes('image/jpg')) imgFormat = 'JPEG';
      doc.addImage(dataUrl, imgFormat, x, y, w, h);
    } catch (e) {
      console.error('jsPDF addImage error:', e);
    }
  }
};

const drawComplaintHeader = (doc: jsPDF, complaintNo: string, complaintDate: string, complaintAttn: string, pageWidth: number, margin: number, pageNum: number, totalPages: number) => {
  const headerH = 22;
  const contentWidth = pageWidth - (margin * 2);
  doc.setLineWidth(0.2);
  doc.rect(margin, margin, contentWidth, headerH);
  const col1W = 50;
  const col2W = 85;
  doc.line(margin + col1W, margin, margin + col1W, margin + headerH);
  doc.line(margin + col1W + col2W, margin, margin + col1W + col2W, margin + headerH);

  try {
    addImageSafe(doc, logoHeader, margin + 15, margin + 3.5, 20, 7);
    doc.setFontSize(5);
    doc.setFont('helvetica', 'bold');
    doc.text('PT. SURYASUKSES ABADI PRIMA', margin + col1W / 2, margin + 17.5, { align: 'center' });
  } catch (e) {
    doc.setFont('helvetica', 'bold'); doc.setFontSize(16);
    doc.text('SQP', margin + col1W / 2, margin + 10, { align: 'center' });
  }

  doc.setFontSize(8.5);
  doc.text('FORM KOMPLAIN', margin + col1W + col2W / 2, margin + 12, { align: 'center' });

  const infoX = margin + col1W + col2W;
  doc.setFontSize(6.5);
  doc.line(infoX, margin + 5.5, pageWidth - margin, margin + 5.5);
  doc.line(infoX, margin + 11, pageWidth - margin, margin + 11);
  doc.line(infoX, margin + 16.5, pageWidth - margin, margin + 16.5);
  doc.line(infoX + 18, margin, infoX + 18, margin + headerH);

  const drawL = (l: string, v: string, yP: number) => {
    doc.setFont('helvetica', 'bold'); doc.text(l, infoX + 1, yP);
    doc.setFont('helvetica', 'normal'); doc.text(': ' + v, infoX + 19, yP);
  };
  drawL('No. Dok', complaintNo, margin + 4);
  drawL('Attn', complaintAttn, margin + 9.5);
  drawL('Tanggal', complaintDate, margin + 15);
  drawL('Halaman', `${pageNum} dari ${totalPages}`, margin + 20.5);
  return margin + headerH;
};

export async function generateComplaintPDF(complaint: Complaint) {
  toast.loading('Membuat PDF komplain...', { id: 'complaint-pdf' });
  try {
    const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'p' });
    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 12;
    const contentWidth = pageWidth - (margin * 2);
    const totalPages = 2; // Sesuai permintaan: Hal 1 Internal, Hal 2 Supplier

    // Pre-load necessary assets
    const photoDataUrls = await Promise.all((complaint.photos || []).map(p => urlToDataUrl(p.photo_url)));
    const qaqcSig = await urlToDataUrl(complaint.qaqc_signature_url || '');
    const spvSig = await urlToDataUrl(complaint.spv_qaqc_signature_url || '');
    const ppicSig = await urlToDataUrl(complaint.ppic_signature_url || '');
    const formattedDate = complaint.tanggal_datang ? format(new Date(complaint.tanggal_datang), 'dd MMMM yyyy', { locale: localeId }) : '-';

    // =========================================================================
    // HALAMAN 1: INTERNAL
    // =========================================================================
    doc.setLineWidth(0.4);
    doc.rect(margin, margin, contentWidth, pageHeight - (margin * 2));

    let y = drawComplaintHeader(doc, safeText(complaint.no || String(complaint.id)), formattedDate, safeText(complaint.attn), pageWidth, margin, 1, totalPages);

    y += 6;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('I. INFORMASI KOMPLAIN', margin + 2, y);

    y += 2;
    doc.setLineWidth(0.1);
    doc.rect(margin + 2, y, contentWidth - 4, 22);

    doc.setFontSize(7.5);
    const infoY = y + 5;
    doc.text('Nama Barang', margin + 4, infoY);
    doc.setFont('helvetica', 'normal');
    doc.text(': ' + safeText(complaint.item_name), margin + 30, infoY);

    doc.setFont('helvetica', 'bold');
    doc.text('No. Batch', margin + 4, infoY + 5);
    doc.setFont('helvetica', 'normal');
    doc.text(': ' + safeText(complaint.batch_no), margin + 30, infoY + 5);

    doc.setFont('helvetica', 'bold');
    doc.text('Jumlah', margin + 4, infoY + 10);
    doc.setFont('helvetica', 'normal');
    doc.text(': ' + (complaint.qty || '-') + ' ' + safeText(complaint.unit), margin + 30, infoY + 10);

    doc.setFont('helvetica', 'bold');
    doc.text('Referensi PO/SJ', margin + 4, infoY + 15);
    doc.setFont('helvetica', 'normal');
    doc.text(`: ${safeText(complaint.po_no)} / ${safeText(complaint.surat_jalan_ref)}`, margin + 30, infoY + 15);

    y += 28;
    doc.setFont('helvetica', 'bold');
    doc.text('II. KETERANGAN KETIDAKSESUAIAN', margin + 2, y);
    y += 2;
    doc.rect(margin + 2, y, contentWidth - 4, 35);
    doc.setFont('helvetica', 'normal');
    const descLines = doc.splitTextToSize(stripHtml(complaint.keterangan || ''), contentWidth - 8);
    doc.text(descLines, margin + 4, y + 5);

    y += 42;
    doc.setFont('helvetica', 'bold');
    doc.text('III. FOTO BUKTI', margin + 2, y);
    y += 2;

    const photoBoxW = (contentWidth - 10) / 3;
    const photoBoxH = 40;
    const displayPhotos = photoDataUrls.slice(0, 3); // Ambil 3 foto pertama untuk halaman 1

    displayPhotos.forEach((dataUrl, idx) => {
      const px = margin + 2 + (idx * (photoBoxW + 3));
      doc.rect(px, y, photoBoxW, photoBoxH);
      if (dataUrl) {
        addImageSafe(doc, dataUrl, px + 1, y + 1, photoBoxW - 2, photoBoxH - 7);
        doc.setFontSize(6);
        const pDesc = complaint.photos?.[idx]?.description || `Foto ${idx+1}`;
        doc.text(doc.splitTextToSize(pDesc, photoBoxW - 2), px + 1, y + photoBoxH - 4);
      }
    });

    // SIGNATURES AT BOTTOM OF PAGE 1
    const sigY = pageHeight - margin - 35;
    const sigColW = contentWidth / 3;
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.text('Dibuat Oleh:', margin + sigColW / 2, sigY, { align: 'center' });
    doc.text('Mengetahui:', margin + sigColW + sigColW / 2, sigY, { align: 'center' });
    doc.text('Mengetahui:', margin + sigColW * 2 + sigColW / 2, sigY, { align: 'center' });

    const sigImgW = 20;
    const sigImgH = 15;
    if (qaqcSig) addImageSafe(doc, qaqcSig, margin + sigColW/2 - 10, sigY + 2, sigImgW, sigImgH);
    if (spvSig) addImageSafe(doc, spvSig, margin + sigColW + sigColW/2 - 10, sigY + 2, sigImgW, sigImgH);
    if (ppicSig) addImageSafe(doc, ppicSig, margin + sigColW * 2 + sigColW/2 - 10, sigY + 2, sigImgW, sigImgH);

    doc.setFont('helvetica', 'normal');
    doc.text(`( ${safeText(complaint.qc_incoming_name || 'QC Incoming')} )`, margin + sigColW/2, sigY + 22, { align: 'center' });
    doc.text(`( ${safeText(complaint.spv_qaqc_name || 'SPV QAQC')} )`, margin + sigColW + sigColW/2, sigY + 22, { align: 'center' });
    doc.text(`( ${safeText(complaint.ppic_name || 'PPIC')} )`, margin + sigColW * 2 + sigColW/2, sigY + 22, { align: 'center' });

    // =========================================================================
    // HALAMAN 2: SUPPLIER
    // =========================================================================
    doc.addPage();
    doc.setLineWidth(0.4);
    doc.rect(margin, margin, contentWidth, pageHeight - (margin * 2));

    y = drawComplaintHeader(doc, safeText(complaint.no || String(complaint.id)), formattedDate, safeText(complaint.attn), pageWidth, margin, 2, totalPages);

    y += 8;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('IV. TANGGAPAN SUPPLIER (DIISI OLEH SUPPLIER)', margin + 2, y);

    y += 4;
    const respBoxH = 30;
    const sections = ['1. Analisa Penyebab:', '2. Tindakan Perbaikan:', '3. Tindakan Pencegahan:'];

    sections.forEach(title => {
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text(title, margin + 4, y + 6);
      doc.setLineWidth(0.1);
      doc.rect(margin + 2, y, contentWidth - 4, respBoxH);
      y += respBoxH + 4;
    });

    y += 10;
    doc.setFontSize(8);
    doc.text('Diterima & Disetujui Oleh Supplier:', margin + contentWidth - 60, y);
    doc.rect(margin + contentWidth - 65, y + 2, 60, 30);
    doc.text('( Tanda Tangan & Stempel )', margin + contentWidth - 35, y + 28, { align: 'center' });
    doc.text(`Nama: ${safeText(complaint.supplier_person_name)}`, margin + contentWidth - 65, y + 36);

    doc.setFontSize(7);
    doc.setFont('helvetica', 'italic');
    doc.text('NB: Mohon segera diisi & di-email kembali maksimal 7 hari setelah surat komplain ini diterima.', margin + 2, pageHeight - margin - 5);

    doc.save(`Form-Komplain-${safeText(complaint.no || String(complaint.id))}.pdf`);
    toast.success('PDF berhasil diunduh', { id: 'complaint-pdf' });
  } catch (e: any) {
    console.error('PDF Error:', e);
    toast.error('Gagal membuat PDF: ' + e.message, { id: 'complaint-pdf' });
  }
}
