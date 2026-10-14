// stores/installment.ts
import { defineStore } from 'pinia';
import { ref } from 'vue';
import { useDebtApi } from '~/composables/useDebtApi';

// 1. Definisikan Interface Jadwal
export interface InstallmentScheduleResponse {
  id: number;
  contractId: number;
  installmentNumber: number;
  dueDate: string;
  amount: number;
  status: 'unpaid' | 'paid';
  createdAt: string;
}

// Berikan alias agar kode lama yang memanggil InstallmentSchedule tidak rusak
export type InstallmentSchedule = InstallmentScheduleResponse;

// 2. Definisikan Interface Kontrak
export interface InstallmentContractResponse {
  id: number;
  contractNumber: string;
  customerId: number;
  itemName: string;
  principalAmount: number;
  totalInterest: number;
  totalAmount: number;
  tenorMonths: number;
  monthlyInstallment: number;
  status: 'active' | 'completed';
  createdAt: string;
  schedules: InstallmentScheduleResponse[];
}

// Berikan alias agar kode lama yang memanggil InstallmentContract tidak rusak
export type InstallmentContract = InstallmentContractResponse;

// 3. Interface Payload Pembuatan Kontrak
export interface CreateContractPayload {
  customerId: number;
  itemName: string;
  principalAmount: number;
  totalInterest: number;
  tenorMonths: number;
  firstDueDate: string;
}

export const useInstallmentStore = defineStore('installment', () => {
  const contracts = ref<InstallmentContractResponse[]>([]);
  const selectedContract = ref<InstallmentContractResponse | null>(null);
  const isLoading = ref(false);
  const errorMessage = ref<string | null>(null);

  async function fetchContracts(customerId?: number) {
    const api = useDebtApi();
    isLoading.value = true;
    errorMessage.value = null;

    try {
      const url = customerId ? `/Installment/contracts?customerId=${customerId}` : '/Installment/contracts';
      const res = await api.get<InstallmentContractResponse[]>(url);
      contracts.value = res.data;
    } catch (err: any) {
      errorMessage.value = err.response?.data?.message || 'Gagal memuat kontrak cicilan.';
    } finally {
      isLoading.value = false;
    }
  }

  async function fetchContractById(contractId: number) {
    const api = useDebtApi();
    isLoading.value = true;
    errorMessage.value = null;

    try {
      const res = await api.get<InstallmentContractResponse>(`/Installment/contracts/${contractId}`);
      selectedContract.value = res.data;
      return res.data;
    } catch (err: any) {
      errorMessage.value = err.response?.data?.message || 'Gagal mengambil detail kontrak.';
      return null;
    } finally {
      isLoading.value = false;
    }
  }

  async function createContract(payload: CreateContractPayload) {
    const api = useDebtApi();
    isLoading.value = true;
    errorMessage.value = null;

    try {
      const res = await api.post<InstallmentContractResponse>('/Installment/contracts', payload);
      await fetchContracts();
      return { success: true, data: res.data };
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Gagal membuat kontrak cicilan.';
      errorMessage.value = msg;
      return { success: false, message: msg };
    } finally {
      isLoading.value = false;
    }
  }

  async function paySchedule(scheduleId: number, paymentMethod: string) {
    const api = useDebtApi();
    isLoading.value = true;
    errorMessage.value = null;

    try {
      const res = await api.post(`/Installment/schedules/${scheduleId}/pay`, {
        paymentMethod
      });

      if (selectedContract.value) {
        await fetchContractById(selectedContract.value.id);
      }
      await fetchContracts();
      return { success: true, data: res.data };
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Gagal memproses pembayaran cicilan.';
      return { success: false, message: msg };
    } finally {
      isLoading.value = false;
    }
  }

  return {
    contracts,
    selectedContract,
    isLoading,
    errorMessage,
    fetchContracts,
    fetchContractById,
    createContract,
    paySchedule
  };
});