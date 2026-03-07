/**
 * Solar Service
 *
 * Business logic for Huawei FusionSolar integration and Solar data management
 */

import axios, { AxiosInstance } from 'axios';
import { BaseService } from './BaseService';
import { solarRepository } from '../models/SolarRepository';
import {
    SolarConfig,
    SolarEnergyData,
    CreateSolarEnergyDataDTO,
    UpdateSolarEnergyDataDTO
} from '../types/solar';

export class SolarService extends BaseService<SolarEnergyData, CreateSolarEnergyDataDTO, UpdateSolarEnergyDataDTO> {
    private apiClient: AxiosInstance;
    private baseUrl: string = 'https://intl.fusionsolar.huawei.com';
    private apiBaseUrl: string = 'https://intl.fusionsolar.huawei.com';

    private headers: any = {
        "accept": "application/json, text/javascript, */*; q=0.01",
        "accept-language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
        "app-id": "smartpvms",
        "cache-control": "no-cache",
        "content-type": "application/json",
        "pragma": "no-cache",
        "sec-ch-ua": "\"Not(A:Brand\";v=\"8\", \"Chromium\";v=\"144\", \"Google Chrome\";v=\"144\"",
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": "\"Windows\"",
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        "x-requested-with": "XMLHttpRequest",
        "referrer": "https://intl.fusionsolar.huawei.com/pvmswebsite/login/build/index.html"
    };

    constructor() {
        super(solarRepository);
        this.apiClient = axios.create({
            timeout: 30000,
            validateStatus: () => true, // Handle all statuses manually
        });
    }

    /**
     * Internal request wrapper for POST APIs
     */
    private async request<T>(url: string, data: any, retry: boolean = true): Promise<T> {
        const config = solarRepository.getConfig();
        if (!config) throw new Error('Solar configuration not found.');

        let cookies = config.session_cookies;

        // If no cookies, login first
        if (!cookies) {
            cookies = await this.login();
        }

        const requestHeaders = {
            ...this.headers,
            "Cookie": cookies
        };

        const response = await this.apiClient.post(`${this.apiBaseUrl}${url}`, data, {
            headers: requestHeaders,
        });

        // Handle session invalidation (302 redirect or HTML response)
        if (typeof response.data === 'string' && response.data.includes('<!doctype html>')) {
            if (retry) {
                console.log('Session expired (HTML detected), re-authenticating...');
                await this.login();
                return this.request(url, data, false);
            }
            throw new Error('Session invalid');
        }

        if ((response.status === 401 || response.status === 403) && retry) {
            console.log(`Session expired (${response.status}), re-authenticating...`);
            await this.login();
            return this.request(url, data, false);
        }

        return response.data;
    }

    /**
     * Login to Huawei FusionSolar Web Portal (SSO Flow)
     */
    async login(): Promise<string> {
        const config = solarRepository.getConfig();

        // Fallback to environment variables if DB is empty
        const username = config?.username || process.env.SOLAR_USERNAME;
        const password = config?.password || process.env.SOLAR_PASSWORD;

        if (!username || !password) {
            throw new Error('Solar credentials missing (both in DB and ENV).');
        }

        try {
            console.log('Authenticating with Huawei Web Portal...');

            // Step 0: Initial Portal Load
            const portalUrl = `${this.baseUrl}/pvmswebsite/login/build/index.html`;
            const portalResp = await this.apiClient.get(portalUrl, { headers: this.headers });
            const portalCookies = portalResp.headers['set-cookie'] || [];
            let currentCookies = portalCookies.map((c: string) => c.split(';')[0]).join('; ');

            // Step 1: Validate User
            const loginUrl = `${this.baseUrl}/rest/dp/uidm/unisso/v1/validate-user?service=%2Frest%2Fdp%2Fuidm%2Fauth%2Fv1%2Fon-sso-credential-ready`;
            const payload = {
                "username": username,
                "password": password,
                "verifycode": ""
            };

            const step1Resp = await this.apiClient.post(loginUrl, payload, {
                headers: { ...this.headers, "Cookie": currentCookies }
            });

            if (step1Resp.data && step1Resp.data.failCode > 0) {
                throw new Error(`Login failed: ${step1Resp.data.message}`);
            }

            const step1Cookies = step1Resp.headers['set-cookie'] || [];
            if (step1Cookies.length > 0) {
                currentCookies = `${currentCookies}; ${step1Cookies.map((c: string) => c.split(';')[0]).join('; ')}`;
            }

            const redirectPath = step1Resp.headers['redirect_url'];
            if (!redirectPath) throw new Error('No redirect URL found.');

            // Step 2: Establish SSO Session
            const redirectUrl = `${this.baseUrl}${redirectPath}`;
            const step2Resp = await this.apiClient.get(redirectUrl, {
                headers: { ...this.headers, "Cookie": currentCookies },
                maxRedirects: 0
            });

            const step2Cookies = step2Resp.headers['set-cookie'] || [];
            if (step2Cookies.length > 0) {
                currentCookies = `${currentCookies}; ${step2Cookies.map((c: string) => c.split(';')[0]).join('; ')}`;
            }

            // Defaults
            if (!currentCookies.includes('locale=')) currentCookies += '; locale=en-us';

            console.log('Login Successful.');

            solarRepository.saveConfig({
                session_cookies: currentCookies,
                last_login: new Date().toISOString(),
            });

            return currentCookies;
        } catch (error: any) {
            console.error('Login Error:', error.message);
            throw new Error(`Authentication failed: ${error.message}`);
        }
    }

    /**
     * Fetch real-time energy flow data
     */
    /**
     * Internal request wrapper for GET APIs
     */
    private async getRequest<T>(url: string, params: URLSearchParams, retry: boolean = true): Promise<T> {
        const config = solarRepository.getConfig();
        if (!config) throw new Error('Solar configuration not found.');

        let cookies = config.session_cookies;
        if (!cookies) cookies = await this.login();

        const requestHeaders = {
            ...this.headers,
            "Cookie": cookies,
            "x-non-renewal-session": "true",
            "x-timezone-offset": "420",
            "Referer": "https://intl.fusionsolar.huawei.com/uniportal/pvmswebsite/assets/build/cloud.html"
        };

        try {
            const response = await this.apiClient.get(`${this.apiBaseUrl}${url}?${params.toString()}`, {
                headers: requestHeaders,
            });

            // Handle session invalidation
            if (typeof response.data === 'string' && response.data.includes('<!doctype html>')) {
                if (retry) {
                    console.log(`GET Session expired for ${url}, re-authenticating...`);
                    const newCookies = await this.login();
                    return this.getRequest(url, params, false);
                }
                throw new Error('Session invalid');
            }

            return response.data;
        } catch (error: any) {
            if ((error.response?.status === 401 || error.response?.status === 403) && retry) {
                await this.login();
                return this.getRequest(url, params, false);
            }
            throw error;
        }
    }

    /**
     * Fetch real-time energy flow data
     */
    async fetchEnergyFlow(): Promise<any> {
        try {
            let stationDn = 'NE=63775176';
            try {
                const listData = await this.request<any>('/rest/pvms/web/station/v1/overview/station-list', {
                    curPage: 1, pageSize: 10, orderBy: "createTime", asc: false
                });
                if (listData?.data?.list?.[0]?.dn) {
                    stationDn = listData.data.list[0].dn;
                }
            } catch (err) {
                console.log('Using fallback station DN for flow.');
            }

            const params = new URLSearchParams({
                stationDn: stationDn,
                featureId: 'aifc',
                _: Date.now().toString()
            });

            const data = await this.getRequest<any>('/rest/pvms/web/station/v3/overview/energy-flow', params);
            return data?.data || {};
        } catch (error: any) {
            console.error(`Energy Flow Fetch Error:`, error.message);
            throw error;
        }
    }

    /**
     * Fetch energy trend data for charting
     * @param date - Target date (ISO string YYYY-MM-DD)
     * @param dimension - 2: Day, 4: Month, 5: Year (per Huawei V3 API)
     */
    async fetchEnergyTrend(date: string, dimension: number = 4): Promise<any> {
        try {
            let stationDn = 'NE=63775176';
            try {
                const listData = await this.request<any>('/rest/pvms/web/station/v1/overview/station-list', {
                    curPage: 1, pageSize: 10, orderBy: "createTime", asc: false
                });
                if (listData?.data?.list?.[0]?.dn) {
                    stationDn = listData.data.list[0].dn;
                    console.log(`[SolarService] Detected station: ${listData.data.list[0].stationName} (${stationDn})`);
                    // Auto-save station DN if not set
                    const currentConfig = solarRepository.getConfig();
                    if (!currentConfig?.station_dn) {
                        solarRepository.saveConfig({ station_dn: stationDn });
                    }
                }
            } catch (err) {
                console.log('[SolarService] Using fallback station DN.');
            }

            const queryTime = new Date(date).getTime();
            const params = new URLSearchParams({
                stationDn: stationDn,
                timeDim: dimension.toString(),
                timeZone: '7.0',
                timeZoneStr: 'Asia/Bangkok',
                queryTime: queryTime.toString(),
                dateStr: `${date} 00:00:00`,
                _: Date.now().toString()
            });

            const data = await this.getRequest<any>('/rest/pvms/web/station/v3/overview/energy-balance', params);

            // Auto-persist daily data if we're looking at a monthly dimension
            if (dimension === 4 && data?.data?.xAxis && data?.data?.productPower) {
                const labels = data.data.xAxis;
                const values = typeof data.data.productPower === 'string'
                    ? data.data.productPower.split(',')
                    : (Array.isArray(data.data.productPower) ? data.data.productPower : []);

                const [year, month] = date.split('-');

                labels.forEach((label: string, index: number) => {
                    const val = values[index];
                    if (val !== '--' && val !== undefined && val !== null) {
                        const dailyYield = parseFloat(val.toString());
                        // Only save if we have a valid value
                        if (!isNaN(dailyYield)) {
                            // Construct YYYY-MM-DD if label is just a day number
                            let formattedDate = label;
                            if (label.length <= 2) {
                                formattedDate = `${year}-${month}-${label.padStart(2, '0')}`;
                            }

                            solarRepository.create({
                                date: formattedDate,
                                product_power: dailyYield
                            });
                        }
                    }
                });
            }

            return data?.data || {};
        } catch (error: any) {
            console.error(`Trend Fetch Error (${date}):`, error.message);
            throw error;
        }
    }

    /**
     * Fetch Daily Energy yield
     */
    async fetchEnergyBalance(date: string): Promise<number> {
        try {
            // Default Station DN (SEDATI-1)
            let stationDn = 'NE=63775176';

            // Try to resolve dynamic DN from station list
            try {
                const listData = await this.request<any>('/rest/pvms/web/station/v1/overview/station-list', {
                    curPage: 1, pageSize: 10, orderBy: "createTime", asc: false
                });
                if (listData?.data?.list?.[0]?.dn) {
                    stationDn = listData.data.list[0].dn;
                    console.log(`Using Station: ${listData.data.list[0].stationName}`);
                }
            } catch (err) {
                console.log('Using fallback station DN.');
            }

            const queryTime = new Date(date).getTime();
            const params = new URLSearchParams({
                stationDn: stationDn,
                timeDim: '2', // Day (Corrected for V3 API)
                timeZone: '7.0',
                timeZoneStr: 'Asia/Bangkok',
                queryTime: queryTime.toString(),
                dateStr: `${date} 00:00:00`,
                _: Date.now().toString()
            });

            const data = await this.getRequest<any>('/rest/pvms/web/station/v3/overview/energy-balance', params);

            let dailyEnergy = 0;
            if (data?.data) {
                // totalProductPower is the summary for the requested period (day)
                const val = data.data.totalProductPower ?? data.data.productPower ?? data.data.yield;
                dailyEnergy = Number(val || 0);
            }

            console.log(`Fetched ${dailyEnergy} kWh for ${date}`);

            solarRepository.create({
                date,
                product_power: dailyEnergy,
            });

            return dailyEnergy;
        } catch (error: any) {
            console.error(`Fetch Error (${date}):`, error.message);
            throw error;
        }
    }

    async saveManualData(date: string, kwh: number) {
        return solarRepository.create({ date, manual_kwh: kwh });
    }

    async getComparisonData(startDate?: string, endDate?: string) {
        return solarRepository.getComparison(startDate, endDate);
    }

    async exportComparisonCsv(startDate?: string, endDate?: string): Promise<string> {
        const data = await this.getComparisonData(startDate, endDate);

        // CSV Header - Focused on PV History as requested
        let csv = 'Laporan Riwayat Produksi Energi PV\n';
        csv += `Periode: ${startDate || 'Awal'} s/d ${endDate || 'Sekarang'}\n\n`;
        csv += 'Tanggal,Produksi Huawei (kWh),Status\n';

        // CSV Rows
        data.forEach(row => {
            const huawei = row.product_power || 0;
            csv += `${row.date},${huawei.toFixed(2)},Synced\n`;
        });

        return csv;
    }

    async getConfig(): Promise<SolarConfig | undefined> {
        return solarRepository.getConfig();
    }

    async saveConfig(data: Partial<SolarConfig>): Promise<SolarConfig> {
        return solarRepository.saveConfig(data);
    }
}

export const solarService = new SolarService();
export default solarService;
