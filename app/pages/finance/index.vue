<!-- pages/finance/index.vue -->
<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { storeToRefs } from "pinia";
import { useFinanceStore, type DueInstallmentItem } from "~/stores/finance";
import {
  Coins,
  TrendingUp,
  Vault,
  Wallet,
  CreditCard,
  AlertCircle,
  RefreshCw,
  Clock,
  Calendar,
  Package,
  ShoppingCart,
  SquareArrowUpRight,
  AlertTriangle,
  CheckCircle2,
} from "lucide-vue-next";

import ProfitBarChart from "~/components/finance/ProfitBarChart.vue";
import PayScheduleModal from "~/components/installment/PayScheduleModal.vue";

const financeStore = useFinanceStore();
const { summary, dueInstallments, isLoadingSummary, isLoadingDue } =
  storeToRefs(financeStore);

const selectedYear = ref(2026);
const availableYears = [2024, 2025, 2026, 2027];

// Filter Penagihan: 'current_month' (Bulan ini) vs 'past_overdue' (Tunggakan bulan-bulan lalu)
const overdueFilter = ref<"current_month" | "past_overdue">("current_month");

// Modal Bayar Angsuran Penagihan
const showPayModal = ref(false);
const activeDueItem = ref<DueInstallmentItem | null>(null);

const formatRupiah = (val: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(val || 0);
};

const formatDate = (dateStr?: string) => {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

onMounted(async () => {
  await loadAllData();
});

const loadAllData = async () => {
  await Promise.all([
    financeStore.fetchSummary(selectedYear.value),
    financeStore.fetchDueInstallments(overdueFilter.value),
  ]);
};

const handleYearChange = async (year: number) => {
  selectedYear.value = year;
  await financeStore.fetchSummary(year);
};

const handleFilterChange = async (type: "current_month" | "past_overdue") => {
  overdueFilter.value = type;
  await financeStore.fetchDueInstallments(type);
};

// Modal Bayar
const openPayModal = (item: DueInstallmentItem) => {
  activeDueItem.value = item;
  showPayModal.value = true;
};

const handleConfirmPayment = async (payload: {
  scheduleId: number;
  paymentMethod: string;
}) => {
  showPayModal.value = false;
  const res = await financeStore.payInstallment(
    payload.scheduleId,
    payload.paymentMethod,
  );
  if (res.success) {
    alert(`Pembayaran angsuran berhasil dicatat via ${payload.paymentMethod}!`);
    await loadAllData();
  } else {
    alert(res.message);
  }
};

// Total nominal yang perlu ditagih pada filter aktif
const totalDueAmount = computed(() => {
  return dueInstallments.value.reduce(
    (acc, curr) => acc + Number(curr.amount || 0),
    0,
  );
});
</script>

<template>
  <div class="space-y-6">
    <!-- Header Halaman -->
    <div
      class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-debt-grey/60"
    >
      <div>
        <h1 class="text-3xl font-bold text-debt-dark tracking-wider">
          Manajemen Keuangan
        </h1>
        <p class="text-xs text-debt-dark mt-0.5">
          Analisis perputaran modal, laba bersih cicilan, dan daftar piutang
          jatuh tempo
        </p>
      </div>
    </div>

    <div class="flex flex-col lg:flex-row space-x-9">
      <div class="lg:w-6/12 w-full">
        <ProfitBarChart
          :stats="summary?.monthlyNetProfits || []"
          :selected-year="selectedYear"
          :available-years="availableYears"
          @change-year="handleYearChange"
        />
      </div>
      <div class="lg:w-6/12 w-full">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
          <div
            class="bg-debt text-white rounded-3xl p-5 shadow-md flex flex-col justify-between"
          >
            <div class="flex items-center justify-between opacity-80">
              <span class="text-[11px] font-bold uppercase tracking-wider"
                >Laba Bersih Masuk</span
              >
              <TrendingUp :size="18" />
            </div>
            <div class="my-1">
              <h2 class="text-2xl font-black tracking-tight">
                {{ formatRupiah(summary?.totalRealizedProfit || 0) }}
              </h2>
              <p class="text-[10px] text-white/70 mt-0.5">
                Potensi total margin:
                {{ formatRupiah(summary?.totalExpectedProfit || 0) }}
              </p>
            </div>
            <div
              class="text-[10px] text-white/80 border-t border-white/10 pt-1.5 flex justify-between"
            >
              <span>Rata-rata Margin:</span>
              <b>{{ summary?.averageProfitMarginPercent || 0 }}%</b>
            </div>
          </div>
          <!-- KARTU 1: MODAL DIGELONTORKAN -->
          <div
            class="bg-white rounded-3xl p-5 shadow-md flex flex-col justify-between"
          >
            <div class="flex items-center justify-between opacity-80">
              <span class="text-[11px] font-bold uppercase tracking-wider"
                >Total Modal Keluar</span
              >
              <ShoppingCart :size="18" />
            </div>
            <div class="my-1">
              <h2 class="text-2xl font-black tracking-tight">
                {{ formatRupiah(summary?.totalDisbursedCapital || 0) }}
              </h2>
            </div>
            <div
              class="text-[10px] border-t border-white/10 pt-1.5 flex justify-between"
            >
              <span>Pengeluaran pokok</span>
            </div>
          </div>

          <div
            class="bg-white rounded-3xl p-5 shadow-md flex flex-col justify-between"
          >
            <div class="flex items-center justify-between opacity-80">
              <span class="text-[11px] font-bold uppercase tracking-wider"
                >Pembayaran Masuk</span
              >
              <SquareArrowUpRight :size="18" />
            </div>
            <div class="my-1">
              <h2 class="text-2xl font-black tracking-tight">
                {{ formatRupiah(summary?.totalReturnedCapital || 0) }}
              </h2>
            </div>
            <div
              class="text-[10px] border-t border-white/10 pt-1.5 flex justify-between"
            >
              <p class="text-[10px] text-slate-400 mt-0.5">
                Sisa pokok di luar:
                <b class="text-amber-700">{{
                  formatRupiah(summary?.totalOutstandingCapital || 0)
                }}</b>
              </p>
            </div>
          </div>

          <!-- KARTU 4: PEMBAGIAN JALUR KAS MASUK (CASH VS TRANSFER) -->
          <div
            class="bg-debt-dim to-debt-dark text-debt-dark rounded-3xl p-5 shadow-md flex flex-col justify-between"
          >
            <div class="flex items-center justify-between opacity-80">
              <span class="text-[11px] font-bold uppercase tracking-wider"
                >Sisa Pokok</span
              >
              <TrendingUp :size="18" />
            </div>
            <div class="my-1">
              <h2 class="text-2xl font-black tracking-tight">
                {{ formatRupiah(summary?.totalOutstandingCapital || 0) }}
              </h2>
            </div>
            <div
              class="text-[10px] text-debt-dark border-t border-white/10 pt-1.5 flex justify-between"
            >
              <span>Sisa uang belum di bayar</span>
            </div>
          </div>
        </div>
        <div class="bg-debt-dark rounded-xl p-5 shadow space-y-2 mt-3">
          <div class="flex lg:flex-row flex-col  lg:justify-between justify-start text-white">
            <span> Pembayaran </span>
            <div class="flex items-center justify-between">
              <span class="flex items-center gap-1.5 text-white font-medium">
                <Wallet :size="14" class="text-white" />
                Tunai
              </span>
              <b class="text-white 0 px-2">{{
                formatRupiah(summary?.cashInflowCash || 0)
              }}</b>
            </div>
            <div class="flex items-center justify-between">
              <span class="flex items-center gap-1.5 text-white font-medium">
                <CreditCard :size="14" class="text-white" />
                Transfer & QRIS
              </span>
              <b class="text-white px-2">{{
                formatRupiah(summary?.cashInflowTransfer || 0)
              }}</b>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div
      class="bg-white border border-debt-grey/80 rounded-3xl p-6 shadow-2xs space-y-5"
    >
      <!-- Header Filter Penagihan -->
      <div
        class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-debt-grey/50"
      >
        <div>
          <div class="flex lg:flex-row flex-col items-center gap-2">
            <h2 class="text-base font-bold text-debt-dark">
              Daftar Tagihan Jatuh Tempo
            </h2>
            <span
              class="px-2.5  rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200"
            >
              {{ dueInstallments.length }} Pelanggan Belum Bayar
            </span>
          </div>
          <p class="text-xs text-slate-400 lg:mt-1 mt-3">
            Total tagihan yang harus dibayar:
            <b class="text-debt text-sm">{{ formatRupiah(totalDueAmount) }}</b>
          </p>
        </div>

        <!-- Tombol Filter Cepat -->
        <div
          class="flex items-center bg-debt-container p-1 rounded-xl text-xs font-bold"
        >
          <button
            type="button"
            @click="handleFilterChange('current_month')"
            :class="[
              'px-3.5 py-1.5 rounded-lg transition text-[11px] cursor-pointer flex items-center gap-1.5',
              overdueFilter === 'current_month'
                ? 'bg-debt text-white shadow-2xs'
                : 'text-slate-600 hover:text-debt',
            ]"
          >
            <Clock :size="13" />
            <span>Jatuh Tempo Bulan Ini</span>
          </button>
          <button
            type="button"
            @click="handleFilterChange('past_overdue')"
            :class="[
              'px-3.5 py-1.5 rounded-lg transition text-[11px] cursor-pointer flex items-center gap-1.5',
              overdueFilter === 'past_overdue'
                ? 'bg-rose-700 text-white shadow-2xs'
                : 'text-rose-700 hover:bg-rose-50',
            ]"
          >
            <AlertTriangle :size="13" />
            <span>Tunggakan Bulan-Bulan Lalu</span>
          </button>
        </div>
      </div>

      <!-- Tabel Daftar Orang yang Harus Ditagih -->
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs">
          <thead
            class="bg-debt-container/50 text-black uppercase text-xs font-bold"
          >
            <tr>
              <th class="py-3 px-4 rounded-l-xl">Pelanggan</th>
              <th class="py-3 px-4">Barang Kredit</th>
              <th class="py-3 px-4">Angsuran</th>
              <th class="py-3 px-4">Jatuh Tempo</th>
              <th class="py-3 px-4">Status & Telat</th>
              <th class="py-3 px-4 text-right">Nominal Tagihan</th>
              <th class="py-3 px-4 text-center rounded-r-xl">Aksi Kasir</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-debt-grey/40">
            <!-- Loading -->
            <template v-if="isLoadingDue">
              <tr v-for="i in 3" :key="i" class="animate-pulse">
                <td colspan="7" class="py-4 px-4 bg-slate-50/50"></td>
              </tr>
            </template>

            <!-- Ada Data -->
            <template v-else-if="dueInstallments.length > 0">
              <tr
                v-for="item in dueInstallments"
                :key="item.scheduleId"
                class="hover:bg-debt-dim/40 transition"
              >
                <!-- Pelanggan -->
                <td class="py-3.5 px-4">
                  <div class="flex items-center gap-2.5">
                    <div
                      class="w-8 h-8 rounded-full bg-debt-container text-debt font-bold text-xs flex items-center justify-center shrink-0"
                    >
                      {{ item.customerName.charAt(0) }}
                    </div>
                    <div>
                      <span class="font-bold text-slate-800 block">{{
                        item.customerName
                      }}</span>
                    </div>
                  </div>
                </td>

                <!-- Barang -->
                <td class="py-3.5 px-4 font-semibold text-slate-700">
                  <div class="flex items-center gap-1.5">
                    <Package :size="13" class="text-debt" />
                    <span>{{ item.itemName }}</span>
                  </div>
                  <span class="text-[10px] font-mono text-slate-400 block">{{
                    item.contractNumber
                  }}</span>
                </td>

                <!-- Angsuran Ke-X -->
                <td class="py-3.5 px-4 font-bold text-slate-800">
                  Bulan Ke-{{ item.installmentNumber }} / {{ item.tenorMonths }}
                </td>

                <!-- Jatuh Tempo -->
                <td class="py-3.5 px-4 text-slate-600">
                  {{ formatDate(item.dueDate) }}
                </td>

                <!-- Status Keterlambatan -->
                <td class="py-3.5 px-4">
                  <span
                    v-if="item.isOverdue"
                    class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 inline-flex items-center gap-1"
                  >
                    <AlertTriangle :size="11" />
                    Telat {{ item.daysOverdue }} Hari
                  </span>
                  <span
                    v-else
                    class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 inline-flex items-center gap-1"
                  >
                    <Clock :size="11" />
                    Belum Bayar
                  </span>
                </td>

                <!-- Nominal Tagihan -->
                <td class="py-3.5 px-4 text-right font-black text-sm text-debt">
                  {{ formatRupiah(item.amount) }}
                </td>

                <!-- Tombol Bayar -->
                <td class="py-3.5 px-4 text-center">
                  <button
                    type="button"
                    @click="openPayModal(item)"
                    class="h-8 px-3 bg-debt hover:bg-[#68001a] text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition shadow-2xs cursor-pointer"
                  >
                    <Wallet :size="13" />
                    <span>Bayar</span>
                  </button>
                </td>
              </tr>
            </template>

            <!-- State Kosong (Semua Sudah Lunas) -->
            <tr v-else>
              <td colspan="7" class="py-12 text-center text-slate-400">
                <CheckCircle2
                  :size="32"
                  class="text-emerald-500 mx-auto mb-2"
                />
                <h3 class="text-sm font-bold text-slate-700">
                  Tidak Ada Tagihan Tertunggak
                </h3>
                <p class="text-xs text-slate-400 mt-0.5">
                  {{
                    overdueFilter === "current_month"
                      ? "Semua tagihan jatuh tempo bulan ini sudah terbayar."
                      : "Tidak ada tunggakan dari bulan-bulan sebelumnya!"
                  }}
                </p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal Dialog Pilih Metode Pembayaran (Cash/QRIS/Transfer) -->
    <PayScheduleModal
      :show="showPayModal"
      :schedule="
        activeDueItem
          ? {
              id: activeDueItem.scheduleId,
              installmentNumber: activeDueItem.installmentNumber,
              amount: activeDueItem.amount,
              dueDate: activeDueItem.dueDate,
            }
          : null
      "
      :item-name="activeDueItem?.itemName"
      :customer-name="activeDueItem?.customerName"
      @close="showPayModal = false"
      @confirm="handleConfirmPayment"
    />
  </div>
</template>
