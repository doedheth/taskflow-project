import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { MachineParameterSet, MachineParameterValue } from '../../types';
import logoHeader from '../../images/lgo-header.png';

export const generateMachineParameterPDF = (logs: MachineParameterSet[]) => {
  const getShiftNum = (s: string) => {
    const match = s.match(/\d+/);
    return match ? parseInt(match[0]) : 99;
  };
  const sortedLogs = [...logs].sort((a, b) => getShiftNum(a.shift || '') - getShiftNum(b.shift || ''));
  
  const firstLog = sortedLogs[0];
  if (!firstLog) return;

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 7;
  const contentWidth = pageWidth - (margin * 2);

  const drawOfficialHeader = () => {
    const headerH = 18;
    doc.setLineWidth(0.5);
    doc.rect(margin, margin, contentWidth, headerH);

    const col1W = 55;
    doc.line(margin + col1W, margin, margin + col1W, margin + headerH);
    try {
      doc.addImage(logoHeader, 'PNG', margin + 18, margin + 1.5, 18, 7);
    } catch (e) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('SQP', margin + (col1W / 2), margin + 8, { align: 'center' });
    }
    doc.setFontSize(5.5);
    doc.setFont('helvetica', 'bold');
    doc.text('PT. SURYASUKSES ABADI PRIMA', margin + (col1W / 2), margin + 15, { align: 'center' });

    const col2W = contentWidth - col1W - 70;
    doc.line(margin + col1W + col2W, margin, margin + col1W + col2W, margin + headerH);
    doc.setFontSize(10);
    doc.text('SETTING PARAMETER & LAPORAN PRODUKSI (SACMI)', margin + col1W + (col2W / 2), margin + 10, { align: 'center' });

    const col3X = margin + col1W + col2W;
    const rowH = headerH / 4;
    doc.setFontSize(6.5);
    for (let i = 1; i < 4; i++) {
      doc.line(col3X, margin + (i * rowH), margin + contentWidth, margin + (i * rowH));
    }
    doc.line(col3X + 22, margin, col3X + 22, margin + headerH);

    const drawInfoRow = (label: string, value: string, rowIdx: number) => {
      const y = margin + (rowIdx * rowH) + (rowH / 2) + 0.8;
      doc.setFont('helvetica', 'bold');
      doc.text(label, col3X + 1.5, y);
      doc.setFont('helvetica', 'normal');
      doc.text(': ' + value, col3X + 23, y);
    };

    drawInfoRow('No. Dokumen', 'FRM.PRO.01.03.04', 0);
    drawInfoRow('No. Revisi', '05', 1);
    drawInfoRow('Tanggal', '02 Juli 2019', 2);
    drawInfoRow('Halaman', '1 dari 1', 3);
  };

  const columnGap = 1.5;
  const tableWidth = (contentWidth - (columnGap * 2)) / 3;
  const shiftNames = ['Shift 1', 'Shift 2', 'Shift 3'];
  const shiftsToRender = shiftNames.map(name => sortedLogs.find(l => l.shift === name) || null);
  
  const allValues = logs.flatMap(l => l.values || []);
  const sections: Record<string, MachineParameterValue[]> = {};
  const sectionOrder: string[] = [];
  const seenParams = new Set<string>();
  
  allValues.forEach(v => {
    const s = v.section || 'General';
    const pKey = v.parameter_id ? `ID_${v.parameter_id}` : `NAME_${v.parameter_name}`;
    if (!sections[s]) {
      sections[s] = [];
      sectionOrder.push(s);
    }
    if (!seenParams.has(pKey)) {
      sections[s].push(v);
      seenParams.add(pKey);
    }
  });

  const getRangeText = (val: MachineParameterValue) => {
    const min = val.setting_a_min;
    const max = val.setting_a_max;
    if (min !== null && min !== undefined && max !== null && max !== undefined) return `${min}-${max}`;
    if (min !== null && min !== undefined) return `> ${min}`;
    if (max !== null && max !== undefined) return `< ${max}`;
    return '-';
  };

  const getRangeBText = (val: MachineParameterValue) => {
    const min = val.setting_b_min;
    const max = val.setting_b_max;
    if (min !== null && min !== undefined && max !== null && max !== undefined) return `${min}-${max}`;
    return '-';
  };

  const getRangeCText = (val: MachineParameterValue) => {
    const values = [val.setting_a_min, val.setting_a_max, val.setting_b_min, val.setting_b_max].filter((v): v is number => v !== null && v !== undefined);
    if (values.length > 0) {
      const min = Math.min(...values);
      const max = Math.max(...values);
      return `< ${min} / > ${max}`;
    }
    const cMin = val.setting_c_min;
    const cMax = val.setting_c_max;
    if (cMin !== null && cMin !== undefined && cMax !== null && cMax !== undefined) return `${cMin}-${cMax}`;
    return '-';
  };

  drawOfficialHeader();
  
  const startYMeta = margin + 20;
  const startYParams = startYMeta + 13;
  
  // 1. Draw Metadata
  shiftsToRender.forEach((log, shiftIdx) => {
    const startX = margin + (shiftIdx * (tableWidth + columnGap));
    doc.setLineWidth(0.2);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.rect(startX, startYMeta, tableWidth, 12);
    doc.line(startX, startYMeta + 4, startX + tableWidth, startYMeta + 4);
    doc.line(startX, startYMeta + 8, startX + tableWidth, startYMeta + 8);
    doc.line(startX + 22, startYMeta, startX + 22, startYMeta + 12);
    doc.text('Tanggal', startX + 1.5, startYMeta + 3);
    doc.text('Produk / Berat', startX + 1.5, startYMeta + 7);
    doc.text('Shift', startX + 1.5, startYMeta + 11);
    doc.setFont('helvetica', 'normal');
    if (log) {
      doc.text(': ' + (log.production_date || '-'), startX + 23, startYMeta + 3);
      doc.text(': ' + (log.product_name || '-') + ' / gr', startX + 23, startYMeta + 7);
      doc.text(': ' + (log.shift || '-'), startX + 23, startYMeta + 11);
    } else {
      doc.text(': -', startX + 23, startYMeta + 3);
      doc.text(': - / gr', startX + 23, startYMeta + 7);
      doc.text(': ' + shiftNames[shiftIdx], startX + 23, startYMeta + 11);
    }
  });

  // 2. Draw Parameter Tables
  let currentMaxY = 0;
  shiftsToRender.forEach((log, shiftIdx) => {
    const startX = margin + (shiftIdx * (tableWidth + columnGap));
    const paramTableBody: any[] = [];
    let sectionIdx = 0;
    sectionOrder.forEach(sectionName => {
      sectionIdx++;
      const params = sections[sectionName];
      const firstParam = params[0];
      const isMergedHeader = firstParam && !firstParam.parameter_name;
      if (isMergedHeader) {
        const valInShift = log?.values?.find(v => v.section === sectionName);
        paramTableBody.push([
          { content: sectionIdx, styles: { fontStyle: 'bold' } },
          { content: sectionName, styles: { fontStyle: 'bold' } },
          valInShift?.unit || firstParam.unit || '',
          'A\n' + getRangeText(firstParam), 'B\n' + getRangeBText(firstParam), 'C\n' + getRangeCText(firstParam),
          { content: valInShift?.value ?? '', styles: { fontStyle: 'bold' } }
        ]);
      } else {
        paramTableBody.push([{ content: sectionIdx, styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } }, { content: sectionName, colSpan: 6, styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } }]);
        params.forEach(p => {
          const valInShift = log?.values?.find(v => (v.parameter_id && v.parameter_id === p.parameter_id) || (v.parameter_name === p.parameter_name));
          paramTableBody.push(['', p.parameter_name, p.unit || '', getRangeText(p), getRangeBText(p), getRangeCText(p), valInShift?.value ?? '']);
        });
      }
    });

    autoTable(doc, {
      head: [['No', 'Parameter Check', 'Satuan', 'A', 'B', 'C', 'ACTUAL']],
      body: paramTableBody,
      startY: startYParams,
      margin: { left: startX },
      tableWidth: tableWidth,
      theme: 'grid',
      styles: { fontSize: 4.8, cellPadding: 0.4, overflow: 'linebreak', textColor: [0, 0, 0] },
      headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], lineWidth: 0.1, fontStyle: 'bold', halign: 'center' },
      columnStyles: { 0: { cellWidth: 4 }, 2: { cellWidth: 7 }, 3: { cellWidth: 10, halign: 'center' }, 4: { cellWidth: 10, halign: 'center' }, 5: { cellWidth: 10, halign: 'center' }, 6: { cellWidth: 10, halign: 'center' } },
    });
    // @ts-ignore
    currentMaxY = Math.max(currentMaxY, doc.lastAutoTable.finalY);
  });

  // Helper to draw horizontal sections across all 3 shifts
  const drawShiftSection = (title: string, head: string[][], getRows: (log: any) => any[][], colStyles: any) => {
    const sectionStartY = currentMaxY + 4;
    let sectionMaxY = sectionStartY;

    shiftsToRender.forEach((log, shiftIdx) => {
      const startX = margin + (shiftIdx * (tableWidth + columnGap));
      autoTable(doc, {
        head: [[{ content: title, colSpan: head[0].length, styles: { halign: 'left', fillColor: [230, 230, 230] } }], head[0]],
        body: getRows(log),
        startY: sectionStartY,
        margin: { left: startX },
        tableWidth: tableWidth,
        theme: 'grid',
        styles: { fontSize: 4.8, cellPadding: 0.4 },
        headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], fontStyle: 'bold' },
        columnStyles: colStyles
      });
      // @ts-ignore
      sectionMaxY = Math.max(sectionMaxY, doc.lastAutoTable.finalY);
    });
    currentMaxY = sectionMaxY;
  };

  // 13. Material
  drawShiftSection(
    '13. Material',
    [['Item', 'Nama Material', '%', 'Qty (kg)']],
    (log) => {
      const report = log?.production_report || {};
      return [0, 1, 2].map(i => {
        const m = (report.material_usage || [])[i] || {};
        return [String.fromCharCode(65 + i), m.name || '-', m.percentage || '-', m.qty || '-'];
      });
    },
    { 0: { cellWidth: 4 }, 2: { cellWidth: 8, halign: 'center' }, 3: { cellWidth: 11, halign: 'center' } }
  );

  // 14. Bahan Pembantu
  drawShiftSection(
    '14. Bahan Pembantu',
    [['Item', 'Nama Item', 'Unit', 'Qty']],
    (log) => {
      const report = log?.production_report || {};
      const defaultUnits = ['kg', 'pcs', 'pcs', 'kg'];
      return [0, 1, 2, 3].map(i => {
        const m = (report.material_aux_usage || [])[i] || {};
        return [String.fromCharCode(65 + i), m.name || '-', m.unit || defaultUnits[i], m.qty || '-'];
      });
    },
    { 0: { cellWidth: 4 }, 2: { cellWidth: 8, halign: 'center' }, 3: { cellWidth: 11, halign: 'center' } }
  );

  // 15. Waste
  drawShiftSection(
    '15. Waste',
    [['Item', 'Nama Item', 'Unit', 'Qty']],
    (log) => {
      const report = log?.production_report || {};
      const wasteNames = ['Waste Produk', 'Gumpalan', 'Cap', 'Total'];
      return wasteNames.map((name, i) => {
        const m = (report.waste_data || []).find((w: any) => w.name === name) || {};
        return [name === 'Total' ? '' : String.fromCharCode(65 + i), name, 'kg', m.qty || '-'];
      });
    },
    { 0: { cellWidth: 4 }, 2: { cellWidth: 8, halign: 'center' }, 3: { cellWidth: 11, halign: 'center' } }
  );

  // 17. Hasil Produksi
  drawShiftSection(
    '17. Hasil Produksi',
    [['Item', 'Pcs', 'Kg']],
    (log) => {
      const report = log?.production_report || {};
      const prodNames = ['Inner 1', 'Inner 2'];
      return prodNames.map(name => {
        const m = (report.production_result || []).find((r: any) => r.name === name) || {};
        return [`Jumlah Cap per ${name}`, m.pcs || '-', m.kg || '-'];
      });
    },
    { 1: { cellWidth: 14, halign: 'center' }, 2: { cellWidth: 14, halign: 'center' } }
  );

  doc.save(`Riwayat-Lengkap-${firstLog.production_date}.pdf`);
};
