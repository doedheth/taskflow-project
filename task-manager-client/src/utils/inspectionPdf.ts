import { jsPDF } from 'jspdf';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { InspectionWithDetails } from '@/types/inspection';
import toast from 'react-hot-toast';
import logoHeader from '@/images/lgo-header.png';

/**
 * High-Precision 4-Page PDF Engine for Incoming Material Inspection
 */
export const generateInspectionPDF = async (inspection: InspectionWithDetails) => {
  if (!inspection) {
    toast.error('Data laporan tidak tersedia');
    return;
  }

  const formattedDate = inspection.inspection_date
    ? format(new Date(inspection.inspection_date), 'dd MMMM yyyy', { locale: localeId })
    : '-';

  try {
    const doc = new jsPDF({
      orientation: 'p',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 10;
    const contentWidth = pageWidth - (margin * 2); // 190mm

    // Helpers
    const safeText = (text: any) => (text === null || text === undefined || text === '' ? '-' : String(text));

    const urlToDataUrl = async (url: string): Promise<string | null> => {
      if (!url) return null;
      if (url.startsWith('data:image')) return url;

      // Ensure URL is absolute - using current origin to leverage proxy
      let finalUrl = url;
      if (!url.startsWith('http')) {
        // Use window.location.origin to support access from other devices (IP/Public)
        // This will route through the Vite proxy (port 8888 -> 5555)
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5555';
        finalUrl = `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
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

    const addImageSafe = (dataUrl: string | undefined | null, x: number, y: number, w: number, h: number) => {
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

    // Pre-process images
    toast.loading('Memproses gambar...', { id: 'pdf-process' });
    const checkerSig = await urlToDataUrl(inspection.checker_signature || '');
    const warehouseSig = await urlToDataUrl(inspection.warehouse_signature || '');
    const supervisorSig = await urlToDataUrl(inspection.supervisor_signature || '');
    const driverSig = await urlToDataUrl(inspection.driver_signature || '');

    const sjPhoto = await urlToDataUrl(inspection.surat_jalan_photo_url || '');
    const ttbPhoto = await urlToDataUrl(inspection.ttb_photo_url || '');
    const coaPhoto = await urlToDataUrl(inspection.coa_photo_url || '');

    const weightPhotos = await Promise.all(
      (inspection.weights || []).map(async (w) => {
        if (w.photo_url) return await urlToDataUrl(w.photo_url);
        return null;
      })
    );
    toast.success('Gambar berhasil diproses', { id: 'pdf-process' });

    const drawCheckmark = (x: number, y: number, center: boolean = false) => {
      doc.setFont('zapfdingbats', 'normal');
      if (center) {
        doc.text('4', x, y, { align: 'center' });
      } else {
        doc.text('4', x, y);
      }
      doc.setFont('helvetica', 'normal');
    };

    const drawOfficialHeader = (titleLines: string[], docNo: string, revNo: string, dateStr: string, pageNum: string = '1 dari 1') => {
      const headerH = 22;
      doc.setLineWidth(0.2);
      doc.rect(margin, margin, contentWidth, headerH);
      const col1W = 50;
      const col2W = 85;
      doc.line(margin + col1W, margin, margin + col1W, margin + headerH);
      doc.line(margin + col1W + col2W, margin, margin + col1W + col2W, margin + headerH);

      // Add Logo Image
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
      const titleY = margin + (headerH/2) - ((titleLines.length-1)*2);
      titleLines.forEach((line, i) => doc.text(line, margin + col1W + col2W/2, titleY + (i * 4.5), { align: 'center' }));
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
      drawL('No. Dok', docNo, margin + 4);
      drawL('No. Rev', revNo, margin + 9.5);
      drawL('Tanggal', dateStr, margin + 15);
      drawL('Halaman', pageNum, margin + 20.5);
      return margin + headerH;
    };

    // =========================================================================
    // PAGE 1: PENGECEKAN KENDARAAN KEDATANGAN BARANG (FRM.QAQC.05.19.01)
    // =========================================================================
    doc.setLineWidth(0.4);
    doc.rect(margin, margin, contentWidth, pageHeight - (margin * 2));
    let yHead = drawOfficialHeader(['PENGECEKAN KENDARAAN', 'KEDATANGAN BARANG'], 'FRM.QAQC.05.19.01', '03', '23 April 2024', '1 dari 1');

    doc.setFontSize(8); doc.setFont('helvetica', 'bold');
    doc.setFillColor(0, 0, 0);
    doc.rect(margin + 2, yHead + 3.8, 2, 2, 'F');
    doc.text('Kendaraan', margin + 5, yHead + 5.5);
    doc.setFont('helvetica', 'normal');
    doc.text(`Tanggal : ${formattedDate}`, pageWidth - margin - 45, yHead + 5.5);

    let y1 = yHead + 12;
    const drawP1Line = (l: string, v: string, currY: number) => {
      doc.setFontSize(6.5); doc.setFont('helvetica', 'bold'); doc.text(l, margin + 4, currY);
      doc.setFontSize(7); doc.setFont('helvetica', 'normal'); doc.text(': ' + v, margin + 35, currY);
      doc.line(margin + 35, currY + 0.5, margin + 110, currY + 0.5);
    };
    drawP1Line('No. Polisi', safeText(inspection.vehicle_no), y1); y1 += 5.5;
    drawP1Line('Jenis Kendaraan', safeText(inspection.vehicle_type), y1); y1 += 5.5;
    drawP1Line('Jenis Bak', safeText(inspection.vehicle_cover_type), y1); y1 += 5.5;
    drawP1Line('Nama Sopir', safeText(inspection.driver_name), y1); y1 += 5.5;
    drawP1Line('No. Telp.', safeText(inspection.driver_phone), y1);

    y1 += 8; doc.setFontSize(7.5); doc.setFont('helvetica', 'bold');
    doc.rect(margin + 2, y1 - 2.2, 2, 2, 'F');
    doc.text('Kondisi Kendaraan', margin + 5, y1);
    doc.rect(margin + (contentWidth/2) + 2, y1 - 2.2, 2, 2, 'F');
    doc.text('Kondisi Barang', margin + (contentWidth/2) + 5, y1);

    const drawCheckP1 = (label: string, val: any, x: number, currY: number) => {
      doc.setFontSize(6.5); doc.setFont('helvetica', 'normal');
      doc.text('- ' + label, x + 5, currY);
      const okX = x + 48; const ngX = okX + 12;
      doc.rect(okX, currY - 2.2, 2.5, 2.5); doc.text('OK', okX + 3.5, currY);
      if (val === 1) drawCheckmark(okX + 0.3, currY - 0.5);
      doc.rect(ngX, currY - 2.2, 2.5, 2.5); doc.text('Tidak', ngX + 3.5, currY);
      if (val === 0) drawCheckmark(ngX + 0.3, currY - 0.5);
    };

    let cY1 = y1 + 6;
    drawCheckP1('Kebersihan', inspection.vehicle_clean, margin, cY1);
    drawCheckP1('Tidak Basah', inspection.item_not_wet, margin + contentWidth/2, cY1); cY1 += 5;
    drawCheckP1('Tidak Berbau', inspection.vehicle_no_odor, margin, cY1);
    drawCheckP1('Tidak Robek', inspection.item_not_torn, margin + contentWidth/2, cY1); cY1 += 5;
    drawCheckP1('Bak Tertutup', inspection.vehicle_closed, margin, cY1);
    drawCheckP1('Tidak Berdebu', inspection.item_not_dusty, margin + contentWidth/2, cY1); cY1 += 5;
    drawCheckP1('Kedatangan On-Time', inspection.vehicle_on_time, margin, cY1);
    drawCheckP1('Tertutup Rapat', inspection.item_closed_tight, margin + contentWidth/2, cY1); cY1 += 5;
    drawCheckP1('Pengiriman On-Time', inspection.vehicle_on_time_delivery, margin, cY1);
    drawCheckP1('No Haram', inspection.item_no_haram, margin + contentWidth/2, cY1);

    // Add footnote for "Tertutup rapat"
    doc.setFontSize(5); doc.setFont('helvetica', 'italic');
    doc.text('*) Kondisi plakban pada box / kondisi benang pada zak', margin + contentWidth/2 + 5, cY1 + 4);
    doc.setFont('helvetica', 'normal');

    y1 = cY1 + 10; doc.setFontSize(7.5); doc.setFont('helvetica', 'bold');
    doc.rect(margin + 2, y1 - 2.2, 2, 2, 'F');
    doc.text('Hasil Hitung Bongkar', margin + 5, y1); y1 += 6;
    const drawBLine = (l: string, v: string, currY: number) => {
      doc.setFontSize(6.5); doc.setFont('helvetica', 'bold'); doc.text(l, margin + 4, currY);
      doc.setFontSize(7); doc.setFont('helvetica', 'normal'); doc.text(': ' + v, margin + 40, currY);
      doc.line(margin + 40, currY + 0.5, margin + 140, currY + 0.5);
    };
    drawBLine('Nama Supplier', safeText(inspection.supplier_name), y1); y1 += 5.5;
    drawBLine('Nama Produsen', safeText((inspection as any).producer_name || inspection.nama_produsen), y1); y1 += 5.5;
    drawBLine('Nama Material', safeText((inspection as any).material_name || inspection.item_name), y1); y1 += 5.5;
    drawBLine('Negara Produsen', safeText(inspection.negara_produsen), y1); y1 += 5.5;
    drawBLine('Logo Halal', safeText(inspection.logo_halal), y1);

    y1 += 8; doc.setFont('helvetica', 'bold');
    doc.rect(margin + 2, y1 - 2.2, 2, 2, 'F');
    doc.text('Jumlah', margin + 5, y1); y1 += 4;
    const tableX = margin + 2; const rowH = 5;
    const colWs = [10, 30, 30, 25, 25, 30]; // Adjusted for new columns
    const tableW = colWs.reduce((a, b) => a + b, 0);
    doc.rect(tableX, y1, tableW, rowH);
    let curX1 = tableX;
    ['NO', 'NO. BATCH', 'EXP DATE', `QTY (${inspection.packaging_unit})`, `ISI/${inspection.packaging_unit}`, `TOTAL (${inspection.measure_unit})`].forEach((h, i) => {
      doc.setFontSize(5.5); doc.text(h, curX1 + colWs[i]/2, y1 + 3.5, { align: 'center' });
      curX1 += colWs[i]; if (i < 5) doc.line(curX1, y1, curX1, y1 + rowH * 12);
    });
    for (let i = 0; i < 10; i++) {
      const rY = y1 + rowH * (i + 1); doc.rect(tableX, rY, tableW, rowH);
      const itm = inspection.items?.[i];
      doc.setFontSize(6); doc.text(String(i + 1), tableX + colWs[0]/2, rY + 3.5, { align: 'center' });
      if (itm) {
        doc.text(safeText(itm.batch_no), tableX + colWs[0] + 2, rY + 3.5);
        if ((itm as any).lot_code) {
          doc.setFontSize(4.5);
          doc.text(`[${safeText((itm as any).lot_code)}]`, tableX + colWs[0] + 2, rY + 6.5);
          doc.setFontSize(6);
        }
        doc.text(safeText(itm.expired_date), tableX + colWs[0] + colWs[1] + 2, rY + 3.5);
        doc.setFontSize(7); doc.setFont('helvetica', 'bold');

        // Qty
        doc.text(safeText(itm.qty), tableX + colWs[0] + colWs[1] + colWs[2] + colWs[3] - 2, rY + 3.5, { align: 'right' });

        // Weight per unit
        doc.text(safeText(itm.weight_per_unit), tableX + colWs[0] + colWs[1] + colWs[2] + colWs[3] + colWs[4] - 2, rY + 3.5, { align: 'right' });

        // Total
        const totalLine = ((Number(itm.qty) || 0) * (Number(itm.weight_per_unit) || 0)).toLocaleString();
        doc.text(totalLine, tableX + tableW - 2, rY + 3.5, { align: 'right' });
        doc.setFont('helvetica', 'normal');
      }
    }
    const tTotalY = y1 + rowH * 11; doc.rect(tableX, tTotalY, tableW, rowH);
    doc.setFont('helvetica', 'bold');
    doc.text(`Total Keseluruhan (${inspection.measure_unit || 'KG'})`, tableX + (tableW - colWs[5])/2, tTotalY + 3.5, { align: 'center' });

    const totalAll = (inspection.items?.slice(0, 10) || []).reduce((acc, curr) => acc + ((Number(curr.qty) || 0) * (Number(curr.weight_per_unit) || 0)), 0).toLocaleString();
    doc.text(totalAll, tableX + tableW - 2, tTotalY + 3.5, { align: 'right' });

    y1 = tTotalY + 12; const sigW1 = contentWidth / 3;
    doc.setLineWidth(0.2);
    doc.rect(margin, y1 - 2, contentWidth, 22); // Outer box
    doc.line(margin + sigW1, y1 - 2, margin + sigW1, y1 + 20);
    doc.line(margin + sigW1 * 2, y1 - 2, margin + sigW1 * 2, y1 + 20);

    doc.setFontSize(7.5); doc.setFont('helvetica', 'bold');
    doc.text('Sopir', margin + sigW1/2, y1 + 2, { align: 'center' });
    doc.text('QC Incoming', margin + sigW1 + sigW1/2, y1 + 2, { align: 'center' });
    doc.text('Gudang', margin + sigW1 * 2 + sigW1/2, y1 + 2, { align: 'center' });
    doc.line(margin, y1 + 4, margin + contentWidth, y1 + 4);

    addImageSafe(driverSig, margin + 10, y1 + 5.5, 35, 12);
    addImageSafe(checkerSig, margin + sigW1 + 10, y1 + 5.5, 35, 12);
    addImageSafe(warehouseSig, margin + sigW1 * 2 + 10, y1 + 5.5, 35, 12);

    doc.setFontSize(6.5);
    doc.text(`( ${safeText(inspection.driver_name)} )`, margin + sigW1/2, y1 + 19, { align: 'center' });
    doc.text(`( ${safeText(inspection.checker_name)} )`, margin + sigW1 + sigW1/2, y1 + 19, { align: 'center' });
    doc.text('( Bagian Gudang )', margin + sigW1 * 2 + sigW1/2, y1 + 19, { align: 'center' });

    // =========================================================================
    // PAGE 2: HASIL PEMERIKSAAN KEMASAN & KUANTITAS (Handwritten Template)
    // =========================================================================
    doc.addPage();
    doc.setLineWidth(0.4);
    doc.rect(margin, margin, contentWidth, pageHeight - (margin * 2));

    // Simple Header tanpa Logo dan No Dok (As requested for Page 2)
    const h2H = 22;
    doc.setLineWidth(0.2);
    doc.rect(margin, margin, contentWidth, h2H);
    doc.line(pageWidth - margin - 30, margin, pageWidth - margin - 30, margin + h2H);

    doc.setFont('helvetica', 'bold'); doc.setFontSize(11);
    doc.text('HASIL PEMERIKSAAN', margin + (contentWidth - 30)/2, margin + 9, { align: 'center' });
    doc.text('KEMASAN & KUANTITAS', margin + (contentWidth - 30)/2, margin + 15, { align: 'center' });

    doc.setFontSize(6.5);
    doc.text('Halaman', pageWidth - margin - 29, margin + 12);
    doc.setFont('helvetica', 'normal');
    doc.text(': 1 dari 1', pageWidth - margin - 18, margin + 12);

    let y2 = margin + h2H;

    y2 += 5;
    const drawHandMeta = (l1: string, v1: string, l2: string, v2: string, currY: number) => {
      doc.setFont('helvetica', 'bold'); doc.setFontSize(6.5);
      doc.text(l1, margin + 5, currY); doc.text(l2, margin + 105, currY);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(7);
      doc.text(': ' + v1, margin + 35, currY); doc.text(': ' + v2, margin + 135, currY);
      doc.line(margin + 35, currY + 0.5, margin + 98, currY + 0.5);
      doc.line(margin + 135, currY + 0.5, 195, currY + 0.5);
    };
    drawHandMeta('TANGGAL MASUK', formattedDate, 'NO. PO', safeText(inspection.po_no), y2); y2 += 6;
    drawHandMeta('NAMA MATERIAL', safeText(inspection.material_name || inspection.product_code), 'KODE PRODUKSI', safeText(inspection.kode_produksi), y2); y2 += 6;
    drawHandMeta('NAMA SUPPLIER', safeText(inspection.supplier_name), 'NAMA EXPEDISI', safeText(inspection.expedition_name), y2); y2 += 6;
    drawHandMeta('NO. SURAT JALAN', safeText(inspection.surat_jalan_no), 'NO. KENDARAAN', safeText(inspection.vehicle_no), y2); y2 += 6;
    drawHandMeta('LOKASI PABRIK', safeText(inspection.pabrik_danone), 'JENIS KENDARAAN', safeText(inspection.vehicle_type), y2); y2 += 6;
    drawHandMeta('EXPIRED DATE', safeText(inspection.expired_date), 'JENIS BAK', safeText(inspection.vehicle_cover_type), y2); y2 += 6;
    doc.setFont('helvetica', 'bold'); doc.setFontSize(6.5); doc.text('NO SEAL', margin + 5, y2);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.text(': ' + safeText(inspection.no_seal), margin + 35, y2);
    doc.line(margin + 35, y2 + 0.5, margin + 98, y2 + 0.5);

    y2 += 12; doc.setFontSize(7.5); doc.setFont('helvetica', 'bold');
    doc.text('1. PEMERIKSAAN KEMASAN', margin + 2, y2);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7);
    doc.text('BERI TANDA ( V ) PADA KONDISI KEMASAN :', margin + 5, y2 + 4.5);

    y2 += 7; const boxW2 = (contentWidth - 15) / 3; const boxH2 = 14;
    const drawPBox2 = (title: string, opts: string[], selected: string | null, x: number, yP: number) => {
      doc.rect(x, yP, boxW2, boxH2);
      doc.setFont('helvetica', 'bold'); doc.setFontSize(7);
      doc.text(title, x + boxW2/2, yP + 4, { align: 'center' });
      doc.line(x, yP + 6, x + boxW2, yP + 6);
      doc.setFontSize(6); const sX = boxW2 / opts.length;
      opts.forEach((opt, i) => {
        doc.text(opt, x + (sX * i) + (sX/2), yP + 9.5, { align: 'center' });
        if (selected?.toUpperCase() === opt.toUpperCase()) drawCheckmark(x + (sX * i) + (sX/2) - 1.2, yP + 13);
      });
    };
    drawPBox2('KONDISI KEMASAN', ['BAIK', 'RUSAK', 'RUSAK SEBAGIAN'], inspection.pkg_condition, margin + 2, y2);
    drawPBox2('NAMA BARANG', ['ADA', 'TIDAK ADA'], inspection.pkg_name_check, margin + 7 + boxW2, y2);
    drawPBox2('LABEL BAHAYA', ['ADA', 'TIDAK ADA', 'TIDAK PERLU'], inspection.pkg_hazard_label, margin + 12 + (boxW2 * 2), y2);

    y2 += boxH2 + 5; doc.setFontSize(7); doc.text('Catatan :', margin + 5, y2);
    doc.line(margin + 18, y2 + 0.5, 195, y2 + 0.5);
    doc.text(safeText(inspection.packaging_notes), margin + 20, y2);

    y2 += 11; doc.setFontSize(7.5); doc.setFont('helvetica', 'bold');
    doc.text('2. PEMERIKSAAN JUMLAH BARANG :', margin + 2, y2);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7);

    // Total Arrival
    doc.text('A. TOTAL KEDATANGAN = ', margin + 8, y2 + 5);
    const totalArrival = (inspection.items || []).reduce((acc, curr) => acc + ((Number(curr.qty) || 0) * (Number(curr.weight_per_unit) || 0)), 0).toLocaleString();
    doc.setFont('helvetica', 'bold'); doc.text(`${totalArrival} ${inspection.measure_unit || 'KG'}`, margin + 48, y2 + 5);
    doc.line(margin + 46, y2 + 5.5, 95, y2 + 5.5);

    // Total Received
    doc.setFont('helvetica', 'normal');
    doc.text('B. TOTAL DITERIMA (OK) = ', margin + 105, y2 + 5);
    const totalReceived = (inspection.total_received_qty || 0).toLocaleString();
    doc.setFont('helvetica', 'bold'); doc.text(`${totalReceived} ${inspection.measure_unit || 'KG'}`, margin + 145, y2 + 5);
    doc.line(margin + 143, y2 + 5.5, 195, y2 + 5.5);

    y2 += 6;
    doc.setFont('helvetica', 'normal'); doc.text('Ket. Tambahan :', margin + 8, y2 + 5);
    doc.setFont('helvetica', 'bold'); doc.text(safeText(inspection.total_items_received_text), margin + 48, y2 + 5);
    doc.line(margin + 46, y2 + 5.5, 195, y2 + 5.5);

    y2 += 10; const smpW2 = (contentWidth - 10) * 0.65; const nteW2 = (contentWidth - 10) * 0.35;
    const tX2 = margin + 2; const rH2 = 4.5;
    // Header: Hasil Sampling + Catatan
    doc.rect(tX2, y2, smpW2, rH2); doc.setFontSize(7); doc.text(`Hasil Sampling (${inspection.packaging_unit || 'UNIT'})`, tX2 + smpW2/2, y2 + 3.2, { align: 'center' });
    doc.rect(tX2 + smpW2, y2, nteW2, rH2); doc.text('CATATAN', tX2 + smpW2 + nteW2/2, y2 + 3.2, { align: 'center' });
    y2 += rH2;
    // Single table header
    doc.rect(tX2, y2, smpW2, rH2);
    const cNo = 8; const cBatch = 32; const cVendor = 32; const cQty = 22; const cWeight = smpW2 - (cNo + cBatch + cVendor + cQty);
    doc.setFontSize(5.5);
    doc.text('No', tX2 + cNo/2, y2 + 3.2, { align: 'center' });
    doc.text('Batch', tX2 + cNo + cBatch/2, y2 + 3.2, { align: 'center' });
    doc.text('Batch Vendor', tX2 + cNo + cBatch + cVendor/2, y2 + 3.2, { align: 'center' });
    doc.text(`Qty (${inspection.packaging_unit || 'UNIT'})`, tX2 + cNo + cBatch + cVendor + cQty/2, y2 + 3.2, { align: 'center' });
    doc.text(`Berat Timbangan`, tX2 + cNo + cBatch + cVendor + cQty + cWeight/2, y2 + 3.2, { align: 'center' });
    // Vertical lines end exactly at bottom of header + 20 rows
    const tableHRows = rH2 * 20;
    const tableHFull = rH2 + tableHRows; // header row + 20 data rows
    doc.line(tX2 + cNo, y2, tX2 + cNo, y2 + tableHFull);
    doc.line(tX2 + cNo + cBatch, y2, tX2 + cNo + cBatch, y2 + tableHFull);
    doc.line(tX2 + cNo + cBatch + cVendor, y2, tX2 + cNo + cBatch + cVendor, y2 + tableHFull);
    doc.line(tX2 + cNo + cBatch + cVendor + cQty, y2, tX2 + cNo + cBatch + cVendor + cQty, y2 + tableHFull);
    // Rows 1..20
    for (let i = 0; i < 20; i++) {
      const rowY = y2 + rH2 * (i + 1); doc.rect(tX2, rowY, smpW2, rH2);
      const itm = inspection.items?.[i];
      doc.setFontSize(6); doc.text(String(i + 1), tX2 + cNo/2, rowY + 3.2, { align: 'center' });
      if (itm) {
        doc.setFontSize(5); doc.text(safeText(itm.batch_no), tX2 + cNo + 1.5, rowY + 3.2);
        if ((itm as any).lot_code) {
          doc.setFontSize(4.2);
          doc.text(`[${safeText((itm as any).lot_code)}]`, tX2 + cNo + 1.5, rowY + 4.8);
          doc.setFontSize(6);
        }
        doc.text(safeText((itm as any).batch_vendor || ''), tX2 + cNo + cBatch + 1.5, rowY + 3.2);
        doc.setFontSize(6); doc.setFont('helvetica', 'bold');
        doc.text(safeText(itm.qty), tX2 + cNo + cBatch + cVendor + cQty - 2, rowY + 3.2, { align: 'right' });
        const wt = (itm as any).scale_weight != null ? String((itm as any).scale_weight) : '';
        doc.text(wt, tX2 + smpW2 - 2, rowY + 3.2, { align: 'right' });
        doc.setFont('helvetica', 'normal');
      }
    }
    // Notes box on the right matches table height (header + rows)
    doc.rect(tX2 + smpW2, y2, nteW2, tableHFull); doc.setFontSize(6);
    doc.text(doc.splitTextToSize(safeText(inspection.notes), nteW2 - 4), tX2 + smpW2 + 2, y2 + 4);

    // Move cursor to bottom of table section
    const tableBottomY = y2 + tableHFull;

    // Clear background area under table for signatures/time (avoid overlapped lines)
    const ySigStart = tableBottomY + 8;
    doc.setFillColor(255, 255, 255);
    // Clear area starting just below the table bottom to avoid cutting table lines
    doc.rect(margin + 1, tableBottomY + 2, contentWidth - 2, 42, 'F');

    doc.setLineWidth(0.2);
    // Draw signature boxes on the right side
    const boxStartX = margin + 100;
    const boxW = (contentWidth - 100) / 2;
    const sigBoxH = 22;
    doc.rect(boxStartX, ySigStart, contentWidth - 100, sigBoxH);
    doc.line(boxStartX + boxW, ySigStart, boxStartX + boxW, ySigStart + sigBoxH);
    doc.line(boxStartX, ySigStart + 6, margin + contentWidth, ySigStart + 6);

    doc.setFontSize(7.5); doc.setFont('helvetica', 'bold');
    doc.text('Gudang', boxStartX + boxW / 2, ySigStart + 4, { align: 'center' });
    doc.text('Driver Expedisi', boxStartX + boxW + boxW / 2, ySigStart + 4, { align: 'center' });

    addImageSafe(warehouseSig, boxStartX + 5, ySigStart + 6, 35, 12);
    addImageSafe(driverSig, boxStartX + boxW + 5, ySigStart + 6, 35, 12);

    doc.setFontSize(6.5);
    doc.text('( Bagian Gudang )', boxStartX + boxW / 2, ySigStart + 19.5, { align: 'center' });
    doc.text(`( ${safeText(inspection.driver_name)} )`, boxStartX + boxW + boxW / 2, ySigStart + 19.5, { align: 'center' });

    // Place time rows below the signature area to avoid overlap
    const timeY = ySigStart + sigBoxH + 6;
    doc.setFontSize(7.5); doc.setFont('helvetica', 'normal');
    doc.text('MULAI BONGKAR   : ' + safeText(inspection.unloading_start_time), margin + 5, timeY);
    doc.text('SELESAI BONGKAR : ' + safeText(inspection.unloading_end_time), margin + 5, timeY + 5);

    // =========================================================================
    // PAGE 3: INCOMING MATERIAL QC (FRM.QAQC.05.01.03 - Image Reconstruction)
    // =========================================================================
    doc.addPage();
    doc.setLineWidth(0.5); doc.rect(margin, margin, contentWidth, pageHeight - (margin * 2));
    let y3 = drawOfficialHeader(['INCOMING MATERIAL'], 'FRM.QAQC.05.01.03', '07', '23 April 2024', '1 dari 1');

    // Official Metadata Grid Page 3 (Ultra Tight)
    const cellH3 = 3.6; doc.setLineWidth(0.2);
    doc.rect(margin, y3, contentWidth, cellH3 * 8);
    doc.line(margin + 100, y3, margin + 100, y3 + cellH3 * 8);

    // Material Selection Checklist in Header (6 Options)
    doc.setFont('helvetica', 'bold'); doc.setFontSize(4.5); doc.text('Material', margin + 2, y3 + 2.5);
    const mats = ['Resin', 'Masterbatch', 'Tinta', 'Carton Box', 'Inner Bag', 'Blanket'];
    let curMX = margin + 15;
    mats.forEach(m => {
      const isSelected = inspection.material_type === m;
      doc.rect(curMX, y3 + 0.8, 2, 2);
      if (isSelected) drawCheckmark(curMX + 0.1, y3 + 2.3);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(3.8);
      doc.text(m, curMX + 3, y3 + 2.3);
      curMX += (m.length * 0.95) + 6.5;
    });
    doc.line(margin, y3 + cellH3, margin + 100, y3 + cellH3);

    const drawP3M = (l: string, v: string, x: number, curY: number, vX: number) => {
      doc.setFont('helvetica', 'bold'); doc.setFontSize(4.8); doc.text(l, x + 2, curY + 2.5);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(5.2); doc.text(': ' + v, x + vX, curY + 2.5);
      doc.line(x, curY + cellH3, x === margin ? margin + 100 : pageWidth - margin, curY + cellH3);
    };

    let mY = y3 + cellH3;
    drawP3M('Nama Supplier', safeText(inspection.supplier_name), margin, mY, 30);
    const firstItem = (inspection.items && inspection.items[0]) as any;
    const p3Batch = firstItem?.lot_code ? `${safeText(firstItem.batch_no)} [${safeText(firstItem.lot_code)}]` : safeText(firstItem?.batch_no);
    drawP3M('Batch / Lot No.', p3Batch, margin + 100, y3, 25); mY += cellH3;
    drawP3M('Nama Produsen', safeText((inspection as any).producer_name || inspection.nama_produsen), margin, mY, 30);
    drawP3M('Nama Material', safeText((inspection as any).material_name || inspection.item_name), margin + 100, y3 + cellH3, 25); mY += cellH3;
    drawP3M('No. PO / SJ', safeText(inspection.po_no), margin + 100, y3 + cellH3 * 2, 25); mY += cellH3;
    drawP3M('Tanggal pengecekan', formattedDate, margin, mY, 30);
    drawP3M('Jumlah Sampling', safeText(inspection.jumlah_sampling), margin + 100, y3 + cellH3 * 3, 25); mY += cellH3;
    drawP3M('Jumlah Kedatangan', safeText(inspection.total_items_received_text), margin, mY, 30);
    drawP3M('Tanggal Produksi', safeText(inspection.tanggal_produksi), margin + 100, y3 + cellH3 * 4, 25); mY += cellH3;
    drawP3M('Negara Produsen', safeText(inspection.negara_produsen), margin, mY, 30);
    drawP3M('Expired Date', safeText(inspection.expired_date), margin + 100, y3 + cellH3 * 5, 25); mY += cellH3;
    drawP3M('Logo Halal', safeText(inspection.logo_halal), margin, mY, 30);

    y3 += cellH3 * 8 + 1;
    // Checklist Header Page 3 (Perfect Centering)
    const mainColW = 156; // Narrowed main column to give space to side table
    const sideColW = contentWidth - mainColW; // Wider side column for Mil Std table

    doc.setFont('helvetica', 'bold'); doc.setFontSize(5);
    // Define column stops inside main table
    const xNo = 6, xItem = 44, xStdEnd = 120, xScoreEnd = 126, xAqlEnd = 132, xSampStart = 136;

    doc.rect(margin, y3, mainColW, 8);
    doc.text('No.', margin + 1, y3 + 5); doc.text('Item Pengecekan', margin + 7, y3 + 5);
    doc.text('Standart', margin + 48, y3 + 5);
    doc.text('Score', margin + ((xStdEnd + xScoreEnd) / 2), y3 + 5, { align: 'center' });
    doc.text('AQL', margin + ((xScoreEnd + xAqlEnd) / 2), y3 + 5, { align: 'center' });

    // Vertical lines for header
    [xNo, xItem, xStdEnd, xScoreEnd, xAqlEnd].forEach(x => doc.line(margin + x, y3, margin + x, y3 + 8));

    // n1, n2, n3 Centering
    // Starting point: xSampStart
    const n1X = xSampStart + 4, n2X = xSampStart + 12, n3X = xSampStart + 18;
    doc.text('n1', margin + n1X, y3 + 3, { align: 'center' });
    doc.text('n2', margin + n2X, y3 + 3, { align: 'center' });
    doc.text('n3', margin + n3X, y3 + 3, { align: 'center' });
    doc.setFontSize(3.2);
    const subW = 4;
    doc.text('Ac', margin + (xSampStart + subW/2), y3 + 6.5, { align: 'center' });
    doc.text('Re', margin + (xSampStart + subW + subW/2), y3 + 6.5, { align: 'center' });
    // n2 and n3 sub-columns left empty as per request

    doc.line(margin + xSampStart, y3 + 3.5, margin + mainColW, y3 + 3.5);
    // Vertical lines for the n1, n2, n3 header boxes (top part)
    [xSampStart + 12, xSampStart + 18, mainColW].forEach(x => doc.line(margin + x, y3, margin + x, y3 + 3.5));
    // Vertical lines for sub-columns (bottom part)
    [xSampStart + 4, xSampStart + 8, xSampStart + 12, xSampStart + 16, xSampStart + 20].forEach(x => doc.line(margin + x, y3 + 3.5, margin + x, y3 + 8));
    doc.line(margin + xSampStart, y3, margin + xSampStart, y3 + 8);

    // Mil Std 105D Side Table Header
    doc.setFillColor(240, 240, 240);
    doc.rect(margin + mainColW, y3, sideColW, 3.8, 'F');
    doc.rect(margin + mainColW, y3, sideColW, 3.8);
    doc.setFontSize(3.8); doc.text('Mil Std 105D - S3 AQL 4.0', margin + mainColW + sideColW/2, y3 + 2.8, { align: 'center' });
    doc.rect(margin + mainColW, y3 + 3.8, sideColW, 4.2);
    const sw = sideColW / 4;
    ['Jumlah', 'n', 'Ac', 'Re'].forEach((h, i) => {
      doc.text(h, margin + mainColW + (sw * i) + sw/2, y3 + 6.8, { align: 'center' });
      if (i > 0) doc.line(margin + mainColW + (sw * i), y3 + 3.8, margin + mainColW + (sw * i), y3 + 8);
    });

    let yQC = y3 + 8; const qp = inspection.qc_params;
    const drawSideRow = (y: number, range: string, n: string, ac: string, re: string) => {
      doc.rect(margin + mainColW, y, sideColW, 3.5); doc.setFontSize(3.5); doc.setFont('helvetica', 'normal');
      doc.text(range, margin + mainColW + sw/2, y + 2.4, { align: 'center' });
      doc.text(n, margin + mainColW + sw + sw/2, y + 2.4, { align: 'center' });
      doc.text(ac, margin + mainColW + sw*2 + sw/2, y + 2.4, { align: 'center' });
      doc.text(re, margin + mainColW + sw*3 + sw/2, y + 2.4, { align: 'center' });
      [1, 2, 3].forEach(i => doc.line(margin + mainColW + sw*i, y, margin + mainColW + sw*i, y + 3.5));
    };

    const drawQC = (no: string, itm: string, std: string, scr: string, aql: string, val: any) => {
      const rowH = 3.5; doc.rect(margin, yQC, mainColW, rowH); doc.setFontSize(4.2); doc.setFont('helvetica', 'normal');
      doc.text(no, margin + 1, yQC + 2.4); doc.text(itm, margin + 7, yQC + 2.4);

      const stdText = doc.splitTextToSize(std, 74);
      doc.text(stdText, margin + 48, yQC + 2.4);

      doc.text(scr, margin + ((xStdEnd + xScoreEnd) / 2), yQC + 2.4, { align: 'center' });
      doc.text(aql, margin + ((xScoreEnd + xAqlEnd) / 2), yQC + 2.4, { align: 'center' });

      // Fixed vertical lines (including Score, AQL, and sampling)
      [xNo, xItem, xStdEnd, xScoreEnd, xAqlEnd, xSampStart, xSampStart + 4, xSampStart + 8, xSampStart + 12, xSampStart + 16, mainColW].forEach(x => doc.line(margin + x, yQC, margin + x, yQC + rowH));

      // Perfectly centered marks for n1, n2, n3 (Relative to sampling start)
      if (val === 1) {
        doc.setFont('helvetica', 'bold');
        doc.text('O', margin + (xSampStart + subW/2), yQC + 2.4, { align: 'center' }); // n1 Ac
        doc.setFont('helvetica', 'normal');
      } else if (val === 2) {
        doc.setFont('helvetica', 'bold');
        doc.text('O', margin + (xSampStart + subW + subW/2), yQC + 2.4, { align: 'center' }); // n1 Re
        doc.setFont('helvetica', 'normal');
      }
      yQC += rowH;
    };

    doc.setFont('helvetica', 'bold'); doc.rect(margin, yQC, mainColW, 3.5);
    doc.text('KUALITAS :', margin + 1, yQC + 2.4);
    [xNo, xItem, xStdEnd, xScoreEnd, xAqlEnd, xSampStart, xSampStart + 4, xSampStart + 8, xSampStart + 12, xSampStart + 16, mainColW].forEach(x => doc.line(margin + x, yQC, margin + x, yQC + 3.5));
    yQC += 3.5;

    drawQC('1.', 'Berat', 'Sesuai standart di ITP', '30/25', '4.0', qp?.q_berat);
    drawSideRow(yQC - 3.5, '2 - 15', '2', '0', '1');
    drawQC('2.', 'Fungsional', '', '25', '', '');
    drawSideRow(yQC - 3.5, '16 - 50', '3', '0', '1');
    drawQC('a.', 'Joint', 'Las merekat kuat tidak lepas saat ditarik, joint gap box 3 - 9 mm.', '', '4.0', qp?.q_joint);
    drawSideRow(yQC - 3.5, '51 - 150', '5', '0', '1');
    drawQC('b.', 'Creasing / Lipatan', 'Mudah di lipat dan tidak pecah.', '', '4.0', qp?.q_creasing);
    drawSideRow(yQC - 3.5, '151 - 500', '8', '1', '2');
    drawQC('3.', 'CoA', '', '40/25', '', '');
    drawSideRow(yQC - 3.5, '501 - 3200', '13', '1', '2');
    drawQC('a.', 'Panjang', 'Sesuai standart di ITP', '', '4.0', qp?.q_coa_panjang);
    drawSideRow(yQC - 3.5, '3201 - 35000', '20', '2', '3');
    drawQC('b.', 'Lebar', 'Sesuai standart di ITP', '', '4.0', qp?.q_coa_lebar);
    drawSideRow(yQC - 3.5, '35001 - 500000', '32', '3', '4');
    drawQC('c.', 'Tinggi', 'Sesuai standart di ITP', '', '4.0', qp?.q_coa_tinggi);

    doc.setFillColor(240, 240, 240);
    doc.rect(margin + mainColW, yQC, sideColW, 3.2, 'F');
    doc.rect(margin + mainColW, yQC, sideColW, 3.2);
    doc.setFontSize(3.5); doc.text('Mil Std 105D - S3 AQL 6.5', margin + mainColW + sideColW/2, yQC + 2.2, { align: 'center' });
    yQC += 3.2; doc.rect(margin + mainColW, yQC, sideColW, 3.5);
    ['Jumlah', 'n', 'Ac', 'Re'].forEach((h, i) => {
      doc.text(h, margin + mainColW + (sw * i) + sw/2, yQC + 2.4, { align: 'center' });
      if (i > 0) doc.line(margin + mainColW + (sw * i), yQC, margin + mainColW + (sw * i), yQC + 3.5);
    });
    yQC += 3.5;

    drawQC('d.', 'Tebal', 'Sesuai standart di ITP', '', '4.0', qp?.q_coa_tebal);
    drawSideRow(yQC - 3.5, '2 - 15', '2', '0', '1');
    drawQC('e.', 'BCT', 'Sesuai standart di ITP', '', '4.0', qp?.q_coa_bct);
    drawSideRow(yQC - 3.5, '16 - 50', '3', '0', '1');
    drawQC('f.', 'Cobb size', 'Sesuai standart di ITP', '', '4.0', qp?.q_coa_cobb);
    drawSideRow(yQC - 3.5, '51 - 150', '5', '1', '2');
    drawQC('g.', 'Bursting strength', 'Sesuai standart di ITP', '', '4.0', qp?.q_coa_bursting);
    drawSideRow(yQC - 3.5, '151 - 500', '8', '1', '2');
    drawQC('h.', 'Batch / Lot No', 'Sesuai CoA, tinta maks 6 bulan', '', '4.0', qp?.q_coa_batch_lot);
    drawSideRow(yQC - 3.5, '501 - 3200', '13', '2', '3');
    drawQC('i.', 'Color Chip', 'Sesuai standart', '', '4.0', qp?.q_coa_color_chip);
    drawSideRow(yQC - 3.5, '3201 - 35000', '20', '3', '4');
    drawQC('4.', 'Visual', '', '30/25', '', '');
    drawSideRow(yQC - 3.5, '35001 - 500000', '32', '5', '6');
    drawQC('a.', 'Sobek/Cacat', 'Tidak sobek/cacat', '', '4.0', qp?.q_visual_sobek);

    doc.setFillColor(240, 240, 240);
    doc.rect(margin + mainColW, yQC, sideColW, 3.2, 'F');
    doc.rect(margin + mainColW, yQC, sideColW, 3.2);
    doc.setFontSize(3.5); doc.text('Mil Std 105D - S3 AQL 0.65', margin + mainColW + sideColW/2, yQC + 2.2, { align: 'center' });
    yQC += 3.2; doc.rect(margin + mainColW, yQC, sideColW, 3.5);
    ['Jumlah', 'n', 'Ac', 'Re'].forEach((h, i) => {
      doc.text(h, margin + mainColW + (sw * i) + sw/2, yQC + 2.4, { align: 'center' });
      if (i > 0) doc.line(margin + mainColW + (sw * i), yQC, margin + mainColW + (sw * i), yQC + 3.5);
    });
    yQC += 3.5;

    drawQC('b.', 'Kondisi cetakan', 'Tidak bergeser, maks 1 mm', '', '6.5', qp?.q_visual_cetakan);
    drawSideRow(yQC - 3.5, '2 - 15', '2', '0', '1');
    drawQC('c.', 'Kondisi flutting', 'Patah maks 2', '', '6.5', qp?.q_visual_flutting);
    drawSideRow(yQC - 3.5, '16 - 50', '3', '0', '1');
    drawQC('d.', 'Packaging', 'Rapi', '', '6.5', qp?.q_visual_packaging);
    drawSideRow(yQC - 3.5, '51 - 150', '5', '0', '1');
    drawQC('e.', 'Warna', 'Sesuai standart / CoA', '', '6.5', qp?.q_visual_warna);
    drawSideRow(yQC - 3.5, '151 - 500', '8', '0', '1');
    drawQC('f.', 'Clarity', 'Sesuai standart', '', '6.5', qp?.q_visual_clarity);
    drawSideRow(yQC - 3.5, '501 - 3200', '13', '0', '1');

    doc.setFont('helvetica', 'bold'); doc.rect(margin, yQC, mainColW, 3.5);
    doc.setFontSize(3.5); doc.text('KEAMANAN PANGAN : ( AQL 0,65 - Resin, MB, Tinta, Inner Bag... ) ( AQL 4,0 - Carton Box )', margin + 1, yQC + 2.4);
    [6, 44, 128, 134, 140, 144, 148, 152, 156, 160, 164].forEach(x => doc.line(margin + x, yQC, margin + x, yQC + 3.5));
    yQC += 3.5;

    drawQC('1.', 'Material', '', '50', '', '');
    drawSideRow(yQC - 3.5, '3201 - 35000', '20', '0', '1');
    drawQC('a.', 'Bersih', 'Kering, tidak basah, tidak berdebu, tidak ada kontaminasi serangga, olie, benda asing', '', '0.65', qp?.fs_mat_bersih);
    drawSideRow(yQC - 3.5, '35001 - 500000', '32', '0', '1');
    drawQC('b.', 'Bau', 'Tidak berbau menyengat', '', '', qp?.fs_mat_bau);
    drawQC('2.', 'Kendaraan', '', '50', '', '');
    drawQC('a.', 'Bersih', 'Kering, tidak basah, tidak berdebu, tidak ada kontaminasi serangga, olie, benda asing', '', '', qp?.fs_veh_bersih);
    drawQC('b.', 'Bau', 'Bak Tidak Berbau', '', '', qp?.fs_veh_bau);
    drawQC('c.', 'Bak', 'Tertutup, bersegel', '', '', qp?.fs_veh_bak);
    drawQC('d.', 'Kondisi Segel Kendaraan', 'Bersegel / belum di buka', '', '', qp?.fs_veh_segel);

    // Decision & Score Section (Boxed)
    yQC += 4;
    doc.setLineWidth(0.2);
    // Decision + Score table (3 rows)
    const boxH = 16;
    doc.rect(margin, yQC - 2, contentWidth, boxH); // Outer box for decision and score
    // Row separators
    doc.line(margin, yQC + 3, margin + contentWidth, yQC + 3);
    doc.line(margin, yQC + 10, margin + contentWidth, yQC + 10);

    // Vertical separators for Decision row (for group spacing only)
    doc.line(margin + 50, yQC + 3, margin + 50, yQC + 10);
    doc.line(margin + 100, yQC + 3, margin + 100, yQC + 10);
    doc.line(margin + 150, yQC + 3, margin + 150, yQC + 10);
    // Vertical separators for Score row
    doc.line(margin + 60, yQC + 10, margin + 60, yQC + boxH - 4);
    doc.line(margin + 120, yQC + 10, margin + 120, yQC + boxH - 4);

    // Row baselines (padding inside each row)
    const r1Y = yQC + 1.8; // Note
    const r2Y = yQC + 6.0; // Decision
    const r3Y = yQC + 12.8; // Score

    doc.setFontSize(5.2); doc.setFont('helvetica', 'bold');
    doc.text('Note: Box / plastik inner : n1,2,3 = n/3', margin + 2, r1Y);

    doc.text('Keputusan :', margin + 2, r2Y);
    const decisions = ['Di terima', 'AOD', 'Hold', 'Rejected'];
    let curDX = margin + 25;
    decisions.forEach(d => {
      doc.rect(curDX, r2Y - 2.2, 2.5, 2.5);
      if (qp?.decision === d) drawCheckmark(curDX + 0.1, r2Y - 0.5);
      doc.setFont('helvetica', 'normal'); doc.text(d, curDX + 3, r2Y);
      curDX += 40;
    });

    // Score Summary
    const scoreX = margin + 2; doc.setFontSize(5.2); doc.setFont('helvetica', 'bold');
    doc.text('Score :', scoreX, r3Y);
    doc.text('Score Kualitas : ' + (qp?.qc_score || 0) + '%', scoreX + 60, r3Y, { align: 'center' });
    doc.text('Score Keamanan : ' + (qp?.fs_score || 0) + '%', scoreX + 120, r3Y, { align: 'center' });

    // Reset Y for Signature block – place after the box
    yQC = yQC - 2 + boxH + 4;
    const sC = contentWidth / 3; doc.setFontSize(5.2);
    doc.setLineWidth(0.2);
    const sigHeight = 20; // Increased height for signatures
    doc.rect(margin, yQC, contentWidth, sigHeight); // Outer box for sigs
    doc.line(margin + sC, yQC, margin + sC, yQC + sigHeight);
    doc.line(margin + sC * 2, yQC, margin + sC * 2, yQC + sigHeight);

    doc.setFont('helvetica', 'bold');
    doc.text('Diperiksa', margin + sC/2, yQC + 3, { align: 'center' });
    doc.text('Diketahui', margin + sC + sC/2, yQC + 3, { align: 'center' });
    doc.text('Disetujui', margin + sC * 2 + sC/2, yQC + 3, { align: 'center' });
    doc.line(margin, yQC + 4, margin + contentWidth, yQC + 4);

    addImageSafe(checkerSig, margin + sC/2 - 11, yQC + 5.5, 22, 8);
    addImageSafe(warehouseSig, margin + sC + sC/2 - 11, yQC + 5.5, 22, 8);
    addImageSafe(supervisorSig, margin + sC * 2 + sC/2 - 11, yQC + 5.5, 22, 8);

    doc.setFont('helvetica', 'bold');
    doc.text(`( ${safeText(inspection.checker_name)} )`, margin + sC/2, yQC + 15, { align: 'center' });
    doc.text('( Bagian Gudang )', margin + sC + sC/2, yQC + 15, { align: 'center' });
    doc.text('( Supervisor QAQC )', margin + sC * 2 + sC/2, yQC + 15, { align: 'center' });

    doc.setFont('helvetica', 'normal'); doc.setFontSize(4.5);
    doc.text('QC Incoming', margin + sC/2, yQC + 18, { align: 'center' });
    doc.text('Gudang', margin + sC + sC/2, yQC + 18, { align: 'center' });
    doc.text('SPV QAQC', margin + sC * 2 + sC/2, yQC + 18, { align: 'center' });

    // Footer Tables (Scoring Weights)
    yQC += 22; doc.setFontSize(4.5); doc.setFont('helvetica', 'bold');
    doc.text('Tabel pengecekan (Scoring Weights):', margin, yQC); yQC += 2;
    const fwL = [6, 32, 7, 7, 7, 10, 10, 11]; const fH = 2.4; // Widened for better readability
    const drawH = (x: number, y: number) => {
      doc.rect(x, y, 90, fH); let cX = x;
      ['No', 'Item', 'Resin', 'MB', 'Tinta', 'Carton', 'Plastik', 'Blanket'].forEach((h, i) => {
        doc.setFont('helvetica', 'bold');
        if (i === 1) {
          // Item column - left aligned
          doc.text(h, cX + 1, y + 1.7);
        } else {
          // Other columns - center aligned
          doc.text(h, cX + fwL[i]/2, y + 1.7, { align: 'center' });
        }
        cX += fwL[i]; if (i < 7) doc.line(cX, y, cX, y + fH * 13);
      });
    };
    drawH(margin, yQC); drawH(margin + 100, yQC);
    const fL = [
      ['1','Berat','30','30','30','25','25',''],
      ['2','Joint','','','','12.5','25',''],
      ['3','Creasing','','','','12.5','','20'],
      ['4','Panjang','','','','2','5','15'],
      ['5','Lebar','','','','2','5','15'],
      ['6','Tinggi','','','','2','',''],
      ['7','Tebal','','','','2','5','15'],
      ['8','BCT','','','','5','',''],
      ['9','Cobb','','','','5','',''],
      ['10','Bursting','','','','5','',''],
      ['11','Sobek','15','15','10','5','10','15'],
      ['12','Batch','40','20','40','2','10','']
    ];
    const fR = [
      ['13','Cetakan','','','','','','5'],
      ['14','Flutting','','','','','','5'],
      ['15','Packaging','15','15','10','5','10','20'],
      ['16','Warna','','','10','','5',''],
      ['17','Clarity','','','','','','5'],
      ['18','Chip','','','20','','',''],
      ['19','Bersih M','25','25','25','25','25','25'],
      ['20','Bau M','25','25','25','25','25','25'],
      ['21','Bersih K','20','20','20','20','20','20'],
      ['22','Bau K','10','10','10','10','10','10'],
      ['23','Bak','10','10','10','10','10','10'],
      ['24','Segel','10','10','10','10','10','10']
    ];
    fL.forEach((r, i) => {
      const cY = yQC + fH * (i + 1); doc.rect(margin, cY, 90, fH); let cX = margin;
      doc.setFont('helvetica', 'normal');
      r.forEach((v, j) => {
        if (j === 1) {
          // Item column - left aligned
          doc.text(v, cX + 1, cY + 1.7);
        } else {
          // Other columns - center aligned
          doc.text(v, cX + fwL[j]/2, cY + 1.7, { align: 'center' });
        }
        cX += fwL[j];
      });
    });
    fR.forEach((r, i) => {
      const cY = yQC + fH * (i + 1); doc.rect(margin + 100, cY, 90, fH); let cX = margin + 100;
      doc.setFont('helvetica', 'normal');
      r.forEach((v, j) => {
        if (j === 1) {
          // Item column - left aligned
          doc.text(v, cX + 1, cY + 1.7);
        } else {
          // Other columns - center aligned
          doc.text(v, cX + fwL[j]/2, cY + 1.7, { align: 'center' });
        }
        cX += fwL[j];
      });
    });


    // =========================================================================
    // PAGE 4+: PHOTO LOG (Dynamic Pagination)
    // =========================================================================
    if (inspection.weights && inspection.weights.length > 0) {
      const photosPerPage = 6; // 2 cols x 3 rows
      const totalPhotos = inspection.weights.length;
      const totalPhotoPages = Math.ceil(totalPhotos / photosPerPage);

      for (let p = 0; p < totalPhotoPages; p++) {
        doc.addPage(); doc.setLineWidth(0.5); doc.rect(margin, margin, contentWidth, pageHeight - (margin * 2));

        // Header tanpa Logo
        const h4H = 22;
        doc.setLineWidth(0.2);
        doc.rect(margin, margin, contentWidth, h4H);
        doc.line(pageWidth - margin - 30, margin, pageWidth - margin - 30, margin + h4H);

        doc.setFont('helvetica', 'bold'); doc.setFontSize(11);
        doc.text('LAMPIRAN DATA BERAT TIMBANGAN', margin + (contentWidth - 30)/2, margin + 12, { align: 'center' });

        doc.setFontSize(6.5);
        doc.text('Halaman', pageWidth - margin - 29, margin + 12);
        doc.setFont('helvetica', 'normal');
        doc.text(`: ${p + 1} dari ${totalPhotoPages}`, pageWidth - margin - 18, margin + 12);

        doc.setLineWidth(0.2);
        // Start of content area below header
        const gX = 10; const gY = 22; const pW = (contentWidth - 20) / 2; const pH = pW * 0.75;
        const startY4 = margin + h4H + 8;

        const startIdx = p * photosPerPage;
        const endIdx = Math.min(startIdx + photosPerPage, totalPhotos);

        for (let i = startIdx; i < endIdx; i++) {
          const w = inspection.weights[i];
          const localIdx = i - startIdx;
          const r = Math.floor(localIdx / 2);
          const c = localIdx % 2;
          const px = margin + 5 + (c * (pW + gX));
          const py = startY4 + (r * (pH + gY));

          doc.rect(px, py, pW, pH);
          if (weightPhotos[i]) {
            addImageSafe(weightPhotos[i], px + 0.5, py + 0.5, pW - 1, pH - 1);
          }
          doc.setFontSize(6.5); doc.text(`NO BATCH: ${safeText(w.batch_no)}`, px, py + pH + 4);
          const wLot = (inspection.items || []).find(it => it.batch_no === w.batch_no) as any;
          if (wLot?.lot_code) {
            doc.text(`LOT: ${safeText(wLot.lot_code)}`, px + 60, py + pH + 4);
          }
          doc.text(`NO BATCH VENDOR: ${safeText((w as any).batch_vendor || '')}`, px, py + pH + 7);
          doc.text(`BERAT: ${safeText(w.weight)} kg`, px, py + pH + 10);
        }
      }
    }

    // =========================================================================
    // PAGE 5: ATTACHMENTS (SURAT JALAN & TTB)
    // =========================================================================
    if (sjPhoto || ttbPhoto) {
      doc.addPage();
      doc.setLineWidth(0.5);
      doc.rect(margin, margin, contentWidth, pageHeight - (margin * 2));

      const h5H = 22;
      doc.setLineWidth(0.2);
      doc.rect(margin, margin, contentWidth, h5H);
      doc.line(pageWidth - margin - 30, margin, pageWidth - margin - 30, margin + h5H);
      doc.setFont('helvetica', 'bold'); doc.setFontSize(11);
      doc.text('LAMPIRAN SURAT JALAN & TTB', margin + (contentWidth - 30)/2, margin + 12, { align: 'center' });
      doc.setFontSize(6.5); doc.text('Halaman', pageWidth - margin - 29, margin + 12);
      doc.setFont('helvetica', 'normal'); doc.text(': 1 dari 1', pageWidth - margin - 18, margin + 12);

      const availableHeight = pageHeight - (margin * 2) - h5H - 10;
      const slotHeight = availableHeight / 2;
      const startY5 = margin + h5H + 5;

      // Slot 1: Surat Jalan
      doc.setFont('helvetica', 'bold'); doc.setFontSize(8);
      doc.text('1. SURAT JALAN', margin + 5, startY5 + 4);
      doc.setLineWidth(0.1);
      doc.rect(margin + 5, startY5 + 6, contentWidth - 10, slotHeight - 10);
      if (sjPhoto) {
        addImageSafe(sjPhoto, margin + 6, startY5 + 7, contentWidth - 12, slotHeight - 12);
      } else {
        doc.setFontSize(7); doc.text('[Tidak ada lampiran Surat Jalan]', margin + contentWidth/2, startY5 + slotHeight/2, { align: 'center' });
      }

      // Slot 2: TTB
      const startYTTB = startY5 + slotHeight;
      doc.setFont('helvetica', 'bold'); doc.setFontSize(8);
      doc.text('2. TTB (TANDA TERIMA BARANG)', margin + 5, startYTTB + 4);
      doc.rect(margin + 5, startYTTB + 6, contentWidth - 10, slotHeight - 10);
      if (ttbPhoto) {
        addImageSafe(ttbPhoto, margin + 6, startYTTB + 7, contentWidth - 12, slotHeight - 12);
      } else {
        doc.setFontSize(7); doc.text('[Tidak ada lampiran TTB]', margin + contentWidth/2, startYTTB + slotHeight/2, { align: 'center' });
      }
    }

    // =========================================================================
    // PAGE 6: COA ATTACHMENT
    // =========================================================================
    if (coaPhoto) {
      doc.addPage();
      doc.setLineWidth(0.5);
      doc.rect(margin, margin, contentWidth, pageHeight - (margin * 2));

      const h6H = 22;
      doc.setLineWidth(0.2);
      doc.rect(margin, margin, contentWidth, h6H);
      doc.line(pageWidth - margin - 30, margin, pageWidth - margin - 30, margin + h6H);
      doc.setFont('helvetica', 'bold'); doc.setFontSize(11);
      doc.text('LAMPIRAN COA (CERTIFICATE OF ANALYSIS)', margin + (contentWidth - 30)/2, margin + 12, { align: 'center' });
      doc.setFontSize(6.5); doc.text('Halaman', pageWidth - margin - 29, margin + 12);
      doc.setFont('helvetica', 'normal'); doc.text(': 1 dari 1', pageWidth - margin - 18, margin + 12);

      const startY6 = margin + h6H + 5;
      const imgH = pageHeight - (margin * 2) - h6H - 15;
      doc.rect(margin + 5, startY6, contentWidth - 10, imgH);
      addImageSafe(coaPhoto, margin + 6, startY6 + 1, contentWidth - 12, imgH - 2);
    }

    // =========================================================================
    // PAGE 7+: OTHER ATTACHMENTS (Dynamic Pagination)
    // =========================================================================
    if (inspection.attachments && inspection.attachments.length > 0) {
      const attPhotos = await Promise.all(
        inspection.attachments.map(async (att) => {
          if (att.photo_url) return await urlToDataUrl(att.photo_url);
          return null;
        })
      );
      toast.success('Lampiran tambahan diproses', { id: 'pdf-process' });

      const photosPerPage = 6; // 2 cols x 3 rows
      const totalPhotos = inspection.attachments.length;
      const totalPhotoPages = Math.ceil(totalPhotos / photosPerPage);

      for (let p = 0; p < totalPhotoPages; p++) {
        doc.addPage(); doc.setLineWidth(0.5); doc.rect(margin, margin, contentWidth, pageHeight - (margin * 2));

        // Header
        const h7H = 22;
        doc.setLineWidth(0.2);
        doc.rect(margin, margin, contentWidth, h7H);
        doc.line(pageWidth - margin - 30, margin, pageWidth - margin - 30, margin + h7H);

        doc.setFont('helvetica', 'bold'); doc.setFontSize(11);
        doc.text('LAMPIRAN FOTO LAINNYA', margin + (contentWidth - 30)/2, margin + 12, { align: 'center' });

        doc.setFontSize(6.5);
        doc.text('Halaman', pageWidth - margin - 29, margin + 12);
        doc.setFont('helvetica', 'normal');
        doc.text(`: ${p + 1} dari ${totalPhotoPages}`, pageWidth - margin - 18, margin + 12);

        doc.setLineWidth(0.2);
        // Start of content area below header
        const gX = 10; const gY = 22; const pW = (contentWidth - 20) / 2; const pH = pW * 0.75;
        const startY7 = margin + h7H + 8;

        const startIdx = p * photosPerPage;
        const endIdx = Math.min(startIdx + photosPerPage, totalPhotos);

        for (let i = startIdx; i < endIdx; i++) {
          const att = inspection.attachments![i];
          const localIdx = i - startIdx;
          const r = Math.floor(localIdx / 2);
          const c = localIdx % 2;
          const px = margin + 5 + (c * (pW + gX));
          const py = startY7 + (r * (pH + gY));

          doc.rect(px, py, pW, pH);
          if (attPhotos[i]) {
            addImageSafe(attPhotos[i], px + 0.5, py + 0.5, pW - 1, pH - 1);
          }
          if (att.description) {
            doc.setFontSize(6.5);
            doc.text(`Ket: ${safeText(att.description)}`, px, py + pH + 4);
          }
        }
      }
    }

    doc.save(`Inspeksi_${safeText(inspection.inspection_no).replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
    toast.success('Laporan PDF berhasil diunduh');
  } catch (e: any) {
    console.error('PDF Error:', e);
    toast.error('Gagal membuat PDF: ' + e.message);
  }
};
