// stores/debt.ts
import { defineStore } from 'pinia';
import { ref } from 'vue';
import { useDebtApi } from '~/composables/useDebtApi';

export interface CustomerDebtItem {
  id: number;
  customerId: number;
  customerName: string;
  totalDebt: number;
  createdAt: string;
  updatedAt: string;
}

  export interface PayDebtPayload {
    customerId: number;
    amount: number;
    paymentMethod?: string;
    notes?: string;
  }

export const useDebtStore = defineStore('debt', () => {
  const debts = ref<CustomerDebtItem[]>([]);
  const isLoading = ref(false);
  const errorMessage = ref<string | null>(null);

  async function fetchDebts(status: 'all' | 'unpaid' | 'paid' = 'all') {
    const api = useDebtApi();
    isLoading.value = true;
    errorMessage.value = null;

    try {
      const res = await api.get<CustomerDebtItem[]>(`/debt?status=${status}`);
      debts.value = res.data;
    } catch (err: any) {
      console.error('Error fetching debts:', err);
      errorMessage.value = err.response?.data?.message || 'Gagal mengambil data hutang pelanggan.';
    } finally {
      isLoading.value = false;
    }
  }

  // stores/debt.ts
  async function createManualDebt(payload: {
    customerId: number;
    customerName: string;
    amount: number;
    notes?: string;
  }) {
    const api = useDebtApi();
    isLoading.value = true;
    errorMessage.value = null;

    try {
      // Memanggil endpoint C# yang sudah ada
      const res = await api.post('/debt/manual', payload);
      await fetchDebts(); // Segarkan data tabel
      return { success: true, data: res.data };
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Gagal menambahkan bon manual.';
      errorMessage.value = msg;
      return { success: false, message: msg };
    } finally {
      isLoading.value = false;
    }
  }

  // stores/debt.ts


  // Di dalam defineStore:
  async function payDebt(payload: PayDebtPayload) {
    const api = useDebtApi();
    isLoading.value = true;
    errorMessage.value = null;

    try {
      const res = await api.post('/debt/pay', {
        customerId: payload.customerId,
        amount: payload.amount,
        paymentMethod: payload.paymentMethod || 'Cash',
        notes: payload.notes || 'Pembayaran hutang manual via dashboard'
      });

      await fetchDebts(); // Refresh data tabel
      return { success: true, data: res.data };
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Gagal memproses pembayaran hutang.';
      errorMessage.value = msg;
      return { success: false, message: msg };
    } finally {
      isLoading.value = false;
    }
  }

  // Pastikan payDebt di-return di bagian bawah store:
  return {
    debts,
    isLoading,
    errorMessage,
    fetchDebts,
    createManualDebt,
    payDebt
  };
});

