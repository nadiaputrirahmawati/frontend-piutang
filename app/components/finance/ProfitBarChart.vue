<!-- components/finance/ProfitBarChart.vue -->
<script setup lang="ts">
import { computed } from 'vue';
import type { MonthlyNetProfit } from '~/stores/finance';

const props = defineProps<{
  stats: MonthlyNetProfit[];
  selectedYear: number;
  availableYears: number[];
}>();

const emit = defineEmits<{
  (e: 'changeYear', year: number): void;
}>();

const formatRupiah = (val: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(val || 0);
};

const formatRibuan = (val: number) => {
  if (val >= 1000000) return (val / 1000000).toFixed(1) + 'M';
  if (val >= 1000) return (val / 1000).toFixed(0) + 'k';
  return val.toString();
};

const maxProfit = computed(() => {
  if (!props.stats || props.stats.length === 0) return 1;
  const values = props.stats.map(s => Number(s.netProfit || 0));
  const max = Math.max(...values);
  return max > 0 ? max : 1;
});
</script>

<template>
  <div class="bg-white border border-debt-grey/80 rounded-3xl p-5 shadow-2xs flex flex-col justify-between">
    <!-- Header Grafik -->
    <div class="flex items-center justify-between pb-4 border-b border-debt-grey/50">
      <div>
        <h3 class="text-sm font-bold text-debt-dark">Tren Realisasi Laba Bersih (Net Profit)</h3>
        <p class="text-[11px] text-slate-400">Keuntungan murni dari margin angsuran yang lunas per bulan</p>
      </div>

      <!-- Dropdown Pilihan Tahun -->
      <div class="relative">
        <select
          :value="selectedYear"
          @change="emit('changeYear', Number(($event.target as HTMLSelectElement).value))"
          class="h-8 pl-3 pr-7 bg-debt-container hover:bg-debt-container-high text-debt-dark font-bold text-[11px] rounded-full border-none outline-none appearance-none cursor-pointer transition"
        >
          <option v-for="y in availableYears" :key="y" :value="y">
            Tahun {{ y }}
          </option>
        </select>
        <span class="material-symbols-outlined text-[14px] text-slate-500 absolute right-2 top-2 pointer-events-none">
          expand_more
        </span>
      </div>
    </div>

    <!-- Area Batang 12 Bulan -->
    <div class="relative pt-6 pb-2">
      <!-- Grid Garis Latar -->
      <div class="absolute inset-x-0 top-6 bottom-8 flex flex-col justify-between pointer-events-none opacity-40">
        <div class="border-b border-dashed border-slate-200 w-full flex justify-between">
          <span class="text-[9px] text-slate-400 -mt-2.5">{{ formatRibuan(maxProfit) }}</span>
        </div>
        <div class="border-b border-dashed border-slate-200 w-full flex justify-between">
          <span class="text-[9px] text-slate-400 -mt-2.5">{{ formatRibuan(maxProfit * 0.5) }}</span>
        </div>
        <div class="border-b border-dashed border-slate-200 w-full flex justify-between">
          <span class="text-[9px] text-slate-400 -mt-2.5">0</span>
        </div>
      </div>

      <!-- Batang Grafis -->
      <div class="flex items-end justify-between gap-1 sm:gap-2 h-52 px-3 relative z-10">
        <div
          v-for="item in stats"
          :key="item.month"
          class="flex-1 flex flex-col items-center gap-2 h-full justify-end group relative"
        >
          <!-- Tooltip Hover -->
          <div class="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-10 px-2.5 py-1 rounded-xl bg-debt-dark text-white text-[10px] font-semibold whitespace-nowrap z-30 pointer-events-none shadow-md space-y-0.5">
            <div>Untung: <b class="text-amber-300">{{ formatRupiah(item.netProfit) }}</b></div>
            <div class="text-[9px] text-slate-300">Modal Balik: {{ formatRupiah(item.capitalReturned) }}</div>
          </div>

          <!-- Bar Batang -->
          <div
            class="w-full max-w-[32px] rounded-2xl transition-all duration-300 relative overflow-hidden"
            :style="{ height: `${Math.max(8, (Number(item.netProfit || 0) / maxProfit) * 100)}%` }"
            :class="[
              Number(item.netProfit) > 0
                ? 'bg-debt text-white shadow-sm hover:brightness-110'
                : 'bg-debt/15'
            ]"
          >
            <div class="absolute inset-0 opacity-20 bar-striped-pattern"></div>
          </div>

          <!-- Label Bulan -->
          <span class="text-[9px] sm:text-[10px] font-bold uppercase text-slate-500 group-hover:text-debt">
            {{ item.monthLabel }}
          </span>
        </div>
      </div>
    </div>

    <!-- Footer Keterangan -->
    <div class="pt-3 border-t border-debt-grey/50 flex items-center justify-between text-[11px] text-slate-500">
      <span>Akumulasi Laba Bersih Tahun {{ selectedYear }}:</span>
      <b class="text-debt font-bold">
        {{ formatRupiah(stats.reduce((acc, curr) => acc + Number(curr.netProfit || 0), 0)) }}
      </b>
    </div>
  </div>
</template>

<style scoped>
.bar-striped-pattern {
  background-image: repeating-linear-gradient(
    45deg,
    transparent,
    transparent 4px,
    rgba(255, 255, 255, 0.6) 4px,
    rgba(255, 255, 255, 0.6) 8px
  );
}
</style>