// stores/dashboard.ts
import { defineStore } from 'pinia';
import { ref } from 'vue';

export interface RecentMutation {
  id: number;
  customerId: number;
  referenceNumber: string;
  sourceType: string;
  mutationType: string;
  amount: number;
  balanceAfter: number;
  notes?: string;
  createdAt: string;
}

export interface DashboardSummary {
  totalActiveDebt: number;
  totalIndebtedCustomers: number;
  activeInstallmentContracts: number;
  thisMonthInstallmentTarget: number;
  recentMutations: RecentMutation[];
  monthlyStatistics: MonthlyDebtStatistic[];
}

export interface MonthlyDebtStatistic {
  month: number;
  year: number;
  monthLabel: string;
  totalDebtAdded: number;
  totalDebtPaid: number;
  isCurrentMonth: boolean;
}



export const useDashboardStore = defineStore('dashboard', () => {
  // State
  const summary = ref<DashboardSummary | null>(null);
  const isLoading = ref<boolean>(false);
  const errorMessage = ref<string | null>(null);

  async function fetchSummaryWithYear(year: number) {
    isLoading.value = true;
    try {
      const api = useDebtApi();
      const res = await api.get(`/dashboard/summary?year=${year}`);
      summary.value = res.data;
    } finally {
      isLoading.value = false;
    }
  }

  // Actions
  async function fetchSummary(year?: number) {
    const api = useDebtApi();
    isLoading.value = true;
    errorMessage.value = null;

    try {
      // Jika ada tahun yang dikirim, tambahkan query parameter ?year=...
      const url = year ? `/dashboard/summary?year=${year}` : '/dashboard/summary';
      const res = await api.get<DashboardSummary>(url);
      summary.value = res.data;
    } catch (err: any) {
      console.error('Error fetching dashboard summary:', err);
      errorMessage.value = err.response?.data?.message || 'Gagal memuat data dashboard.';
    } finally {
      isLoading.value = false;
    }
  }

  return {
    summary,
    isLoading,
    errorMessage,
    fetchSummary,
    fetchSummaryWithYear
  };
});