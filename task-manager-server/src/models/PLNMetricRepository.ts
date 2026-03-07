import { BaseRepository } from './BaseRepository';
import { PLNMetric, CreatePLNMetricDTO } from '../types/energy';

export class PLNMetricRepository extends BaseRepository<PLNMetric, CreatePLNMetricDTO> {
  constructor() {
    super('pln_metrics');
  }

  create(data: CreatePLNMetricDTO): PLNMetric {
    const recorded_at = data.recorded_at || new Date().toISOString();
    const result = this.execute(
      `INSERT INTO ${this.tableName} (bp, lbp, total, varh, power_factor, recorded_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [data.bp, data.lbp, data.total, data.varh, data.power_factor, recorded_at]
    );

    return this.findById(result.lastInsertRowid as number)!;
  }

  update(id: number, data: Partial<PLNMetric>): PLNMetric | null {
    const current = this.findById(id);
    if (!current) return null;

    const bp = data.bp ?? current.bp;
    const lbp = data.lbp ?? current.lbp;
    const total = data.total ?? current.total;
    const varh = data.varh ?? current.varh;
    const power_factor = data.power_factor ?? current.power_factor;
    const recorded_at = data.recorded_at ?? current.recorded_at;

    this.execute(
      `UPDATE ${this.tableName} SET
       bp = ?, lbp = ?, total = ?, varh = ?, power_factor = ?, recorded_at = ?, updated_at = datetime('now')
       WHERE id = ?`,
      [bp, lbp, total, varh, power_factor, recorded_at, id]
    );

    return this.findById(id)!;
  }

  findLatest(): PLNMetric | undefined {
    return this.queryOne(`SELECT * FROM ${this.tableName} ORDER BY recorded_at DESC LIMIT 1`);
  }

  findInPeriod(startDate: string, endDate: string): PLNMetric[] {
    return this.query(
      `SELECT * FROM ${this.tableName}
       WHERE recorded_at BETWEEN ? AND ?
       ORDER BY recorded_at ASC`,
      [startDate, endDate]
    );
  }

  /**
   * Get stats for a period (delta calculation)
   */
  getPeriodStats(startDate: string, endDate: string) {
    const metrics = this.findInPeriod(startDate, endDate);
    if (metrics.length < 2) return null;

    const first = metrics[0];
    const last = metrics[metrics.length - 1];

    return {
      bp_delta: last.bp - first.bp,
      lbp_delta: last.lbp - first.lbp,
      total_delta: last.total - first.total,
      avg_power_factor: metrics.reduce((acc, m) => acc + m.power_factor, 0) / metrics.length
    };
  }
}

export const plnMetricRepository = new PLNMetricRepository();
export default plnMetricRepository;
