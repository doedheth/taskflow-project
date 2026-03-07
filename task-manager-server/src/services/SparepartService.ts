import axios from 'axios';

export interface BCSparepart {
  No: string;
  Description: string;
  InventoryCtrl: number;
}

export interface CMMSSparepart {
  id_sp: string;
  kode_sp: string;
  nama_sp: string;
  qty_sp: string;
  nama_kategori?: string;
  nama_asset?: string;
  nama_lokasi?: string;
}

export interface SparepartComparison extends BCSparepart {
  cmms_qty: number;
  cmms_name?: string;
  cmms_asset?: string;
  cmms_location?: string;
  diff: number;
  is_match: boolean;
  exists_in_bc: boolean;
  exists_in_cmms: boolean;
}

export class SparepartService {
  private static getBCConfig() {
    return {
      baseUrl: (process.env.BC_BASE_URL || '').replace(/\/$/, ''),
      company: process.env.BC_COMPANY || '',
      username: process.env.BC_USERNAME || '',
      password: process.env.BC_PASSWORD || '',
    };
  }

  private static getCMMSUrl() {
    return process.env.CMMS_API_URL;
  }

  /**
   * Fetch all spareparts from Business Central with pagination
   */
  private static async fetchBCSpareparts(): Promise<BCSparepart[]> {
    const config = this.getBCConfig();
    const auth = Buffer.from(`${config.username}:${config.password}`).toString('base64');

    // Using standard 'items' endpoint (lowercase) which has full fields
    const baseUrl = `${config.baseUrl}/${config.company}/items`;

    let allItems: BCSparepart[] = [];
    let nextUrl: string | null = baseUrl + "?$select=No,Description,InventoryCtrl&$filter=startswith(No,'FA') or startswith(No,'SP')";

    while (nextUrl) {
      const response = await axios.get(nextUrl, {
        headers: { 'Authorization': `Basic ${auth}` }
      });
      allItems = [...allItems, ...(response.data.value || [])];

      // OData pagination: nextLink is usually an absolute URL
      nextUrl = response.data['@odata.nextLink'] || null;
    }

    return allItems;
  }

  /**
   * Fetch all spareparts from CMMS API
   */
  private static async fetchCMMSSpareparts(): Promise<CMMSSparepart[]> {
    const cmmsUrl = this.getCMMSUrl();
    if (!cmmsUrl) throw new Error('CMMS URL not configured');

    const rowsPerPage = 500;
    const firstResponse = await axios.get(cmmsUrl, {
      params: { page: 1, rows: rowsPerPage }
    });

    const total = firstResponse.data.total;
    let allRows = [...(firstResponse.data.rows || [])];
    const totalPages = Math.ceil(total / rowsPerPage);

    if (totalPages > 1) {
      const promises = [];
      for (let i = 2; i <= totalPages; i++) {
        promises.push(axios.get(cmmsUrl, { params: { page: i, rows: rowsPerPage } }));
      }

      const responses = await Promise.all(promises);
      responses.forEach(res => {
        allRows = [...allRows, ...(res.data.rows || [])];
      });
    }

    return allRows;
  }

  /**
   * Get merged comparison data
   */
  public static async getComparisonData(): Promise<SparepartComparison[]> {
    try {
      const [bcItems, cmmsItems] = await Promise.all([
        this.fetchBCSpareparts(),
        this.fetchCMMSSpareparts()
      ]);

      const bcMap = new Map<string, BCSparepart>();
      bcItems.forEach(item => {
        if (item.No) bcMap.set(item.No.trim().toUpperCase(), item);
      });

      const cmmsMap = new Map<string, CMMSSparepart>();
      cmmsItems.forEach(item => {
        if (item.kode_sp) {
          cmmsMap.set(item.kode_sp.trim().toUpperCase(), item);
        }
      });

      const allKeys = new Set([...bcMap.keys(), ...cmmsMap.keys()]);

      const comparison: SparepartComparison[] = Array.from(allKeys).map(key => {
        const bc = bcMap.get(key);
        const cmms = cmmsMap.get(key);

        const bcQty = bc?.InventoryCtrl || 0;
        const cmmsQty = cmms ? parseFloat(cmms.qty_sp || '0') : 0;
        const diff = bcQty - cmmsQty;

        return {
          No: key,
          Description: bc?.Description || cmms?.nama_sp || 'Unknown',
          InventoryCtrl: bcQty,
          cmms_qty: cmmsQty,
          cmms_name: cmms?.nama_sp,
          cmms_asset: cmms?.nama_asset,
          cmms_location: cmms?.nama_lokasi,
          diff: diff,
          is_match: Math.abs(diff) < 0.001,
          exists_in_bc: !!bc,
          exists_in_cmms: !!cmms
        };
      });

      return comparison.sort((a, b) => {
        // Mismatch items first
        if (a.is_match !== b.is_match) return a.is_match ? 1 : -1;
        return a.No.localeCompare(b.No);
      });
    } catch (error: any) {
      console.error('Error in SparepartService.getComparisonData:', error.message);
      throw error;
    }
  }
}
