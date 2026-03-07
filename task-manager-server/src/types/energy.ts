export interface PLNMetric {
    id: number;
    bp: number;
    lbp: number;
    total: number;
    varh: number;
    power_factor: number;
    recorded_at: string;
    created_at: string;
}

export interface CreatePLNMetricDTO {
    bp: number;
    lbp: number;
    total: number;
    varh: number;
    power_factor: number;
    recorded_at?: string;
}

export interface EnergyRevenue {
    savings_today: number;
    savings_month: number;
    solar_contribution_percent: number;
    pln_cost_mtd: number;
}

export interface EnergyLoadHistory {
    timestamp: string;
    pln_kw: number;
    solar_kw: number;
    total_kw: number;
}
