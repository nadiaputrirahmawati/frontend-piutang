<!-- pages/index.vue -->
<script setup lang="ts">
import { storeToRefs } from "pinia";
import { ref, onMounted } from "vue";
import { useDashboardStore } from "~/stores/dashboard";
import AnnualDebtChart from "~/components/dashboard/AnnualDebtChart.vue";
import CommonStatCard from "~/components/common/StatCard.vue";
import DashboardRecentMutationsTable from "~/components/dashboard/RecentMutationsTable.vue";
import DueInstallmentsCard from "~/components/dashboard/DueInstallmentsCard.vue";
import {
  ArrowUpRight,
  Wallet,
  Users,
  FileText,
  CalendarClock,
  ClockAlert
} from "@lucide/vue";

const dashboardStore = useDashboardStore();
const { summary, isLoading, errorMessage } = storeToRefs(dashboardStore);

const selectedYear = ref(2026);
const availableYears = [2024, 2025, 2026, 2027];

const handleYearChange = async (year: number) => {
  selectedYear.value = year;
  await dashboardStore.fetchSummary(year);
};

const formatRupiah = (val: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(val || 0);
};

onMounted(() => {
  dashboardStore.fetchSummary(selectedYear.value);
});
</script>

<template>
  <div class="space-y-6 h">
    <!-- Header Dashboard -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-4xl font-bold text-black">Dashboard</h2>
        <p class="text-sm text-debt-dark mt-0.5 italic">
          Data Ringkasan Manajemen Piutang
        </p>
      </div>
    </div>

    <div class="flex flex-col lg:flex-row space-x-4 w-full">
      <div
        class="bg-white rounded-[2rem] p-5 shadow-sm border border-slate-100 max-w-sm w-full"
      >
        <!-- Header Card -->
        <div class="flex items-center justify-between mb-4 px-1">
          <h3 class="text-base font-bold text-slate-800">Data Statistik</h3>
          <button
            type="button"
            class="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 hover:border-slate-400 transition"
          >
            <ArrowUpRight :size="18" />
          </button>
        </div>

        <!-- Container Kartu Menumpuk (Lapisan bawah menimpa lapisan atas) -->
        <div class="flex flex-col">
          <!-- 1. ATAS: PUTIH (Tertindih oleh kartu biru) -->
          <div
            class="relative z-10 bg-debt-dark text-white p-4 pb-7 rounded-3xl"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div
                  class="w-10 h-10 rounded-full bg-white text-debt flex items-center justify-center shrink-0"
                >
                  <Wallet :size="20" />
                </div>
                <div>
                  <p class="text-[13px] font-semibold text-white">
                    Pembayaran Hutang
                  </p>
                  <p class="text-xs text-debt-grey">Total belum bayar</p>
                </div>
              </div>
              <div class="text-right">
                <p class="text-sm font-bold text-white">
                  {{
                    isLoading
                      ? "..."
                      : formatRupiah(summary?.totalActiveDebt || 0)
                  }}
                </p>
                <p class="text-[11px] text-slate-400">Piutang</p>
              </div>
            </div>
          </div>

          <!-- 2. KEDUA: BIRU (Menindih putih, tertindih hijau) -->
          <div
            class="relative z-20 -mt-4 p-4 pb-7 bg-debt-container text-slate-900 rounded-3xl shadow-sm"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div
                  class="w-10 h-10 rounded-full bg-debt text-white flex items-center justify-center shrink-0"
                >
                  <FileText :size="20" />
                </div>
                <div>
                  <p class="text-[13px] font-semibold text-slate-900">
                    Kontrak Cicilan Aktif
                  </p>
                  <p class="text-xs text-slate-600">Kredit berjalan</p>
                </div>
              </div>
              <div class="text-right">
                <p class="text-sm font-bold text-debt-dark">
                  {{
                    isLoading
                      ? "..."
                      : `${summary?.activeInstallmentContracts || 0} Kontrak`
                  }}
                </p>
                <p class="text-[11px] text-slate-600">Aktif</p>
              </div>
            </div>
          </div>

          <!-- 3. KETIGA: HIJAU / LIME (Menindih biru, tertindih hitam) -->
          <div
            class="relative z-30 -mt-4 p-4 pb-7 bg-debt text-white rounded-3xl shadow-sm"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div
                  class="w-10 h-10 rounded-full bg-white text-debt-dark flex items-center justify-center shrink-0"
                >
                  <Users :size="20" />
                </div>
                <div>
                  <p class="text-[13px] font-semibold">Pelanggan</p>
                  <p class="text-xs">Pelanggan aktif</p>
                </div>
              </div>
              <div class="text-right">
                <p class="text-sm font-bold text-white">
                  {{
                    isLoading
                      ? "..."
                      : `${summary?.totalIndebtedCustomers || 0} Orang`
                  }}
                </p>
                <p class="text-[11px] text-white">Total</p>
              </div>
            </div>
          </div>

          <!-- 4. PALING BAWAH: HITAM (Menindih kartu hijau di atasnya) -->
          <div
            class="relative z-40 -mt-4 p-4 rounded-3xl bg-white text-debt-dark shadow-lg"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div
                  class="w-10 h-10 rounded-full bg-debt text-white flex items-center justify-center shrink-0"
                >
                  <CalendarClock :size="20" />
                </div>
                <div>
                  <p class="text-[13px] font-semibold">Target Tagihan</p>
                  <p class="text-xs text-gray-400">Jatuh tempo bulan ini</p>
                </div>
              </div>
              <div class="text-right">
                <p class="text-sm font-bold text-debt-dark">
                  {{
                    isLoading
                      ? "..."
                      : formatRupiah(summary?.thisMonthInstallmentTarget || 0)
                  }}
                </p>
                <p class="text-[11px] text-slate-400">Bulan ini</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="lg:w-6/12 w-full">
        <AnnualDebtChart
          :stats="summary?.monthlyStatistics || []"
          :selected-year="selectedYear"
          :available-years="availableYears"
          @change-year="handleYearChange"
        />
      </div>
      <div class="lg:w-3/12 w-full">
        <DueInstallmentsCard
          :items="summary?.dueInstallmentsThisMonth || []"
          :loading="isLoading"
        />
      </div>
    </div>
    <!-- 3. BARIS BAWAH: TABEL 5 MUTASI TERKINI -->
    <DashboardRecentMutationsTable
      :items="summary?.recentMutations || []"
      :loading="isLoading"
    />
  </div>
</template>
