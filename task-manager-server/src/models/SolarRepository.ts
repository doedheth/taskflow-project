/**
 * Solar Repository
 * 
 * Data access layer for Solar monitoring data (Huawei vs Manual)
 */

import { BaseRepository } from './BaseRepository';
import {
    SolarConfig,
    SolarEnergyData,
    CreateSolarEnergyDataDTO,
    UpdateSolarEnergyDataDTO
} from '../types/solar';

export class SolarRepository extends BaseRepository<SolarEnergyData, CreateSolarEnergyDataDTO, UpdateSolarEnergyDataDTO> {
    constructor() {
        super('solar_energy_data');
    }

    /**
     * Create or update daily energy data
     */
    create(data: CreateSolarEnergyDataDTO): SolarEnergyData {
        // Log the incoming data for debugging
        console.log(`[SolarRepository] Syncing data for ${data.date}: Huawei=${data.product_power} kWh, Manual=${data.manual_kwh} kWh`);

        // Using INSERT OR REPLACE or ON CONFLICT for UPSERT logic
        // CRITICAL: We update product_power if the new value is > 0
        this.execute(
            `INSERT INTO solar_energy_data (date, product_power, manual_kwh)
       VALUES (?, ?, ?)
       ON CONFLICT(date) DO UPDATE SET
       product_power = CASE
            WHEN excluded.product_power > 0 THEN excluded.product_power
            ELSE solar_energy_data.product_power
       END,
       manual_kwh = CASE
            WHEN excluded.manual_kwh > 0 THEN excluded.manual_kwh
            ELSE solar_energy_data.manual_kwh
       END,
       updated_at = datetime('now')`,
            [
                data.date,
                data.product_power ?? 0,
                data.manual_kwh ?? 0
            ]
        );

        const result = this.findByDate(data.date)!;
        console.log(`[SolarRepository] Stored ${data.date}: Current Huawei Total = ${result.product_power} kWh`);
        return result;
    }

    /**
     * Update daily energy data by ID
     */
    update(id: number, data: UpdateSolarEnergyDataDTO): SolarEnergyData | null {
        const updates: string[] = ['updated_at = datetime("now")'];
        const params: any[] = [];

        if (data.product_power !== undefined) {
            updates.push(`product_power = ?`);
            params.push(data.product_power);
        }

        if (data.manual_kwh !== undefined) {
            updates.push(`manual_kwh = ?`);
            params.push(data.manual_kwh);
        }

        if (params.length === 0) return this.findById(id) || null;

        params.push(id);
        this.execute(
            `UPDATE solar_energy_data SET ${updates.join(', ')} WHERE id = ?`,
            params
        );

        return this.findById(id) || null;
    }

    /**
     * Find data by date
     */
    findByDate(date: string): SolarEnergyData | undefined {
        return this.queryOne<SolarEnergyData>(
            `SELECT * FROM solar_energy_data WHERE date = ?`,
            [date]
        );
    }

    /**
     * Get comparison data for a date range
     */
    getComparison(startDate?: string, endDate?: string): SolarEnergyData[] {
        let sql = `SELECT * FROM solar_energy_data WHERE 1=1`;
        const params: any[] = [];

        if (startDate) {
            sql += ` AND date >= ?`;
            params.push(startDate);
        }

        if (endDate) {
            sql += ` AND date <= ?`;
            params.push(endDate);
        }

        sql += ` ORDER BY date ASC`;

        return this.query<SolarEnergyData>(sql, params);
    }

    /**
     * Get Solar configuration
     */
    getConfig(): SolarConfig | undefined {
        return this.queryOne<SolarConfig>(`SELECT * FROM solar_config ORDER BY id DESC LIMIT 1`);
    }

    /**
     * Save or update Solar configuration
     */
    saveConfig(data: Partial<SolarConfig>): SolarConfig {
        const existing = this.getConfig();

        if (existing) {
            const updates: string[] = ['updated_at = datetime("now")'];
            const params: any[] = [];
            const fields: (keyof SolarConfig)[] = ['username', 'password', 'station_dn', 'session_cookies', 'price_per_kwh', 'last_login'];

            fields.forEach(field => {
                if (data[field] !== undefined) {
                    updates.push(`${field} = ?`);
                    params.push(data[field]);
                }
            });

            params.push(existing.id);
            this.execute(`UPDATE solar_config SET ${updates.join(', ')} WHERE id = ?`, params);
            return this.getConfig()!;
        } else {
            const result = this.execute(
                `INSERT INTO solar_config (username, password, station_dn, session_cookies, price_per_kwh, last_login)
         VALUES (?, ?, ?, ?, ?, ?)`,
                [
                    data.username || '',
                    data.password || '',
                    data.station_dn || '',
                    data.session_cookies || '',
                    data.price_per_kwh ?? 1500,
                    data.last_login || null
                ]
            );
            return this.queryOne<SolarConfig>(`SELECT * FROM solar_config WHERE id = ?`, [result.lastInsertRowid])!;
        }
    }
}

export const solarRepository = new SolarRepository();
export default solarRepository;
