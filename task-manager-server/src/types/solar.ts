/**
 * Solar Monitoring Types
 */

export interface SolarConfig {
    id: number;
    username: string;
    password?: string;
    station_dn: string;
    session_cookies: string;
    price_per_kwh: number;
    last_login: string;
    created_at: string;
    updated_at: string;
}

export interface SolarEnergyData {
    id: number;
    date: string; // YYYY-MM-DD
    product_power: number;
    manual_kwh: number;
    created_at: string;
    updated_at: string;
}

export interface CreateSolarEnergyDataDTO {
    date: string;
    product_power?: number;
    manual_kwh?: number;
}

export interface UpdateSolarEnergyDataDTO {
    product_power?: number;
    manual_kwh?: number;
}

export interface SolarComparisonFilters {
    startDate?: string;
    endDate?: string;
}
