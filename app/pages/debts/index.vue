<!-- pages/debts/index.vue -->
<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { storeToRefs } from "pinia";
import { useDebtStore } from "~/stores/debt";
import AddDebtModal from "~/components/debt/AddDebtModal.vue";
import {
  Search,
  RefreshCw,
  UserX,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Eye,
  CreditCard,
  PlusCircle,
  Filter,
} from "lucide-vue-next";

import PayDebtModal from "~/components/debt/PayDebtModal.vue";

import CustomerHistoryModal from "~/components/debt/CustomerHistoryModal.vue";

const showHistoryModal = ref(false);
const selectedCustomerIdForHistory = ref<number | null>(null);

const openHistoryModal = (customerId: number) => {
  selectedCustomerIdForHistory.value = customerId;
  showHistoryModal.value = true;
};

const navigateToInstallment = (contractId: number) => {
  showHistoryModal.value = false;
  // Arahkan ke halaman cicilan dengan query contractId
  navigateTo(`/installments?contractId=${contractId}`);
};

// State modal bayar
const showPayModal = ref(false);
const selectedCustomerToPay = ref<{
  customerId: number;
  customerName: string;
  totalDebt: number;
} | null>(null);

// Fungsi membuka modal bayar saat tombol baris diklik
const openPayModal = (item: any) => {
  selectedCustomerToPay.value = {
    customerId: item.customerId,
    customerName: item.customerName || `Customer #${item.customerId}`,
    totalDebt: Number(item.totalDebt),
  };
  showPayModal.value = true;
};

const showAddModal = ref(false);

const debtStore = useDebtStore();
const { debts, isLoading, errorMessage } = storeToRefs(debtStore);

const searchQuery = ref("");
const statusFilter = ref<"all" | "unpaid" | "paid">("all");

// Ambil data pertama kali
onMounted(() => {
  debtStore.fetchDebts(statusFilter.value);
});

// Ubah filter status
const handleFilterChange = (status: "all" | "unpaid" | "paid") => {
  statusFilter.value = status;
  debtStore.fetchDebts(status);
};

// Filter client-side berdasarkan pencarian nama atau ID customer
const filteredDebts = computed(() => {
  if (!searchQuery.value.trim()) return debts.value;
  const q = searchQuery.value.toLowerCase();
  return debts.value.filter(
    (d) =>
      (d.customerName && d.customerName.toLowerCase().includes(q)) ||
      d.customerId.toString().includes(q),
  );
});

// Ringkasan metrik atas
const totalNominalPiutang = computed(() => {
  return debts.value.reduce(
    (acc, curr) => acc + Number(curr.totalDebt || 0),
    0,
  );
});

const totalPelangganNunggak = computed(() => {
  return debts.value.filter((d) => Number(d.totalDebt) > 0).length;
});

const totalPelangganLunas = computed(() => {
  return debts.value.filter((d) => Number(d.totalDebt) === 0).length;
});

const tanggalHariIni = computed(() => {
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());
});

const formatRupiah = (val: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(val || 0);
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};
</script>

<template>
  <div class="h-full">
    <!-- 1. HEADER SECTION & SUMMARY CARDS -->
    <div
      class="flex flex-col md:flex-row md:items-center justify-between gap-4"
    >
      <div>
        <h1 class="text-3xl font-bold text-debt-dark tracking-wider">
          Manajemen Data Pihutang
        </h1>
        <p class="text-xs text-debt-dark mt-0.5">
          Pantau seluruh catatan bon belanja
        </p>
      </div>
    </div>
    <div class="bg-white shadow p-4 rounded-xl mt-4">
      <div class="flex flex-col lg:flex-row  justify-between mb-6">
        <div>
          <h4 class="font-bold tracking-wider text-lg">
            Catatan Aktivitas Tagihan Harian
          </h4>
          <span class="text-sm">{{ tanggalHariIni }}</span>
        </div>
        <div class="lg:mt-0 mt-3 flex items-center gap-2.5">
          <button
            type="button"
            @click="showAddModal = true"
            class="h-10 px-4 bg-debt hover:bg-[#66001a] text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition active:scale-95"
          >
            <PlusCircle :size="16" />
            <span>Tambah Bon Manual</span>
          </button>
        </div>
      </div>
      <div class="border-none lg:border-t border-debt-grey p-2 grid grid-cols-1 sm:grid-cols-4 gap-4 ">
        <div
          class="border-t border-r border-debt-grey  lg:px-1 p-3  flex items-center justify-between"
        >
          <div>
            <div class="flex space-x-5 items-center">
              <span
                class="text-sm items-center font-bold text-debt-dark uppercase tracking-wider block"
                >Total Tagihan Aktif</span
              >
            </div>
            <span
              class="text-[20px] font-black text-debt-dark tracking-tight mt-3 block"
            >
              {{ formatRupiah(totalNominalPiutang) }}
            </span>
          </div>
        </div>

        <div
          class="flex items-center justify-between border-r border-t  lg:px-1 p-3 border-debt-grey"
        >
          <div>
            <div class="flex space-x-5 items-center">
              <span
                class="text-md font-bold text-amber-700 uppercase tracking-wider block"
                >Pelanggan Nunggak</span
              >
            </div>
            <span
              class="text-xl mt-3 font-black text-amber-700 tracking-tight mt-0.5 block"
            >
              {{ totalPelangganNunggak }} Orang
            </span>
          </div>
        </div>

        <div
          class=" flex items-center justify-between  border-r border-t lg:px-1 p-3 border-debt-grey"
        >
          <div>
            <div class="flex space-x-5 items-center">
              <span
                class="text-md font-bold text-emerald-700 uppercase tracking-wider block"
                >Sudah Lunas</span
              >
            </div>

            <span
              class="text-xl font-black text-emerald-700 tracking-tight mt-3 block"
            >
              {{ totalPelangganLunas }} Orang
            </span>
          </div>
        </div>
        <div
          class=" flex items-center justify-between border-r border-t lg:px-1 p-3 border-debt-grey"
        >
          <div>
            <div class="flex space-x-5 items-center">
              <span
                class="text-md font-bold text-debt uppercase tracking-wider block"
                >TOTAL HUTANG</span
              >
            </div>

            <span
              class="text-xl font-black text-debt tracking-tight mt-3 block"
            >
            {{ debts.length }} Bon
            </span>
          </div>
        </div>
      </div>
    </div>

    <div
      v-if="errorMessage"
      class="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2"
    >
      <AlertCircle :size="16" />
      <span>{{ errorMessage }}</span>
    </div>

    <!-- 2. SEARCH & FILTER CONTROLS -->
    <div
      class="flex mt-6 flex-col sm:flex-row items-center justify-between gap-3 "
    >
      <!-- Input Search -->
      <div class="relative w-8/12 sm:w-80 ">
        <Search
          :size="16"
          class="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
        />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Cari nama pelanggan / ID..."
          class="w-full h-10 pl-9 pr-3 bg-white border-3 rounded-2xl border-debt text-xs font-semibold text-slate-800 outline-none focus:border-debt transition"
        />
      </div>

      <!-- Filter Status Tabs Pill -->
      <div
        class="flex items-center bg-debt-container p-1 rounded-xl text-xs font-bold w-full sm:w-auto justify-center"
      >
        <button
          type="button"
          @click="handleFilterChange('all')"
          :class="[
            'px-3.5 py-1.5 rounded-lg transition text-[11px]',
            statusFilter === 'all'
              ? 'bg-debt text-white shadow-2xs'
              : 'text-slate-600 hover:text-debt',
          ]"
        >
          Semua
        </button>
        <button
          type="button"
          @click="handleFilterChange('unpaid')"
          :class="[
            'px-3.5 py-1.5 rounded-lg transition text-[11px]',
            statusFilter === 'unpaid'
              ? 'bg-debt text-white shadow-2xs'
              : 'text-slate-600 hover:text-debt',
          ]"
        >
          Belum Lunas
        </button>
        <button
          type="button"
          @click="handleFilterChange('paid')"
          :class="[
            'px-3.5 py-1.5 rounded-lg transition text-[11px]',
            statusFilter === 'paid'
              ? 'bg-debt text-white shadow-2xs'
              : 'text-slate-600 hover:text-debt',
          ]"
        >
          Lunas
        </button>
      </div>
    </div>

    <!-- 3. DATA TABLE (GAYA KONTRAST DARK HEADER SESUAI GAMBAR) -->
    <div
      class="bg-white border border-debt-grey/80 rounded-3xl shadow-2xs overflow-hidden mt-6"
    >
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <!-- Dark Elegant Header -->
          <thead
            class="bg-[#2D0000] text-[#FFF9F2] text-[11px] font-bold uppercase tracking-wider"
          >
            <tr>
              <th class="py-3.5 px-5">Pelanggan</th>
              <th class="py-3.5 px-4">Update Terakhir</th>
              <th class="py-3.5 px-4">Status</th>
              <th class="py-3.5 px-5 text-right">Sisa Tagihan</th>
              <th class="py-3.5 px-5 text-center">Aksi</th>
            </tr>
          </thead>

          <tbody class="divide-y divide-debt-grey/60 text-[13px]">
            <!-- Skeleton Loading -->
            <template v-if="isLoading">
              <tr v-for="i in 5" :key="i" class="animate-pulse">
                <td class="py-4 px-5">
                  <div class="h-4 bg-slate-100 rounded-md w-36"></div>
                </td>
                <td class="py-4 px-4">
                  <div class="h-4 bg-slate-100 rounded-md w-16"></div>
                </td>
                <td class="py-4 px-4">
                  <div class="h-4 bg-slate-100 rounded-md w-24"></div>
                </td>
                <td class="py-4 px-4">
                  <div class="h-4 bg-slate-100 rounded-md w-20"></div>
                </td>
                <td class="py-4 px-5">
                  <div class="h-4 bg-slate-100 rounded-md w-28 ml-auto"></div>
                </td>
                <td class="py-4 px-5">
                  <div class="h-6 bg-slate-100 rounded-md w-16 mx-auto"></div>
                </td>
              </tr>
            </template>

            <!-- Baris Data -->
            <template v-else-if="filteredDebts.length > 0">
              <tr
                v-for="item in filteredDebts"
                :key="item.id"
                class="hover:bg-debt-dim/40 transition group"
              >
                <!-- Nama & Inisial -->
                <td class="py-3.5 px-5">
                  <div class="flex items-center gap-3">
                    <div
                      class="w-8 h-8 rounded-full bg-debt-container-high text-debt font-bold text-xs flex items-center justify-center shrink-0"
                    >
                      {{ (item.customerName || "P").charAt(0).toUpperCase() }}
                    </div>
                    <div>
                      <span class="font-bold text-debt-dark block">
                        {{
                          item.customerName || `Customer #${item.customerId}`
                        }}
                      </span>
                    </div>
                  </div>
                </td>
                <!-- Tanggal Update -->
                <td class="py-3.5 px-4 text-xs text-slate-500">
                  {{ formatDate(item.updatedAt || item.createdAt) }}
                </td>

                <!-- Status Pill -->
                <td class="py-3.5 px-4">
                  <span
                    v-if="Number(item.totalDebt) > 0"
                    class="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200 inline-flex items-center gap-1"
                  >
                    <span
                      class="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse"
                    ></span>
                    Belum Lunas
                  </span>
                  <span
                    v-else
                    class="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1"
                  >
                    <span
                      class="w-1.5 h-1.5 rounded-full bg-emerald-600"
                    ></span>
                    Lunas
                  </span>
                </td>

                <!-- Nominal Sisa Bon -->
                <td
                  class="py-3.5 px-5 text-right font-black text-sm"
                  :class="
                    Number(item.totalDebt) > 0 ? 'text-debt' : 'text-slate-400'
                  "
                >
                  {{
                    Number(item.totalDebt) > 0
                      ? formatRupiah(item.totalDebt)
                      : "Rp 0"
                  }}
                </td>

                <!-- Tombol Aksi Cepat (Detail Riwayat & Bayar) -->
                <td class="py-3.5 px-5">
                  <div class="flex items-center justify-center gap-1.5">
                    <!-- Tombol Detail / Mutasi -->
                    <NuxtLink
                      :to="`/debts/${item.customerId}`"
                      class="h-8 px-2.5 bg-debt-container hover:bg-debt-container-high text-debt-dark rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                    >
                      <Eye :size="14" />
                      <span>Riwayat</span>
                    </NuxtLink>
                    <!-- Tombol Pelunasan (Hanya jika belum lunas) -->
                    <button
                      v-if="Number(item.totalDebt) > 0"
                      type="button"
                      @click="openPayModal(item)"
                      class="h-8 px-2.5 bg-debt hover:bg-[#68001a] text-white rounded-lg text-xs font-bold flex items-center gap-1 transition shadow-2xs cursor-pointer"
                      title="Bayar Bon"
                    >
                      <CreditCard :size="14" />
                      <span>Bayar</span>
                    </button>
                  </div>
                </td>
              </tr>
            </template>

            <!-- State Data Kosong -->
            <tr v-else>
              <td colspan="6" class="py-12 text-center text-slate-400">
                <UserX :size="32" class="mx-auto mb-2 text-slate-300" />
                <p class="text-sm font-semibold text-slate-600">
                  Tidak ada data piutang ditemukan
                </p>
                <p class="text-xs text-slate-400 mt-0.5">
                  Coba gunakan kata kunci lain atau ubah filter status.
                </p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>

  <CustomerHistoryModal
    :show="showHistoryModal"
    :customer-id="selectedCustomerIdForHistory"
    @close="showHistoryModal = false"
    @view-installment="navigateToInstallment"
  />
  <PayDebtModal
    :show="showPayModal"
    :customer="selectedCustomerToPay"
    @close="showPayModal = false"
    @success="debtStore.fetchDebts(statusFilter)"
  />
  <AddDebtModal
    :show="showAddModal"
    @close="showAddModal = false"
    @success="debtStore.fetchDebts(statusFilter)"
  />
</template>
