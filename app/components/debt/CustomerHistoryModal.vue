<!-- components/debt/CustomerHistoryModal.vue -->
<script setup lang="ts">
import { ref, watch } from 'vue';
import { 
  X, 
  History, 
  Calendar, 
  ArrowUpRight, 
  ArrowDownLeft, 
  CheckCircle2, 
  Clock, 
  Receipt,
  FileText,
  Loader2
} from 'lucide-vue-next';

interface Props {
  show: boolean;
  customerId: number | null;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'viewInstallment', contractId: number): void;
}>();

const api = useDebtApi();
const historyData = ref<any>(null);
const isLoading = ref(false);
const errorMsg = ref<string | null>(null);

const formatRupiah = (val: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(val || 0);
};

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const fetchHistory = async () => {
  if (!props.customerId) return;
  isLoading.value = true;
  errorMsg.value = null;

  try {
    const res = await api.get(`/debt/customers/${props.customerId}/history`);
    historyData.value = res.data;
  } catch (err: any) {
    errorMsg.value = err.response?.data?.message || 'Gagal mengambil riwayat hutang.';
  } finally {
    isLoading.value = false;
  }
};

watch(() => props.show, (active) => {
  if (active && props.customerId) {
    fetchHistory();
  } else {
    historyData.value = null;
  }
});
</script>

<template>
  <Teleport to="body">
    <div
      v-if="show"
      class="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs"
      @click.self="emit('close')"
    >
      <div class="w-full max-w-2xl max-h-[90vh] bg-white rounded-3xl border border-debt-grey shadow-2xl flex flex-col overflow-hidden z-[101]">
        
        <!-- 1. HEADER MODAL -->
        <div class="px-6 py-4 bg-debt text-white flex items-center justify-between shrink-0">
          <div class="flex items-center gap-2.5">
            <History :size="20" class="text-white/80" />
            <div>
              <h3 class="text-sm font-bold tracking-wide">Buku Riwayat Piutang</h3>
              <p class="text-[11px] text-white/70">Catatan bon dan pembayaran berkala</p>
            </div>
          </div>
          <button
            type="button"
            @click="emit('close')"
            class="text-white/70 hover:text-white p-1 rounded-lg transition cursor-pointer"
          >
            <X :size="18" />
          </button>
        </div>

        <!-- 2. SUMMARY HEADER PELANGGAN & TOMBOL CICILAN -->
        <div v-if="historyData" class="p-5 bg-debt-dim border-b border-debt-grey/80 shrink-0 space-y-3">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Pelanggan</span>
              <h2 class="text-lg font-black text-debt-dark">
                {{ historyData.customerName }}
                <span class="text-xs font-mono font-medium text-slate-400 ml-1">#{{ historyData.customerId }}</span>
              </h2>
            </div>

            <!-- Total Sisa Hutang Keseluruhan -->
            <div class="text-left sm:text-right">
              <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Sisa Hutang Keseluruhan</span>
              <span class="text-xl font-black" :class="Number(historyData.totalCurrentDebt) > 0 ? 'text-debt' : 'text-emerald-700'">
                {{ Number(historyData.totalCurrentDebt) > 0 ? formatRupiah(historyData.totalCurrentDebt) : 'Lunas (Rp 0)' }}
              </span>
            </div>
          </div>

          <!-- TOMBOL JIKA MEMILIKI CICILAN AKTIF -->
          <div v-if="historyData.hasActiveInstallment" class="pt-2 border-t border-debt-grey/60 flex items-center justify-between">
            <div class="flex items-center gap-2 text-xs text-slate-600">
              <Receipt :size="16" class="text-debt" />
              <span>Pelanggan ini memiliki <b>Kontrak Cicilan Aktif</b></span>
            </div>
            <button
              type="button"
              @click="emit('viewInstallment', historyData.activeContractId)"
              class="h-8 px-3.5 bg-debt hover:bg-[#68001a] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-2xs cursor-pointer"
            >
              <span>Lihat Cicilan Saya</span>
              <ArrowUpRight :size="14" />
            </button>
          </div>
        </div>

        <!-- 3. BODY KONTEN: CARD LIST PER BULAN -->
        <div class="p-5 overflow-y-auto flex-1 space-y-4">
          <!-- Loading State -->
          <div v-if="isLoading" class="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
            <Loader2 :size="28" class="animate-spin text-debt" />
            <span class="text-xs font-semibold">Memuat riwayat transaksi...</span>
          </div>

          <!-- Error State -->
          <div v-else-if="errorMsg" class="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
            {{ errorMsg }}
          </div>

          <!-- LIST CARD BULANAN -->
          <template v-else-if="historyData?.monthlyGroups?.length > 0">
            <div
              v-for="group in historyData.monthlyGroups"
              :key="`${group.year}-${group.month}`"
              class="bg-white border border-debt-grey/80 rounded-2xl p-4 shadow-2xs space-y-3"
            >
              <!-- Header Kartu Bulan -->
              <div class="flex items-center justify-between border-b border-debt-grey/60 pb-2.5">
                <div class="flex items-center gap-2">
                  <div class="w-7 h-7 rounded-lg bg-debt-container text-debt flex items-center justify-center">
                    <Calendar :size="15" />
                  </div>
                  <h4 class="font-bold text-sm text-debt-dark">{{ group.periodLabel }}</h4>
                </div>

                <!-- Status Bulan Ini: Lunas atau Ada Tunggakan -->
                <div>
                  <span
                    v-if="group.isMonthSettled"
                    class="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1"
                  >
                    <CheckCircle2 :size="13" />
                    Lunas
                  </span>
                  <span
                    v-else
                    class="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 inline-flex items-center gap-1"
                  >
                    <Clock :size="13" />
                    Belum Lunas
                  </span>
                </div>
              </div>

              <!-- Ringkasan Angka Bulan Ini -->
              <div class="grid grid-cols-2 gap-2 p-2.5 bg-debt-container/50 rounded-xl text-xs">
                <div>
                  <span class="text-[10px] text-slate-400 block font-semibold">Bon Ditambahkan:</span>
                  <span class="font-bold text-rose-700">+{{ formatRupiah(group.totalAdded) }}</span>
                </div>
                <div class="text-right">
                  <span class="text-[10px] text-slate-400 block font-semibold">Uang Dibayarkan:</span>
                  <span class="font-bold text-emerald-700">-{{ formatRupiah(group.totalPaid) }}</span>
                </div>
              </div>

              <!-- Rincian Mutasi di Bulan Tersebut -->
              <div class="divide-y divide-debt-grey/40 text-xs pt-1">
                <div
                  v-for="mut in group.mutations"
                  :key="mut.id"
                  class="py-2 flex items-center justify-between gap-3"
                >
                  <div class="flex items-center gap-2">
                    <div
                      :class="[
                        'w-6 h-6 rounded-md flex items-center justify-center shrink-0 text-[10px]',
                        mut.mutationType === 'increase' ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'
                      ]"
                    >
                      <ArrowUpRight v-if="mut.mutationType === 'increase'" :size="14" />
                      <ArrowDownLeft v-else :size="14" />
                    </div>
                    <div>
                      <p class="font-semibold text-slate-800 leading-tight">
                        {{ mut.notes || (mut.mutationType === 'increase' ? 'Tambah Bon' : 'Pembayaran') }}
                      </p>
                      <span class="text-[10px] text-slate-400 font-mono">{{ formatDate(mut.createdAt) }} • {{ mut.referenceNumber }}</span>
                    </div>
                  </div>

                  <div class="text-right shrink-0">
                    <span
                      class="font-bold block"
                      :class="mut.mutationType === 'increase' ? 'text-rose-700' : 'text-emerald-700'"
                    >
                      {{ mut.mutationType === 'increase' ? '+' : '-' }}{{ formatRupiah(mut.amount) }}
                    </span>
                    <span class="text-[10px] text-slate-400">
                      Sisa: {{ mut.balanceAfter === 0 ? 'Lunas' : formatRupiah(mut.balanceAfter) }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </template>

          <!-- State Kosong -->
          <div v-else class="py-10 text-center text-slate-400 text-xs">
            <FileText :size="28" class="mx-auto mb-1 text-slate-300" />
            Belum ada catatan mutasi transaksi untuk pelanggan ini.
          </div>
        </div>

        <!-- 4. FOOTER -->
        <div class="px-6 py-3 bg-white border-t border-debt-grey/80 flex items-center justify-end shrink-0">
          <button
            type="button"
            @click="emit('close')"
            class="h-9 px-4 rounded-xl border border-debt-grey hover:bg-slate-100 text-xs font-bold text-slate-600 transition cursor-pointer"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  </Teleport>
</template>