<!-- pages/index.vue -->
<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { ref, onMounted } from "vue";
import { useDashboardStore } from "~/stores/dashboard";
import AnnualDebtChart from "~/components/dashboard/AnnualDebtChart.vue";
import CommonStatCard from "~/components/common/StatCard.vue";
import DashboardRecentMutationsTable from "~/components/dashboard/RecentMutationsTable.vue";

const dashboardStore = useDashboardStore();
const { summary, isLoading, errorMessage } = storeToRefs(dashboardStore);

const selectedYear = ref(2026);
const availableYears = [2024, 2025, 2026, 2027];

const handleYearChange = async (year: number) => {
  selectedYear.value = year;
  await dashboardStore.fetchSummary(year);
};

const formatRupiah = (val: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(val || 0);
};

onMounted(() => {
  dashboardStore.fetchSummary(selectedYear.value);
});
</script>

<template>
  <div class="space-y-6">
    <!-- Header Dashboard -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-xl font-bold text-slate-900">Ringkasan Piutang & Kredit</h2>
        <p class="text-xs text-slate-500 mt-0.5">Pemantauan real-time saldo bon kasir dan jadwal cicilan</p>
      </div>

      <!-- Tombol Refresh -->
      <button 
        type="button"
        @click="dashboardStore.fetchSummary(selectedYear)" 
        :disabled="isLoading"
        class="h-9 px-3.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow-2xs disabled:opacity-50"
      >
        <span class="material-symbols-outlined text-[16px]" :class="{ 'animate-spin': isLoading }">
          refresh
        </span>
        {{ isLoading ? 'Memuat...' : 'Segarkan Data' }}
      </button>
    </div>

    <!-- Alert jika error -->
    <div v-if="errorMessage" class="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium">
      {{ errorMessage }}
    </div>

    <!-- 1. BARIS ATAS: 4 KARTU KPI METRIK -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <CommonStatCard
        title="Total Piutang Aktif"
        :value="formatRupiah(summary?.totalActiveDebt || 0)"
        icon="account_balance_wallet"
        color-class="bg-rose-50 text-rose-700"
        subtext="Total bon belum terbayar"
        :loading="isLoading"
      />
      <CommonStatCard
        title="Pelanggan Berhutang"
        :value="`${summary?.totalIndebtedCustomers || 0} Orang`"
        icon="group"
        color-class="bg-amber-50 text-amber-700"
        subtext="Jumlah pelanggan aktif berhutang"
        :loading="isLoading"
      />
      <CommonStatCard
        title="Kontrak Cicilan Aktif"
        :value="`${summary?.activeInstallmentContracts || 0} Kontrak`"
        icon="contract"
        color-class="bg-blue-50 text-blue-700"
        subtext="Kredit sedang berjalan"
        :loading="isLoading"
      />
      <CommonStatCard
        title="Target Tagihan Bulan Ini"
        :value="formatRupiah(summary?.thisMonthInstallmentTarget || 0)"
        icon="event_upcoming"
        color-class="bg-emerald-50 text-emerald-700"
        subtext="Jatuh tempo bulan berjalan"
        :loading="isLoading"
      />
    </div>

    <!-- 2. BARIS TENGAH: GRAFIK BATANG TAHUNAN -->
    <div>
      <AnnualDebtChart
        :stats="summary?.monthlyStatistics || []"
        :selected-year="selectedYear"
        :available-years="availableYears"
        @change-year="handleYearChange"
      />
    </div>

    <!-- 3. BARIS BAWAH: TABEL 5 MUTASI TERKINI -->
    <DashboardRecentMutationsTable
      :items="summary?.recentMutations || []"
      :loading="isLoading"
    />
  </div>
</template>