<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  ArrowLeft,
  RefreshCw,
  Calendar,
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle2,
  Clock,
  Receipt,
  AlertCircle,
  CreditCard,
  BookmarkPlus,
  Wallet,
  FileText,
  CircleCheck,
  Package,
} from "lucide-vue-next";

const route = useRoute();
const router = useRouter();
const api = useDebtApi();

const customerId = computed(() => route.params.id);

const historyData = ref<any>(null);
const isLoading = ref(true);
const errorMessage = ref<string | null>(null);

const formatRupiah = (val: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(val || 0);
};

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const fetchHistory = async () => {
  if (!customerId.value) return;
  isLoading.value = true;
  errorMessage.value = null;

  try {
    const res = await api.get(`/debt/customers/${customerId.value}/history`);
    historyData.value = res.data;
  } catch (err: any) {
    errorMessage.value =
      err.response?.data?.message || "Gagal memuat buku riwayat pelanggan.";
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  fetchHistory();
});

// Hitung total akumulasi seluruh mutasi
const totalAllAdded = computed(() => {
  if (!historyData.value?.monthlyGroups) return 0;
  return historyData.value.monthlyGroups.reduce(
    (acc: number, g: any) => acc + Number(g.totalAdded || 0),
    0,
  );
});

const totalAllPaid = computed(() => {
  if (!historyData.value?.monthlyGroups) return 0;
  return historyData.value.monthlyGroups.reduce(
    (acc: number, g: any) => acc + Number(g.totalPaid || 0),
    0,
  );
});

// Pisahkan Bulan Sekarang (Item Pertama) dan Bulan-Bulan Sebelumnya
const currentMonthGroup = computed(() => {
  if (
    !historyData.value?.monthlyGroups ||
    historyData.value.monthlyGroups.length === 0
  )
    return null;
  return historyData.value.monthlyGroups[0];
});

const pastMonthGroups = computed(() => {
  if (
    !historyData.value?.monthlyGroups ||
    historyData.value.monthlyGroups.length <= 1
  )
    return [];
  return historyData.value.monthlyGroups.slice(1);
});
</script>

<template>
  <div class="space-y-6">
    <!-- 1. HEADER & TOMBOL KEMBALI -->
    <div
      class="flex items-center justify-between pb-2 border-b border-debt-grey/60"
    >
      <div class="flex items-center gap-3">
        <button
          type="button"
          @click="router.push('/debts')"
          class="w-10 h-10 rounded-2xl bg-white border border-debt-grey hover:bg-debt-container flex items-center justify-center transition shadow-2xs text-debt-dark cursor-pointer"
          title="Kembali ke Daftar Piutang"
        >
          <ArrowLeft :size="18" />
        </button>
        <div>
          <h1 class="text-xl font-bold text-debt-dark tracking-wide">
            Detail Riwayat Pelanggan
          </h1>
          <p class="text-xs text-slate-500">
            Monitoring mutasi belanja bon dan riwayat pelunasan
          </p>
        </div>
      </div>

      <button
        type="button"
        @click="fetchHistory"
        :disabled="isLoading"
        class="h-9 px-3.5 bg-white border border-debt-grey hover:bg-debt-container text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-2xs cursor-pointer disabled:opacity-50"
      >
        <RefreshCw :size="14" :class="{ 'animate-spin': isLoading }" />
        <span>Segarkan</span>
      </button>
    </div>

    <!-- Alert Error -->
    <div
      v-if="errorMessage"
      class="p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-2xl flex items-center gap-2"
    >
      <AlertCircle :size="18" />
      <span>{{ errorMessage }}</span>
    </div>

    <!-- 2. BAGIAN ATAS: RINGKASAN PELANGGAN DI SEBELAH KIRI & RIWAYAT BULAN SEKARANG DI SEBELAH KANAN -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <!-- KOLOM KIRI (5/12): KARTU TOTAL HUTANG, CICILAN & AKUMULASI -->
      <div class="lg:col-span-5 space-y-4">
        <!-- CARD PROFIL & SISA HUTANG MAROON GLOSSY -->
        <div class="bg-white rounded-2xl shadow px-2 pb-2">
          <div class="p-4 flex justify-between items-center">
            <div class="">
              <h1 class="text-2xl font-black text-debt-dark tracking-tight">
                {{ historyData?.customerName || "Memuat Pelanggan..." }}
              </h1>
              <span class="text-sm text-slate-500"
                >Kode Pelanggan : {{ customerId }}</span
              >
            </div>
            <div class="bg-gray-100 rounded-full p-3">
              <Wallet class="text-gray-500" />
            </div>
          </div>
          <div
            class="md:col-span-5 bg-debt text-white rounded-3xl p-6 shadow-md relative overflow-hidden flex flex-col justify-between min-h-[190px]"
          >
            <div class="flex items-center justify-between z-10">
              <div class="flex items-center gap-2">
                <CreditCard :size="18" class="opacity-80" />
                <span
                  class="font-bold text-xs tracking-wider uppercase opacity-80"
                  >Sisa Tagihan Toko</span
                >
              </div>
            </div>

            <div class="z-10 my-2">
              <span class="text-[11px] text-white/70 block"
                >Total Kewajiban Belum Terbayar</span
              >
              <h2 class="text-3xl font-black tracking-tight mt-0.5">
                {{ formatRupiah(historyData?.totalCurrentDebt || 0) }}
              </h2>
            </div>

            <div
              class="flex items-center justify-between text-[11px] font-mono text-white/70 border-t border-white/10"
            >
              <span>Status: Aktif</span>
            </div>
          </div>
        </div>

        <!-- CARD STATUS KONTRAK CICILAN & AKUMULASI DIBAGI 2 SUB-KARTU -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <!-- SUB CARD CICILAN -->
          <div
            class="bg-white border border-debt-grey/80 rounded-2xl p-4 shadow-2xs flex flex-col justify-between"
          >
            <div class="flex items-center justify-between">
              <span class="text-sm font-bold text-black tracking-wider"
                >Total Keseluruhan Hutang</span
              >
              <BookmarkPlus :size="22" class="text-debt" />
            </div>
            <div class="my-2">
              <span class="text-lg font-bold text-debt-dark block">
                {{ formatRupiah(totalAllAdded) }}
              </span>
            </div>
            <div
              class="pt-2 border-t border-debt-grey/50 text-[11px] font-bold text-debt hover:underline inline-flex items-center gap-1"
            >
              <span>Keseluruhan yang di bayar dan belum</span>
              <ArrowUpRight :size="12" />
            </div>
          </div>

          <div
            class="bg-white border border-debt-grey/80 rounded-2xl p-4 shadow-2xs flex flex-col justify-between"
          >
            <div class="flex items-center justify-between">
              <span class="text-sm font-bold text-green-800 tracking-wider"
                >Total Pembayaran</span
              >
              <CircleCheck :size="22" class="text-green-800" />
            </div>
            <div class="my-2">
              <span class="text-lg font-bold text-green-700 block">
                {{ formatRupiah(totalAllPaid) }}
              </span>
            </div>
            <div
              class="pt-2 border-t border-debt-grey/50 text-[11px] font-bold text-green-800 hover:underline inline-flex items-center gap-1"
            >
              <span>Yang telah di bayar</span>
              <ArrowUpRight :size="12" />
            </div>
          </div>
        </div>

        <div class="pt-4 border-t border-debt-grey/60 mt-3">
          <NuxtLink
            :to="`/installments?contractId=${historyData.activeContractId}`"
            class="h-10 w-full bg-debt hover:bg-[#68001a] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-2xs transition cursor-pointer"
            v-if="historyData?.hasActiveInstallment"
          >
            <span>Lihat Kontrak Cicilan Saya</span>
            <ArrowUpRight :size="16" />
          </NuxtLink>
          <div v-else class="h-10 w-full bg-debt-container-high text-debt-dark rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-2xs transition cursor-pointer">
            Tidak Memiliki Cicilan Aktif.
          </div>
        </div>
      </div>

      <!-- KOLOM KANAN (7/12): RIWAYAT KHUSUS BULAN SEKARANG (DILIMIT 5 & BISA DI-SCROLL) -->
      <div class="lg:col-span-7">
        <div
          class="bg-white border border-debt-grey/80 rounded-3xl p-5 shadow-2xs flex flex-col h-full"
        >
          <!-- Header Kartu Bulan Sekarang -->
          <div
            class="flex items-center justify-between pb-3 border-b border-debt-grey/60"
          >
            <div class="flex items-center gap-2.5">
              <div
                class="w-9 h-9 rounded-xl bg-debt text-white flex items-center justify-center font-bold"
              >
                <Calendar :size="18" />
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <h3 class="font-extrabold text-sm text-debt-dark">
                    {{ currentMonthGroup?.periodLabel || "Bulan Sekarang" }}
                  </h3>
                  <span
                    class="px-2 py-0.5 rounded-full bg-debt/10 text-debt font-bold text-[9px]"
                  >
                    Periode Aktif
                  </span>
                </div>
                <span class="text-[11px] text-slate-400">
                  {{ currentMonthGroup?.mutations?.length || 0 }} Transaksi
                  Terdata
                </span>
              </div>
            </div>

            <!-- Status Lunas / Belum -->
            <span
              v-if="currentMonthGroup?.isMonthSettled"
              class="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1"
            >
              <CheckCircle2 :size="12" /> Lunas
            </span>
            <span
              v-else
              class="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 inline-flex items-center gap-1"
            >
              <Clock :size="12" /> Ada Tunggakan
            </span>
          </div>

          <!-- Total Bon vs Bayar Bulan Ini -->
          <div
            class="grid grid-cols-2 gap-3 my-3 p-2.5 bg-debt-container/40 rounded-2xl text-xs"
          >
            <div>
              <span
                class="text-[10px] text-debt-dark font-bold uppercase tracking-wider block"
                >Bon Baru Bulan Ini</span
              >
              <span class="text-sm font-black text-rose-700 mt-0.5 block">
                +{{ formatRupiah(currentMonthGroup?.totalAdded || 0) }}
              </span>
            </div>
            <div class="text-right">
              <span
                class="text-[10px] text-debt-dark font-bold uppercase tracking-wider block"
                >Pembayaran Masuk</span
              >
              <span class="text-sm font-black text-emerald-700 mt-0.5 block">
                -{{ formatRupiah(currentMonthGroup?.totalPaid || 0) }}
              </span>
            </div>
            <span class="text-[12px]">Data Pembayaran Ini Merupakan Akumulasi Hutang Dan Cicilan</span>
          </div>

          <!-- List Item Transaksi (Tinggi dibatasi ~5 baris, sisanya di-scroll) -->
          <div
            class="max-h-[300px] overflow-y-auto pr-1 space-y-2 divide-y divide-debt-grey/40"
          >
            <div
              v-for="mut in currentMonthGroup?.mutations || []"
              :key="mut.id"
              class="pt-2 flex items-center justify-between gap-3 text-xs"
            >
              <div class="flex items-center gap-2.5 min-w-0">
                <div
                  :class="[
                    'w-7 h-7 rounded-lg flex items-center justify-center shrink-0',
                    mut.mutationType === 'increase'
                      ? 'bg-rose-50 text-rose-700'
                      : 'bg-emerald-50 text-emerald-700',
                  ]"
                >
                  <ArrowUpRight
                    :size="15"
                    v-if="mut.mutationType === 'increase'"
                  />
                  <ArrowDownLeft :size="15" v-else />
                </div>
                <div class="truncate">
                  <p class="font-bold text-slate-800 leading-tight truncate">
                    {{
                      mut.notes ||
                      (mut.mutationType === "increase"
                        ? "Belanja Kasir (Bon)"
                        : "Pembayaran Tagihan")
                    }}
                  </p>
                  <span class="text-[10px] text-slate-400 font-mono">
                    {{ formatDate(mut.createdAt) }} • {{ mut.referenceNumber }}
                  </span>
                </div>
              </div>

              <div class="text-right shrink-0">
                <span
                  class="font-black text-xs block"
                  :class="
                    mut.mutationType === 'increase'
                      ? 'text-rose-700'
                      : 'text-emerald-700'
                  "
                >
                  {{ mut.mutationType === "increase" ? "+" : "-"
                  }}{{ formatRupiah(mut.amount) }}
                </span>
                <span class="text-[10px] text-slate-400 block">
                  Sisa:
                  <b class="text-slate-600">{{
                    mut.balanceAfter === 0
                      ? "Lunas"
                      : formatRupiah(mut.balanceAfter)
                  }}</b>
                </span>
              </div>
            </div>

            <!-- Jika bulan sekarang belum ada transaksi -->
            <div
              v-if="!currentMonthGroup?.mutations?.length"
              class="py-12 text-center text-slate-400 text-xs"
            >
              Belum ada transaksi di bulan ini.
            </div>
          </div>

          <div
            v-if="(currentMonthGroup?.mutations?.length || 0) > 5"
            class="pt-2 border-t border-debt-grey/40 text-[10px] text-center text-slate-400"
          >
            Gulir / scroll ke bawah untuk melihat transaksi lainnya
          </div>
        </div>
      </div>
    </div>

    <!-- 3. BAGIAN BAWAH: DAFTAR KARTU BULAN-BULAN SEBELUMNYA (ARSIP RIWAYAT) -->
    <div class="space-y-4 pt-4 border-t border-debt-grey/60">
      <div>
        <h2 class="text-base font-bold text-debt-dark">
          Arsip Riwayat Bulan Sebelumnya
        </h2>
        <p class="text-xs text-slate-400">
          Daftar rekapitulasi mutasi dan pembukuan pada periode lampau
        </p>
      </div>

      <!-- Loading State -->
      <div
        v-if="isLoading"
        class="py-16 text-center text-slate-400 bg-white rounded-3xl border border-debt-grey"
      >
        <RefreshCw :size="24" class="animate-spin text-debt mx-auto mb-2" />
        <span class="text-xs font-semibold">Mengambil data mutasi...</span>
      </div>

      <!-- GRID KARTU PER BULAN SEBELUMNYA -->
      <div
        v-else-if="pastMonthGroups.length > 0"
        class="grid grid-cols-1 lg:grid-cols-2 gap-5"
      >
        <div
          v-for="group in pastMonthGroups"
          :key="`${group.year}-${group.month}`"
          class="bg-white border border-debt-grey/80 rounded-3xl p-5 shadow-2xs flex flex-col justify-between hover:border-debt/40 transition"
        >
          <!-- Header Kartu Bulan -->
          <div
            class="flex items-center justify-between pb-3 border-b border-debt-grey/60"
          >
            <div class="flex items-center gap-2.5">
              <div
                class="w-8 h-8 rounded-xl bg-debt-container text-debt flex items-center justify-center font-bold"
              >
                <Calendar :size="16" />
              </div>
              <div>
                <h3 class="font-extrabold text-sm text-debt-dark">
                  {{ group.periodLabel }}
                </h3>
                <span class="text-[10px] text-slate-400">
                  {{ group.mutations?.length || 0 }} Transaksi Terdata
                </span>
              </div>
            </div>

            <!-- Status Lunas / Belum -->
            <span
              v-if="group.isMonthSettled"
              class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1"
            >
              <CheckCircle2 :size="11" /> Lunas
            </span>
            <span
              v-else
              class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 inline-flex items-center gap-1"
            >
              <Clock :size="11" /> Ada Tunggakan
            </span>
          </div>

          <!-- Total Bon vs Bayar di Bulan Ini -->
          <div
            class="grid grid-cols-2 gap-3 my-3 p-2.5 bg-debt-container/40 rounded-2xl text-xs"
          >
            <div>
              <span
                class="text-[10px] text-slate-400 font-bold uppercase tracking-wider block"
                >Bon Baru</span
              >
              <span class="text-sm font-black text-rose-700 mt-0.5 block">
                +{{ formatRupiah(group.totalAdded) }}
              </span>
            </div>
            <div class="text-right">
              <span
                class="text-[10px] text-slate-400 font-bold uppercase tracking-wider block"
                >Pembayaran</span
              >
              <span class="text-sm font-black text-emerald-700 mt-0.5 block">
                -{{ formatRupiah(group.totalPaid) }}
              </span>
            </div>
          </div>

          <!-- List Item Transaksi pada Bulan Tersebut (Dibatasi tinggi & bisa di-scroll) -->
          <div
            class="max-h-[260px] overflow-y-auto pr-1 space-y-2 divide-y divide-debt-grey/40 flex-1"
          >
            <div
              v-for="mut in group.mutations"
              :key="mut.id"
              class="pt-2 flex items-center justify-between gap-3 text-xs"
            >
              <div class="flex items-center gap-2.5 min-w-0">
                <div
                  :class="[
                    'w-6 h-6 rounded-md flex items-center justify-center shrink-0',
                    mut.mutationType === 'increase'
                      ? 'bg-rose-50 text-rose-700'
                      : 'bg-emerald-50 text-emerald-700',
                  ]"
                >
                  <ArrowUpRight
                    :size="13"
                    v-if="mut.mutationType === 'increase'"
                  />
                  <ArrowDownLeft :size="13" v-else />
                </div>
                <div class="truncate">
                  <p class="font-bold text-slate-800 leading-tight truncate">
                    {{
                      mut.notes ||
                      (mut.mutationType === "increase"
                        ? "Belanja Kasir (Bon)"
                        : "Pembayaran Tagihan")
                    }}
                  </p>
                  <span class="text-[10px] text-slate-400 font-mono">
                    {{ formatDate(mut.createdAt) }}
                  </span>
                </div>
              </div>

              <div class="text-right shrink-0">
                <span
                  class="font-black text-xs block"
                  :class="
                    mut.mutationType === 'increase'
                      ? 'text-rose-700'
                      : 'text-emerald-700'
                  "
                >
                  {{ mut.mutationType === "increase" ? "+" : "-"
                  }}{{ formatRupiah(mut.amount) }}
                </span>
                <span class="text-[10px] text-slate-400 block">
                  Sisa:
                  <b class="text-slate-600">{{
                    mut.balanceAfter === 0
                      ? "Lunas"
                      : formatRupiah(mut.balanceAfter)
                  }}</b>
                </span>
              </div>
            </div>
          </div>

          <div
            v-if="(group.mutations?.length || 0) > 4"
            class="pt-2 border-t border-debt-grey/40 text-[9px] text-center text-slate-400"
          >
            Daftar dapat digulir / di-scroll
          </div>
        </div>
      </div>

      <!-- Jika tidak ada bulan-bulan lampau -->
      <div
        v-else-if="!isLoading"
        class="p-8 text-center text-slate-400 bg-white rounded-3xl border border-debt-grey text-xs"
      >
        <FileText :size="28" class="mx-auto mb-1.5 text-slate-300" />
        Belum ada catatan mutasi dari bulan-bulan sebelumnya.
      </div>
    </div>
  </div>
</template>
