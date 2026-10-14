// stores/finance.ts
import { defineStore } from 'pinia';
import { ref } from 'vue';
import { useDebtApi } from '~/composables/useDebtApi';

export interface MonthlyNetProfit {
  month: number;
  year: number;
  monthLabel: string;
  netProfit: number;
  capitalReturned: number;
  totalCashIn: number;
}

export interface FinanceSummary {
  totalDisbursedCapital: number;
  totalReturnedCapital: number;
  totalOutstandingCapital: number;
  totalExpectedProfit: number;
  totalRealizedProfit: number;
  averageProfitMarginPercent: number;
  cashInflowCash: number;
  cashInflowTransfer: number;
  monthlyNetProfits: MonthlyNetProfit[];
}

export interface DueInstallmentItem {
  scheduleId: number;
  contractId: number;
  contractNumber: string;
  customerId: number;
  customerName: string;
  itemName: string;
  installmentNumber: number;
  tenorMonths: number;
  amount: number;
  dueDate: string;
  isOverdue: boolean;
  daysOverdue: number;
}

export const useFinanceStore = defineStore('finance', () => {
  const summary = ref<FinanceSummary | null>(null);
  const dueInstallments = ref<DueInstallmentItem[]>([]);
  const isLoadingSummary = ref(false);
  const isLoadingDue = ref(false);
  const errorMessage = ref<string | null>(null);

  // 1. Ambil ringkasan modal, laba, kanal pembayaran & data grafik
  async function fetchSummary(year?: number) {
    const api = useDebtApi();
    isLoadingSummary.value = true;
    errorMessage.value = null;

    try {
      const url = year ? `/finance/summary?year=${year}` : '/finance/summary';
      const res = await api.get<FinanceSummary>(url);
      summary.value = res.data;
    } catch (err: any) {
      errorMessage.value = err.response?.data?.message || 'Gagal memuat ringkasan keuangan.';
    } finally {
      isLoadingSummary.value = false;
    }
  }

  // 2. Ambil daftar tagihan/tunggakan jatuh tempo (past_overdue, current_month, dsb.)
  async function fetchDueInstallments(type: 'all' | 'past_overdue' | 'current_month' = 'current_month', month?: number, year?: number) {
    const api = useDebtApi();
    isLoadingDue.value = true;
    errorMessage.value = null;

    try {
      let query = `type=${type}`;
      if (month && year) {
        query += `&month=${month}&year=${year}`;
      }
      const res = await api.get<DueInstallmentItem[]>(`/finance/due-installments?${query}`);
      dueInstallments.value = res.data;
    } catch (err: any) {
      errorMessage.value = err.response?.data?.message || 'Gagal memuat daftar penagihan.';
    } finally {
      isLoadingDue.value = false;
    }
  }

  // 3. Bayar angsuran langsung dari daftar penagihan
  async function payInstallment(scheduleId: number, paymentMethod: string) {
    const api = useDebtApi();
    try {
      const res = await api.post(`/Installment/schedules/${scheduleId}/pay`, { paymentMethod });
      return { success: true, data: res.data };
    } catch (err: any) {
      return { success: false, message: err.response?.data?.message || 'Gagal memproses pembayaran.' };
    }
  }

  return {
    summary,
    dueInstallments,
    isLoadingSummary,
    isLoadingDue,
    errorMessage,
    fetchSummary,
    fetchDueInstallments,
    payInstallment
  };
});