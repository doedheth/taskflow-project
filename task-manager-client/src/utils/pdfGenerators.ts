import * as jsPDFModule from 'jspdf';
import 'jspdf-autotable'; // Import jspdf-autotable
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import toast from 'react-hot-toast';
import logoHeader from '@/images/lgo-header.png';
import { Sprint, Epic, Ticket, Assignee } from '@/types';

const jsPDF = jsPDFModule.jsPDF; // Extract the named export

// Define TimelineItem as a union type of Epic and Ticket
type TimelineItem = Epic | Ticket;

// Helper function to safely get text
const safeText = (text: any) => (text === null || text === undefined || text === '' ? '-' : String(text));

// Helper function to convert URL to data URL
const urlToDataUrl = async (url: string): Promise<string | null> => {
  if (!url) return null;
  if (url.startsWith('data:image')) return url;

  let finalUrl = url;
  if (!url.startsWith('http')) {
    // Rely on window.location.origin for relative paths, or expect absolute paths.
    // Removed hardcoded localhost fallback as it's environment-specific.
    finalUrl = `${window.location.origin}${url.startsWith('/') ? '' : '/'}${url}`;
  }

  try {
    const response = await fetch(finalUrl);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
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

// Helper function to add image safely to PDF
const addImageSafe = (doc: jsPDF, dataUrl: string | undefined | null, x: number, y: number, w: number, h: number) => {
  if (dataUrl) {
    try {
      let imgFormat = 'PNG';
      if (dataUrl.includes('image/jpeg') || dataUrl.includes('image/jpg')) imgFormat = 'JPEG';
      doc.addImage(dataUrl, imgFormat, x, y, w, h);
    } catch (e) {
      console.error('jsPDF addImage error:', e);
      doc.setFontSize(5);
      doc.text('[Image Error]', x + w / 2, y + h / 2, { align: 'center' });
    }
  }
};

// Helper function to draw consistent header
const drawOfficialHeader = (doc: jsPDF, titleLines: string[], docNo: string, revNo: string, dateStr: string, pageNum: string = '1 dari 1') => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 10;
  const contentWidth = pageWidth - (margin * 2);
  const headerH = 22;

  doc.setLineWidth(0.2);
  doc.rect(margin, margin, contentWidth, headerH);
  const col1W = 50;
  const col2W = 85;
  doc.line(margin + col1W, margin, margin + col1W, margin + headerH);
  doc.line(margin + col1W + col2W, margin, margin + col1W + col2W, margin + headerH);

  try {
    doc.addImage(logoHeader, 'PNG', margin + 15, margin + 3.5, 20, 7);
    doc.setFontSize(5);
    doc.setFont('helvetica', 'bold');
    doc.text('PT. SURYASUKSES ABADI PRIMA', margin + col1W / 2, margin + 17.5, { align: 'center' });
  } catch (e) {
    doc.setFont('helvetica', 'bold'); doc.setFontSize(16);
    doc.text('SQP', margin + col1W / 2, margin + 10, { align: 'center' });
    doc.setFontSize(5);
    doc.text('PT. SURYASUKSES ABADI PRIMA', margin + col1W / 2, margin + 18, { align: 'center' });
  }

  doc.setFontSize(8.5);
  const titleY = margin + (headerH / 2) - ((titleLines.length - 1) * 2);
  titleLines.forEach((line, i) => doc.text(line, margin + col1W + col2W / 2, titleY + (i * 4.5), { align: 'center' }));
  const infoX = margin + col1W + col2W;
  doc.setFontSize(6.5);
  doc.line(infoX, margin + 5.5, pageWidth - margin, margin + 5.5);
  doc.line(infoX, margin + 11, pageWidth - margin, margin + 11);
  doc.line(infoX, margin + 16.5, pageWidth - margin, margin + 16.5);
  const drawL = (l: string, v: string, yP: number) => {
    doc.setFont('helvetica', 'bold'); doc.text(l, infoX + 1, yP);
    doc.setFont('helvetica', 'normal'); doc.text(': ' + v, infoX + 19, yP);
  };
  drawL('No. Dok', docNo, margin + 4);
  drawL('No. Rev', revNo, margin + 9.5);
  drawL('Tanggal', dateStr, margin + 15);
  drawL('Halaman', pageNum, margin + 20.5);
  return margin + headerH;
};

// Placeholder for generateSprintSummaryPDF
export const generateSprintSummaryPDF = async (sprints: Sprint[]) => {
  toast.loading('Mempersiapkan PDF Ringkasan Sprint...', { id: 'pdf-summary' });
  try {
    const doc = new jsPDF({
      orientation: 'p',
      unit: 'mm',
      format: 'a4'
    });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 10;
    const contentWidth = pageWidth - (margin * 2);
    let y = margin;
    const lineHeight = 5;

    let pageNumber = 1;

    const addPageWithHeader = () => {
      if (doc.internal.getNumberOfPages() > 1) {
        doc.addPage();
      }
      y = margin;
      drawOfficialHeader(doc, ['Ringkasan Sprints'], 'SPRINT.01', '01', format(new Date(), 'dd MMMM yyyy', { locale: localeId }), `${pageNumber} dari ${doc.internal.getNumberOfPages()}`); // Placeholder total pages
      y = margin + 22 + 10; // Below header + some space
      pageNumber++;
    };

    addPageWithHeader();

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('RINGKASAN SPRINT', margin, y);
    y += lineHeight * 2;

    if (sprints.length === 0) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('Tidak ada data sprint yang tersedia.', margin, y);
      y += lineHeight;
    }

    sprints.forEach((sprint, index) => {
      // Check for page break before rendering each sprint
      const sprintHeightEstimate = 9 * lineHeight + 5; // Estimate space needed for one sprint
      if (y + sprintHeightEstimate > pageHeight - margin) {
        addPageWithHeader();
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('RINGKASAN SPRINT (Lanjutan)', margin, y);
        y += lineHeight * 2;
      }

      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(`Sprint: ${safeText(sprint.name)}`, margin, y);
      doc.line(margin, y + 1, margin + contentWidth, y + 1); // Underline sprint name
      y += lineHeight;

      doc.setFont('helvetica', 'normal');
      doc.text(`Status: ${safeText(sprint.status)}`, margin, y); y += lineHeight;
      doc.text(`Goal: ${safeText(sprint.goal)}`, margin, y); y += lineHeight;

      const startDate = sprint.start_date ? format(new Date(sprint.start_date), 'dd MMM yyyy', { locale: localeId }) : '-';
      const endDate = sprint.end_date ? format(new Date(sprint.end_date), 'dd MMM yyyy', { locale: localeId }) : '-';
      doc.text(`Tanggal: ${startDate} - ${endDate}`, margin, y); y += lineHeight;

      doc.text(`Total Story Points: ${safeText(sprint.total_points)}`, margin, y); y += lineHeight;
      doc.text(`Story Points Selesai: ${safeText(sprint.completed_points)}`, margin, y); y += lineHeight;
      doc.text(`Total Tiket: ${safeText(sprint.total_tickets)}`, margin, y); y += lineHeight;
      doc.text(`Tiket Selesai: ${safeText(sprint.completed_tickets)}`, margin, y); y += lineHeight;
      doc.text(`Progres: ${safeText(sprint.progress || 0)}%`, margin, y); y += lineHeight;

      if (sprint.tickets && sprint.tickets.length > 0) {
        doc.setFont('helvetica', 'bold');
        doc.text('Assignees:', margin, y); y += lineHeight;
        doc.setFont('helvetica', 'normal');
        const uniqueAssignees = new Set<string>();
        sprint.tickets.forEach(ticket => {
          ticket.assignees?.forEach(assignee => uniqueAssignees.add(assignee.name));
        });
        if (uniqueAssignees.size > 0) {
          uniqueAssignees.forEach(assigneeName => {
            doc.text(`- ${assigneeName}`, margin + 5, y); y += lineHeight;
          });
        } else {
          doc.text(`- Tidak ada assignee`, margin + 5, y); y += lineHeight;
        }
      }


      // Add a separator line after each sprint for readability
      if (index < sprints.length - 1) {
        doc.line(margin, y + lineHeight, margin + contentWidth, y + lineHeight);
        y += lineHeight * 2;
      }
    });

    doc.save(`Ringkasan_Sprints_${format(new Date(), 'yyyyMMdd')}.pdf`);
    toast.success('PDF Ringkasan Sprint berhasil diunduh', { id: 'pdf-summary' });
  } catch (error: any) {
    console.error('Error generating Sprint Summary PDF:', error);
    toast.error('Gagal membuat PDF Ringkasan Sprint: ' + error.message, { id: 'pdf-summary' });
  }
};

// Placeholder for generateTimelineStructuredPDF
export const generateTimelineStructuredPDF = async (items: TimelineItem[]) => {
  toast.loading('Mempersiapkan PDF Laporan Timeline...', { id: 'pdf-timeline' });
  try {
    const doc = new jsPDF({
      orientation: 'p',
      unit: 'mm',
      format: 'a4'
    }) as any; // Cast to any to access autoTable

    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 10;
    const contentWidth = pageWidth - (margin * 2);

    let pageNumber = 1;

    const addPageWithHeader = (pageNumber: number, totalPages: number) => {
      drawOfficialHeader(doc, ['Laporan Timeline Proyek'], 'TIMELINE.01', '01', format(new Date(), 'dd MMMM yyyy', { locale: localeId }), `${pageNumber} dari ${totalPages}`);
    };

    // Prepare table headers
    const headers = [
      'Kunci Tiket',
      'Judul',
      'Tipe',
      'Status',
      'Assignee',
      'Tanggal Mulai',
      'Tanggal Akhir'
    ];

    // Prepare table data
    const data = items.map(item => {
      const assignees = item.assignees?.map(assignee => assignee.name).join(', ') || '-';
      const startDate = item.start_date ? format(new Date(item.start_date), 'dd MMM yyyy', { locale: localeId }) : '-';
      const endDate = item.end_date ? format(new Date(item.end_date), 'dd MMM yyyy', { locale: localeId }) : '-';

      return [
        safeText(item.ticket_key || item.id),
        safeText(item.title),
        safeText(item.type),
        safeText(item.status),
        assignees,
        startDate,
        endDate
      ];
    });

    doc.autoTable({
      head: [headers],
      body: data,
      startY: margin + 22 + 10, // Start below the main header
      margin: { top: margin, bottom: margin, left: margin, right: margin },
      theme: 'grid',
      headStyles: {
        fillColor: [200, 200, 200],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        halign: 'center'
      },
      styles: {
        fontSize: 8,
        cellPadding: 2,
        lineColor: [150, 150, 150],
        lineWidth: 0.1
      },
      columnStyles: {
        0: { cellWidth: 20 }, // Kunci Tiket
        1: { cellWidth: 50 }, // Judul
        2: { cellWidth: 20 }, // Tipe
        3: { cellWidth: 20 }, // Status
        4: { cellWidth: 30 }, // Assignee
        5: { cellWidth: 20 }, // Tanggal Mulai
        6: { cellWidth: 20 }  // Tanggal Akhir
      },
      didDrawPage: (data: any) => {
        // Reset page number for header calculation
        const totalPages = doc.internal.getNumberOfPages();
        addPageWithHeader(data.pageNumber, totalPages);
        doc.text('Data Timeline Proyek', margin, margin + 22 + 5); // Title on each page
      }
    });

    doc.save(`Laporan_Timeline_${format(new Date(), 'yyyyMMdd')}.pdf`);
    toast.success('PDF Laporan Timeline berhasil diunduh', { id: 'pdf-timeline' });
  } catch (error: any) {
    console.error('Error generating Timeline Structured PDF:', error);
    toast.error('Gagal membuat PDF Laporan Timeline: ' + error.message, { id: 'pdf-timeline' });
  }
};
