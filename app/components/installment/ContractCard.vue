<!-- components/installment/ContractCard.vue -->
<script setup lang="ts">
import { computed } from 'vue';
import { Clock, CheckCircle2, ChevronRight, Package } from 'lucide-vue-next';
import type { InstallmentContractResponse } from '~/stores/installment';

const props = defineProps<{
  contract: InstallmentContractResponse;
  customerName?: string;
}>();

const emit = defineEmits<{
  (e: 'viewDetail', contractId: number): void;
}>();

const formatRupiah = (val: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(val || 0);
};

// HITUNG SISA TAGIHAN RIIL DARI JADWAL YANG BELUM DIBAYAR
const calculatedRemaining = computed(() => {
  if (!props.contract.schedules || props.contract.schedules.length === 0) {
    return Number(props.contract.totalAmount || 0);
  }
  return props.contract.schedules
    .filter(s => s.status !== 'paid')
    .reduce((sum, s) => sum + Number(s.amount || 0), 0);
});

// Hitung berapa kali angsuran sudah lunas
const paidSchedulesCount = computed(() => {
  return (props.contract.schedules || []).filter(s => s.status === 'paid').length;
});

const progressPercent = computed(() => {
  const total = Number(props.contract.totalAmount || 1);
  const paid = total - calculatedRemaining.value;
  return Math.min(100, Math.max(0, (paid / total) * 100));
});
</script>

<template>
  <div class="bg-white border border-debt-grey/80 rounded-3xl p-5 shadow-2xs hover:border-debt/40 transition flex flex-col justify-between space-y-4">
    <div>
      <!-- Header No Kontrak & Status -->
      <div class="flex items-center justify-between pb-3 border-b border-debt-grey/50">
        <span class="font-mono font-bold text-xs text-slate-500">{{ contract.contractNumber }}</span>
        <span
          :class="[
            'px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase inline-flex items-center gap-1',
            contract.status === 'active' 
              ? 'bg-amber-50 text-amber-700 border border-amber-200' 
              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
          ]"
        >
          <Clock v-if="contract.status === 'active'" :size="12" />
          <CheckCircle2 v-else :size="12" />
          {{ contract.status === 'active' ? 'Aktif' : 'Lunas' }}
        </span>
      </div>

      <!-- Nama Pelanggan & Barang -->
      <div class="mt-3">
        <span class="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Pelanggan</span>
        <h3 class="font-black text-base text-debt-dark">
          {{ customerName || `Customer #${contract.customerId}` }}
        </h3>
        <p class="text-xs text-slate-600 flex items-center gap-1.5 mt-0.5 font-semibold">
          <Package :size="13" class="text-debt" />
          <span>{{ contract.itemName }}</span>
        </p>
      </div>

      <!-- Detail Angsuran Bulanan -->
      <div class="grid grid-cols-2 gap-2 mt-3 p-3 bg-debt-container/40 rounded-2xl text-xs">
        <div>
          <span class="text-[10px] text-slate-400 block font-medium">Cicilan / Bulan</span>
          <span class="font-bold text-debt-dark">{{ formatRupiah(contract.monthlyInstallment) }}</span>
        </div>
        <div class="text-right">
          <span class="text-[10px] text-slate-400 block font-medium">Progres Tenor</span>
          <span class="font-bold text-slate-700">{{ paidSchedulesCount }} / {{ contract.tenorMonths }} Bulan</span>
        </div>
      </div>

      <!-- Sisa Tagihan Riil -->
      <div class="mt-3 space-y-1.5">
        <div class="flex justify-between text-[11px]">
          <span class="text-slate-400">Sisa Tagihan:</span>
          <span class="font-black" :class="calculatedRemaining > 0 ? 'text-debt' : 'text-emerald-700'">
            {{ calculatedRemaining > 0 ? formatRupiah(calculatedRemaining) : 'Lunas (Rp 0)' }}
          </span>
        </div>
        <!-- Progress Bar -->
        <div class="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
          <div
            class="h-full bg-debt transition-all duration-500 rounded-full"
            :style="{ width: `${progressPercent}%` }"
          ></div>
        </div>
      </div>
    </div>

    <!-- Tombol Detail -->
    <button
      type="button"
      @click="emit('viewDetail', contract.id)"
      class="w-full h-10 rounded-xl bg-debt hover:bg-[#68001a] text-white text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-2xs cursor-pointer"
    >
      <span>Lihat Jadwal Angsuran</span>
      <ChevronRight :size="16" />
    </button>
  </div>
</template>