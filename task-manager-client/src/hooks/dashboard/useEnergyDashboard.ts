import { useQuery } from '@tanstack/react-query';
import { energyAPI } from '../../services/api';

export const useLatestEnergy = () => {
    return useQuery({
        queryKey: ['dashboard', 'energy', 'latest'],
        queryFn: () => energyAPI.getLatest().then(res => res.data),
        refetchInterval: 30000, // Poll every 30 seconds per Story 9.5 AC4
    });
};

export const useEnergyRevenue = (startDate: string, endDate: string) => {
    return useQuery({
        queryKey: ['dashboard', 'energy', 'revenue', startDate, endDate],
        queryFn: () => energyAPI.getRevenue(startDate, endDate).then(res => res.data),
    });
};

export const useEnergyHistory = (startDate: string, endDate: string) => {
    return useQuery({
        queryKey: ['dashboard', 'energy', 'history', startDate, endDate],
        queryFn: () => energyAPI.getHistory(startDate, endDate).then(res => res.data),
    });
};
