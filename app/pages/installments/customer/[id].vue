<!-- pages/installments/customer/[id].vue -->
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useInstallmentStore, type InstallmentScheduleResponse } from '~/stores/installment';
import { useDebtStore } from '~/stores/debt';
import { 
  ArrowLeft, 
  RefreshCw, 
  Package, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  Wallet, 
  Receipt,
  FileText
} from 'lucide-vue-next';

import PayScheduleModal from '~/components/installment/PayScheduleModal.vue';

const route = useRoute();
const router = useRouter();
const installmentStore = useInstallmentStore();
const debtStore = useDebtStore();

const customerId = computed(() => Number(route.params.id));

// State Modal Bayar
const showPayModal = ref(false);
const selectedScheduleToPay = ref<InstallmentScheduleResponse | null>(null);
const selectedContractItemName = ref('');

const formatRupiah = (val: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(val || 0);
};

const formatDate = (dateStr?: string) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
};

const loadData = async () => {
  if (debtStore.debts.length === 0) {
    await debtStore.fetchDebts('all');
  }
  await installmentStore.fetchContracts(customerId.value);
};

onMounted(() => {
  loadData();
});

const customerName = computed(() => {
  const cust = debtStore.debts.find(d => d.customerId === customerId.value);
  return cust?.customerName || `Customer #${customerId.value}`;
});

const customerContracts = computed(() => {
  return installmentStore.contracts.filter(c => c.customerId === customerId.value);
});

// Total kewajiban dari seluruh kontrak milik customer ini
const totalCustomerRemaining = computed(() => {
  return customerContracts.value.reduce((acc, c) => {
    return acc + (c.schedules || []).filter(s => s.status !== 'paid').reduce((sum, s) => sum + Number(s.amount || 0), 0);
  }, 0);
});

// Total uang yang sudah dibayarkan oleh customer ini
const totalCustomerPaid = computed(() => {
  return customerContracts.value.reduce((acc, c) => {
    return acc + (c.schedules || []).filter(s => s.status === 'paid').reduce((sum, s) => sum + Number(s.amount || 0), 0);
  }, 0);
});

const handleOpenPay = (sch: InstallmentScheduleResponse, itemName: string) => {
  selectedScheduleToPay.value = sch;
  selectedContractItemName.value = itemName;
  showPayModal.value = true;
};

const handleConfirmPayment = async (payload: { scheduleId: number; paymentMethod: string }) => {
  showPayModal.value = false;
  const res = await installmentStore.paySchedule(payload.scheduleId, payload.paymentMethod);
  if (res.success) {
    alert(`Pembayaran angsuran berhasil via ${payload.paymentMethod}!`);
    await loadData();
  } else {
    alert(res.message);
  }
};
</script>

<template>
  <div class="space-y-6">
    <!-- Header Halaman -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-debt-grey/60">
      <div class="flex items-center gap-3">
        <button
          type="button"
          @click="router.push('/installments')"
          class="w-10 h-10 rounded-2xl bg-white border border-debt-grey hover:bg-debt-container flex items-center justify-center transition shadow-2xs text-debt-dark cursor-pointer"
        >
          <ArrowLeft :size="18" />
        </button>
        <div>
          <h1 class="text-xl font-bold text-debt-dark"> Riwayat Cicilan</h1>
        </div>
        <!-- <div>
          <h1 class="text-xl font-bold text-debt-dark">Riwayat Cicilan: {{ customerName }}</h1>
          <p class="text-xs text-slate-500">ID Pelanggan: #{{ customerId }} • Memiliki {{ customerContracts.length }} Perjanjian Kredit</p>
        </div> -->
      </div>
    </div>

    <!-- Ringkasan Akumulasi Atas -->
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div class="bg-white border border-debt-grey/80 rounded-2xl p-4 shadow-2xs">
        <span class="text-[11px] font-bold text-black uppercase tracking-wider block">Total Sudah Disetor</span>
        <span class="text-lg font-black text-emerald-700 mt-0.5 block">{{ formatRupiah(totalCustomerPaid) }}</span>
      </div>
      <div class="bg-white border border-debt-grey/80 rounded-2xl p-4 shadow-2xs">
        <span class="text-[11px] font-bold text-black uppercase tracking-wider block">Kewajiban Belum Terbayar</span>
        <span class="text-lg font-black text-debt mt-0.5 block">{{ formatRupiah(totalCustomerRemaining) }}</span>
      </div>
    </div>

    <!-- SEMUA KONTRAK MILIK PELANGGAN INI -->
    <div class="grid grid-cols-3 gap-4">
      <div
        v-for="contract in customerContracts"
        :key="contract.id"
        class="bg-white border border-debt-grey/80 rounded-3xl p-6 shadow-2xs space-y-4"
      >
        <!-- Header per Barang / Kontrak -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-debt-grey/50">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-2xl bg-debt text-white flex items-center justify-center font-bold">
              <Package :size="20" />
            </div>
            <div>
              <div class="flex items-center gap-2">
                <h3 class="text-base font-bold text-debt-dark">{{ contract.itemName }}</h3>
                <span
                  :class="[
                    'px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase',
                    contract.status === 'active' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  ]"
                >
                  {{ contract.status === 'active' ? 'Aktif' : 'Lunas' }}
                </span>
              </div>
              <span class="text-xs font-mono text-slate-400">{{ contract.contractNumber }}</span>
            </div>
          </div>

          <!-- Rincian Pokok + Bunga -->
          <div class="flex items-center gap-4 text-xs">
            <div>
              <span class="text-[10px] text-slate-400 block">Pokok Barang:</span>
              <b>{{ formatRupiah(contract.principalAmount) }}</b>
            </div>
            <div class="border-l border-debt-grey/60 pl-3">
              <span class="text-[10px] text-slate-400 block">Bunga:</span>
              <b class="text-debt">+{{ formatRupiah(contract.totalInterest) }}</b>
            </div>
            <div class="border-l border-debt-grey/60 pl-3 text-right">
              <span class="text-[10px] text-slate-400 block">Cicilan:</span>
              <b class="text-debt-dark">{{ formatRupiah(contract.monthlyInstallment) }} / bln</b>
            </div>
          </div>
        </div>

        <!-- Tabel Jadwal Angsuran Kontrak Ini -->
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="bg-debt-container/50 text-slate-500 uppercase text-[10px] font-bold">
              <tr>
                <th class="py-2.5 px-3 rounded-l-xl">Angsuran</th>
                <th class="py-2.5 px-3">Jatuh Tempo</th>
                <th class="py-2.5 px-3">Nominal Tagihan</th>
                <th class="py-2.5 px-3">Status</th>
                <th class="py-2.5 px-3 text-center rounded-r-xl">Aksi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-debt-grey/40">
              <tr v-for="sch in contract.schedules" :key="sch.id" class="hover:bg-debt-dim/30 transition">
                <td class="py-3 px-3 font-bold text-slate-800">Bulan Ke-{{ sch.installmentNumber }}</td>
                <td class="py-3 px-3 text-slate-600">{{ formatDate(sch.dueDate) }}</td>
                <td class="py-3 px-3 font-bold text-debt-dark">{{ formatRupiah(sch.amount) }}</td>
                <td class="py-3 px-3">
                  <span
                    v-if="sch.status === 'paid'"
                    class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1"
                  >
                    <CheckCircle2 :size="12" /> Lunas
                  </span>
                  <span v-else class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                    Belum Bayar
                  </span>
                </td>
                <td class="py-3 px-3 text-center">
                  <button
                    v-if="sch.status !== 'paid'"
                    type="button"
                    @click="handleOpenPay(sch, contract.itemName)"
                    class="h-7 px-3 bg-debt hover:bg-[#68001a] text-white rounded-lg text-[11px] font-bold inline-flex items-center gap-1 transition shadow-2xs cursor-pointer"
                  >
                    <Wallet :size="12" />
                    <span>Bayar</span>
                  </button>
                  <span v-else class="text-[11px] text-slate-400 font-medium">Selesai</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Modal Dialog Pilih Metode Pembayaran -->
    <PayScheduleModal
      :show="showPayModal"
      :schedule="selectedScheduleToPay"
      :item-name="selectedContractItemName"
      @close="showPayModal = false"
      @confirm="handleConfirmPayment"
    />
  </div>
</template>