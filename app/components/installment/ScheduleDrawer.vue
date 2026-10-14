<!-- components/installment/ScheduleDrawer.vue -->
<script setup lang="ts">
import { computed } from 'vue';
import { X, Calendar, CheckCircle2, Wallet, Package } from 'lucide-vue-next';
import type { InstallmentContractResponse, InstallmentScheduleResponse } from '~/stores/installment';

const props = defineProps<{
  show: boolean;
  contract: InstallmentContractResponse | null;
  customerName?: string;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'pay', schedule: InstallmentScheduleResponse): void;
}>();

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

const calculatedRemaining = computed(() => {
  if (!props.contract?.schedules) return 0;
  return props.contract.schedules
    .filter(s => s.status !== 'paid')
    .reduce((sum, s) => sum + Number(s.amount || 0), 0);
});
</script>

<template>
  <Teleport to="body">
    <div
      v-if="show"
      class="fixed inset-0 z-[100] flex justify-end bg-slate-900/60 backdrop-blur-xs"
      @click.self="emit('close')"
    >
      <div class="w-full max-w-md bg-white h-full shadow-2xl flex flex-col z-[101] animate-in slide-in-from-right duration-200">
        
        <!-- Header Drawer -->
        <div class="px-6 py-4 bg-debt text-white flex items-center justify-between shrink-0">
          <div>
            <span class="text-[10px] text-white/70 uppercase tracking-widest font-mono">
              {{ contract?.contractNumber }}
            </span>
            <h3 class="text-sm font-bold">Rincian Angsuran Tenor</h3>
          </div>
          <button
            type="button"
            @click="emit('close')"
            class="text-white/70 hover:text-white p-1 rounded-lg transition cursor-pointer"
          >
            <X :size="18" />
          </button>
        </div>

        <!-- Summary Singkat -->
        <div v-if="contract" class="p-4 bg-debt-dim border-b border-debt-grey/80 shrink-0 space-y-2">
          <div class="flex items-center justify-between">
            <div>
              <span class="text-[10px] text-slate-400 font-bold uppercase block">Pelanggan</span>
              <span class="font-bold text-sm text-debt-dark">{{ customerName || `Customer #${contract.customerId}` }}</span>
              <span class="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                <Package :size="12" class="text-debt" />
                {{ contract.itemName }}
              </span>
            </div>
            <div class="text-right">
              <span class="text-[10px] text-slate-400 font-bold uppercase block">Sisa Tagihan</span>
              <span class="font-black text-sm text-debt">{{ formatRupiah(calculatedRemaining) }}</span>
            </div>
          </div>
        </div>

        <!-- List Jadwal Angsuran -->
        <div class="p-4 overflow-y-auto flex-1 space-y-3">
          <h4 class="text-xs font-bold text-slate-600 uppercase tracking-wider">Jadwal Angsuran Tiap Bulan</h4>

          <div class="space-y-2.5">
            <div
              v-for="sch in contract?.schedules || []"
              :key="sch.id"
              class="p-3.5 rounded-2xl border transition flex items-center justify-between gap-3"
              :class="[
                sch.status === 'paid' 
                  ? 'bg-emerald-50/40 border-emerald-200/60' 
                  : 'bg-white border-debt-grey shadow-2xs'
              ]"
            >
              <div class="flex items-center gap-3">
                <div
                  :class="[
                    'w-8 h-8 rounded-xl font-mono font-bold text-xs flex items-center justify-center shrink-0',
                    sch.status === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-debt-container text-debt'
                  ]"
                >
                  #{{ sch.installmentNumber }}
                </div>
                <div>
                  <span class="font-bold text-xs text-slate-800 block">
                    Bulan Ke-{{ sch.installmentNumber }}
                  </span>
                  <span class="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                    <Calendar :size="12" />
                    Jatuh Tempo: {{ formatDate(sch.dueDate) }}
                  </span>
                </div>
              </div>

              <div class="text-right flex items-center gap-2.5">
                <div>
                  <span class="font-black text-xs text-debt-dark block">{{ formatRupiah(sch.amount) }}</span>
                  <span
                    v-if="sch.status === 'paid'"
                    class="text-[10px] font-bold text-emerald-700 flex items-center justify-end gap-1"
                  >
                    <CheckCircle2 :size="11" /> Lunas
                  </span>
                  <span v-else class="text-[10px] font-bold text-amber-700">
                    Belum Bayar
                  </span>
                </div>

                <!-- Tombol Bayar (Memicu Modal Pilihan Metode) -->
                <button
                  v-if="sch.status !== 'paid'"
                  type="button"
                  @click="emit('pay', sch)"
                  class="h-8 px-2.5 bg-debt hover:bg-[#68001a] text-white rounded-lg text-xs font-bold flex items-center gap-1 transition shadow-2xs cursor-pointer"
                >
                  <Wallet :size="13" />
                  <span>Bayar</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="p-4 border-t border-debt-grey bg-white shrink-0">
          <button
            type="button"
            @click="emit('close')"
            class="w-full h-10 rounded-xl border border-debt-grey hover:bg-slate-100 text-xs font-bold text-slate-600 transition cursor-pointer"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  </Teleport>
</template>