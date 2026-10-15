<!-- pages/installments/index.vue -->
<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { storeToRefs } from "pinia";
import {
  useInstallmentStore,
  type InstallmentContractResponse,
  type InstallmentScheduleResponse,
} from "~/stores/installment";
import { useDebtStore } from "~/stores/debt";
import {
  Receipt,
  CheckCircle2,
  CreditCard,
  RefreshCw,
  Search,
  PlusCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-vue-next";

import CustomerInstallmentCard, {
  type CustomerGroupedInstallment,
} from "~/components/installment/CustomerInstallmentCard.vue";
import ScheduleDrawer from "~/components/installment/ScheduleDrawer.vue";
import PayScheduleModal from "~/components/installment/PayScheduleModal.vue";

const router = useRouter();
const installmentStore = useInstallmentStore();
const debtStore = useDebtStore();
const { contracts, selectedContract, isLoading } =
  storeToRefs(installmentStore);

const searchQuery = ref("");
const statusFilter = ref<"all" | "active" | "completed">("all");

// Drawer State
const showDrawer = ref(false);

// Modal Bayar State
const showPayModal = ref(false);
const scheduleToPay = ref<InstallmentScheduleResponse | null>(null);

// Pagination State
const currentPage = ref(1);
const itemsPerPage = 6; // 6 kartu pelanggan per halaman

const formatRupiah = (val: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(val || 0);
};

onMounted(async () => {
  if (debtStore.debts.length === 0) {
    await debtStore.fetchDebts("all");
  }
  await installmentStore.fetchContracts();
});

const getCustomerName = (customerId: number) => {
  const cust = debtStore.debts.find((d) => d.customerId === customerId);
  return cust?.customerName || `Customer #${customerId}`;
};

// Pengelompokan Kontrak per Pelanggan
const groupedByCustomer = computed<CustomerGroupedInstallment[]>(() => {
  const groups: Record<number, CustomerGroupedInstallment> = {};

  for (const c of contracts.value) {
    // 1. Inisialisasi jika belum ada
    if (!groups[c.customerId]) {
      groups[c.customerId] = {
        customerId: c.customerId,
        customerName: getCustomerName(c.customerId),
        contracts: [],
        totalRemaining: 0,
        totalMonthlyBill: 0,
        activeCount: 0,
        completedCount: 0
      };
    }

    // 2. Simpan ke variabel lokal agar TypeScript tahu ini tidak undefined
    const group = groups[c.customerId];
    if (!group) continue;

    // 3. Lakukan manipulasi data lewat variabel 'group'
    group.contracts.push(c);

    const remaining = (c.schedules || [])
      .filter(s => s.status !== 'paid')
      .reduce((acc, s) => acc + Number(s.amount || 0), 0);

    group.totalRemaining += remaining;

    if (c.status === 'active') {
      group.activeCount++;
      group.totalMonthlyBill += Number(c.monthlyInstallment || 0);
    } else {
      group.completedCount++;
    }
  }

  return Object.values(groups);
});
// Filter
const filteredGroups = computed(() => {
  let list = groupedByCustomer.value;

  if (statusFilter.value === "active") {
    list = list.filter((g) => g.activeCount > 0);
  } else if (statusFilter.value === "completed") {
    list = list.filter((g) => g.activeCount === 0 && g.completedCount > 0);
  }

  if (!searchQuery.value.trim()) return list;
  const q = searchQuery.value.toLowerCase();

  return list.filter(
    (g) =>
      g.customerName.toLowerCase().includes(q) ||
      g.customerId.toString().includes(q) ||
      g.contracts.some(
        (c) =>
          c.itemName.toLowerCase().includes(q) ||
          c.contractNumber.toLowerCase().includes(q),
      ),
  );
});

// Pagination
const totalPages = computed(
  () => Math.ceil(filteredGroups.value.length / itemsPerPage) || 1,
);
const paginatedGroups = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  return filteredGroups.value.slice(start, start + itemsPerPage);
});

const goToPage = (page: number) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page;
  }
};

// 1. Aksi Buka Drawer Jadwal Angsuran
const handleOpenScheduleDrawer = (contract: InstallmentContractResponse) => {
  installmentStore.fetchContractById(contract.id);
  showDrawer.value = true;
};

// 2. Aksi Buka Halaman Detail Riwayat Kontrak
const handleViewCustomerDetail = (customerId: number) => {
  router.push(`/installments/customer/${customerId}`);
};

// 3. Aksi Buka Modal Pilihan Metode Bayar
const handleOpenPayModal = (schedule: InstallmentScheduleResponse) => {
  scheduleToPay.value = schedule;
  showPayModal.value = true;
};

// 4. Konfirmasi Bayar
const handleConfirmPayment = async (payload: {
  scheduleId: number;
  paymentMethod: string;
}) => {
  showPayModal.value = false;
  const res = await installmentStore.paySchedule(
    payload.scheduleId,
    payload.paymentMethod,
  );
  if (res.success) {
    alert(`Pembayaran angsuran berhasil via ${payload.paymentMethod}!`);
  } else {
    alert(res.message);
  }
};

// Summary Metrik
const totalActiveContracts = computed(
  () => contracts.value.filter((c) => c.status === "active").length,
);
const totalRemainingReceivable = computed(() => {
  return contracts.value.reduce((acc, c) => {
    return (
      acc +
      (c.schedules || [])
        .filter((s) => s.status !== "paid")
        .reduce((sum, s) => sum + Number(s.amount || 0), 0)
    );
  }, 0);
});
const totalCompletedContracts = computed(
  () => contracts.value.filter((c) => c.status === "completed").length,
);
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div
      class="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
    >
      <div>
        <h1 class="text-3xl font-bold text-debt-dark tracking-wider">
          Manajemen Kontrak Cicilan
        </h1>
        <p class="text-xs text-slate-500 mt-0.5">
          Kelola perjanjian kredit tenor per pelanggan toko
        </p>
      </div>

      <div class="flex items-center gap-2.5">

        <NuxtLink
          to="/installments/create"
          class="h-10 px-4 bg-debt hover:bg-[#66001a] text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition active:scale-95 cursor-pointer"
        >
          <PlusCircle :size="16" />
          <span>Buat Kontrak Baru</span>
        </NuxtLink>
      </div>
    </div>

    <!-- Metrik KPI -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div
        class="bg-white border border-debt-grey/80 rounded-2xl p-4 shadow-2xs flex items-center justify-between"
      >
        <div>
          <span
            class="text-[11px] font-bold text-slate-400 uppercase tracking-wider block"
            >Kontrak Berjalan</span
          >
          <span class="text-xl font-black text-debt-dark mt-0.5 block"
            >{{ totalActiveContracts }} Kontrak</span
          >
        </div>
        <div
          class="w-10 h-10 rounded-xl bg-debt/10 text-debt flex items-center justify-center"
        >
          <Receipt :size="20" />
        </div>
      </div>

      <div
        class="bg-white border border-debt-grey/80 rounded-2xl p-4 shadow-2xs flex items-center justify-between"
      >
        <div>
          <span
            class="text-[11px] font-bold text-slate-400 uppercase tracking-wider block"
            >Sisa Pokok Angsuran</span
          >
          <span class="text-xl font-black text-amber-700 mt-0.5 block">{{
            formatRupiah(totalRemainingReceivable)
          }}</span>
        </div>
        <div
          class="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center"
        >
          <CreditCard :size="20" />
        </div>
      </div>

      <div
        class="bg-white border border-debt-grey/80 rounded-2xl p-4 shadow-2xs flex items-center justify-between"
      >
        <div>
          <span
            class="text-[11px] font-bold text-slate-400 uppercase tracking-wider block"
            >Kontrak Lunas</span
          >
          <span class="text-xl font-black text-emerald-700 mt-0.5 block"
            >{{ totalCompletedContracts }} Kontrak</span
          >
        </div>
        <div
          class="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center"
        >
          <CheckCircle2 :size="20" />
        </div>
      </div>
    </div>

    <!-- Search & Filter Bar -->
    <div
      class="flex flex-col sm:flex-row items-center justify-between gap-3  p-3  rounded-2xl shadow-2xs"
    >
      <div class="relative w-full sm:w-80">
        <Search
          :size="16"
          class="absolute left-3.5 top-1/2 -translate-y-1/2 text-debt-dark pointer-events-none"
        />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Cari pelanggan / barang / nomor kontrak..."
          class="w-full h-9 pl-9 pr-3 bg-white border border-debt-dark rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-debt transition"
        />
      </div>

      <div
        class="flex items-center bg-debt-container p-1 rounded-xl text-xs font-bold w-full sm:w-auto justify-center"
      >
        <button
          type="button"
          @click="
            statusFilter = 'all';
            currentPage = 1;
          "
          :class="[
            'px-3.5 py-1.5 rounded-lg transition text-[11px] cursor-pointer',
            statusFilter === 'all'
              ? 'bg-debt text-white shadow-2xs'
              : 'text-slate-600 hover:text-debt',
          ]"
        >
          Semua
        </button>
        <button
          type="button"
          @click="
            statusFilter = 'active';
            currentPage = 1;
          "
          :class="[
            'px-3.5 py-1.5 rounded-lg transition text-[11px] cursor-pointer',
            statusFilter === 'active'
              ? 'bg-debt text-white shadow-2xs'
              : 'text-slate-600 hover:text-debt',
          ]"
        >
          Ada Cicilan Aktif
        </button>
        <button
          type="button"
          @click="
            statusFilter = 'completed';
            currentPage = 1;
          "
          :class="[
            'px-3.5 py-1.5 rounded-lg transition text-[11px] cursor-pointer',
            statusFilter === 'completed'
              ? 'bg-debt text-white shadow-2xs'
              : 'text-slate-600 hover:text-debt',
          ]"
        >
          Semua Lunas
        </button>
      </div>
    </div>

    <!-- GRID KARTU PER PELANGGAN -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      <template v-if="paginatedGroups.length > 0">
        <CustomerInstallmentCard
          v-for="group in paginatedGroups"
          :key="group.customerId"
          :group="group"
          @open-schedule="handleOpenScheduleDrawer"
          @view-detail="handleViewCustomerDetail"
        />
      </template>

      <div
        v-else
        class="col-span-full py-16 text-center text-slate-400 bg-white rounded-3xl border border-debt-grey"
      >
        <Receipt :size="36" class="mx-auto text-slate-300 mb-2" />
        <h3 class="text-sm font-bold text-slate-700">Tidak Ada Data Cicilan</h3>
        <p class="text-xs text-slate-400 max-w-sm mx-auto mt-0.5">
          Belum ada kesepakatan cicilan yang cocok dengan pencarian atau filter
          ini.
        </p>
      </div>
    </div>

    <!-- PAGINATION -->
    <div
      v-if="totalPages > 1"
      class="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2"
    >
      <span class="text-xs text-slate-500 font-medium">
        Menampilkan <b>{{ paginatedGroups.length }}</b> dari
        <b>{{ filteredGroups.length }}</b> pelanggan
      </span>

      <div class="flex items-center gap-1.5">
        <button
          type="button"
          @click="goToPage(currentPage - 1)"
          :disabled="currentPage === 1"
          class="w-9 h-9 rounded-xl border border-debt-grey bg-white hover:bg-debt-container flex items-center justify-center transition disabled:opacity-40 cursor-pointer"
        >
          <ChevronLeft :size="16" />
        </button>

        <button
          v-for="p in totalPages"
          :key="p"
          type="button"
          @click="goToPage(p)"
          :class="[
            'w-9 h-9 rounded-xl text-xs font-bold transition cursor-pointer',
            currentPage === p
              ? 'bg-debt text-white shadow-2xs'
              : 'border border-debt-grey bg-white hover:bg-debt-container text-slate-700',
          ]"
        >
          {{ p }}
        </button>

        <button
          type="button"
          @click="goToPage(currentPage + 1)"
          :disabled="currentPage === totalPages"
          class="w-9 h-9 rounded-xl border border-debt-grey bg-white hover:bg-debt-container flex items-center justify-center transition disabled:opacity-40 cursor-pointer"
        >
          <ChevronRight :size="16" />
        </button>
      </div>
    </div>

    <!-- DRAWER JADWAL ANGSURAN TENOR -->
    <ScheduleDrawer
      :show="showDrawer"
      :contract="selectedContract"
      :customer-name="
        selectedContract ? getCustomerName(selectedContract.customerId) : ''
      "
      @close="showDrawer = false"
      @pay="handleOpenPayModal"
    />

    <!-- MODAL PILIH METODE BAYAR -->
    <PayScheduleModal
      :show="showPayModal"
      :schedule="scheduleToPay"
      :item-name="selectedContract?.itemName"
      @close="showPayModal = false"
      @confirm="handleConfirmPayment"
    />
  </div>
</template>
