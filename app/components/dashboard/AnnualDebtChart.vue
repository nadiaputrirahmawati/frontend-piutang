<!-- components/dashboard/AnnualDebtChart.vue -->
<script setup lang="ts">
import { ref, computed } from "vue";

interface MonthlyStat {
  month: number;
  year: number;
  monthLabel: string;
  totalDebtAdded: number;
  totalDebtPaid: number;
  isCurrentMonth: boolean;
}

const props = defineProps<{
  stats: MonthlyStat[];
  selectedYear: number;
  availableYears: number[];
}>();

const emit = defineEmits<{
  (e: "changeYear", year: number): void;
}>();

// State Mode Aktif
const viewMode = ref<"paid" | "added">("paid");

// Helper untuk mengambil nilai sesuai mode aktif
const getAmount = (item: MonthlyStat) => {
  return viewMode.value === "paid" 
    ? Number(item.totalDebtPaid || 0) 
    : Number(item.totalDebtAdded || 0);
};

// Hitung nilai maksimum secara dinamis sesuai mode aktif
const maxAmount = computed(() => {
  if (!props.stats || props.stats.length === 0) return 1;
  const values = props.stats.map((s) => getAmount(s));
  const max = Math.max(...values);
  return max > 0 ? max : 1;
});

// Hitung persentase tinggi bar (minimal 8% agar bar tetap tampak)
const getBarHeight = (item: MonthlyStat) => {
  const current = getAmount(item);
  if (current <= 0) return "8%";
  const percentage = (current / maxAmount.value) * 100;
  return `${Math.max(8, Math.min(100, percentage))}%`;
};

const formatRupiah = (val: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(val || 0);
};

const formatRibuan = (val: number) => {
  if (val >= 1000000) return (val / 1000000).toFixed(1) + "M";
  if (val >= 1000) return (val / 1000).toFixed(0) + "k";
  return val.toString();
};
</script>

<template>
  <div class="bg-white border border-debt-grey/80 rounded-3xl p-5 shadow-2xs flex flex-col justify-between">
    <!-- Header: Judul, Dropdown Tahun & Toggle -->
    <div class="flex flex-wrap items-center justify-between gap-3 pb-4">
      <div class="flex items-center gap-2.5">
        <div class="w-8 h-8 rounded-xl bg-debt-container flex items-center justify-center text-debt">
          <span class="material-symbols-outlined text-[18px]">bar_chart</span>
        </div>
        <div>
          <h4 class="text-lg font-bold text-debt-dark">Statistik Piutang Tahunan</h4>
          <span class="text-xs text-slate-400">Januari - Desember</span>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <!-- Pilihan Tahun -->
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

        <!-- Tombol Toggle Tab -->
        <div class="bg-debt-container rounded-full p-0.5 flex items-center text-[10px] font-bold">
          <button
            type="button"
            @click="viewMode = 'paid'"
            :class="[
              'px-3 py-1 rounded-full transition-all duration-200',
              viewMode === 'paid' ? 'bg-debt text-white shadow-2xs' : 'text-slate-500 hover:text-debt'
            ]"
          >
            Pelunasan
          </button>
          <button
            type="button"
            @click="viewMode = 'added'"
            :class="[
              'px-3 py-1 rounded-full transition-all duration-200',
              viewMode === 'added' ? 'bg-debt text-white shadow-2xs' : 'text-slate-500 hover:text-debt'
            ]"
          >
            Bon Baru
          </button>
        </div>
      </div>
    </div>

    <!-- Area Chart Batang -->
    <div class="relative pt-6 pb-2">
      <!-- Grid Garis Horizontal -->
      <div class="absolute inset-x-0 top-6 bottom-8 flex flex-col justify-between pointer-events-none opacity-40">
        <div class="border-b border-dashed border-slate-200 w-full flex justify-between">
          <span class="text-[9px] text-slate-400 -mt-2.5">{{ formatRibuan(maxAmount) }}</span>
        </div>
        <div class="border-b border-dashed border-slate-200 w-full flex justify-between">
          <span class="text-[9px] text-slate-400 -mt-2.5">{{ formatRibuan(maxAmount * 0.5) }}</span>
        </div>
        <div class="border-b border-dashed border-slate-200 w-full flex justify-between">
          <span class="text-[9px] text-slate-400 -mt-2.5">0</span>
        </div>
      </div>

      <!-- Batang 12 Bulan -->
      <div class="flex items-end justify-between gap-1 sm:gap-2 h-56 px-4 relative z-10">
        <div
          v-for="item in stats"
          :key="item.month"
          class="flex-1 flex flex-col items-center gap-2 h-full justify-end group relative"
        >
          <!-- Tooltip Nominal saat Hover -->
          <div class="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 px-2 py-1 rounded-lg bg-debt-dark text-white text-[10px] font-semibold whitespace-nowrap z-30 pointer-events-none shadow-md">
            {{ formatRupiah(getAmount(item)) }}
          </div>

          <!-- Highlight Titik Bulan Berjalan -->
          <div
            v-if="item.isCurrentMonth"
            class="absolute -top-4 w-2 h-2 rounded-full bg-debt animate-ping"
          ></div>

          <!-- Batang Grafis Bar -->
          <div
            class="w-full max-w-[32px] rounded-2xl transition-all duration-300 relative overflow-hidden"
            :style="{ height: getBarHeight(item) }"
            :class="[
              item.isCurrentMonth
                ? 'bg-debt text-white shadow-md'
                : 'bg-debt/20 hover:bg-debt/35'
            ]"
          >
            <div class="absolute inset-0 opacity-25 bar-striped-pattern"></div>
          </div>

          <!-- Label Nama Bulan -->
          <span
            :class="[
              'text-[9px] sm:text-[10px] font-bold uppercase transition-colors',
              item.isCurrentMonth ? 'text-debt font-black' : 'text-slate-400 group-hover:text-slate-700'
            ]"
          >
            {{ item.monthLabel }}
          </span>
        </div>
      </div>
    </div>

    <!-- Footer Keterangan -->
    <div class="pt-3 border-t border-debt-grey/50 flex items-center justify-between text-[11px] text-slate-500">
      <span>
        Mode: <b class="text-debt-dark">{{ viewMode === 'paid' ? 'Pelunasan Masuk (Uang Diterima)' : 'Bon Baru Ditambahkan (Piutang Baru)' }}</b>
      </span>
      <span class="font-bold text-debt">Tahun {{ selectedYear }}</span>
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