<!-- components/dashboard/DueInstallmentsCard.vue -->
<script setup lang="ts">
import type { UpcomingInstallment } from "~/stores/dashboard";
import { ClockAlert } from "@lucide/vue";

defineProps<{
  items: UpcomingInstallment[];
  loading?: boolean;
}>();

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
  });
};
</script>

<template>
  <div class="bg-white border  border-debt-grey/80 rounded-3xl p-5 shadow-2xs space-y-4 h-full">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2.5">
        <div>
          <h4 class="text-md font-bold text-debt-dark">Tagihan Cicilan Bulan Ini</h4>
          <span class="text-[11px] text-debt-dark">Jatuh tempo</span>
        </div>
      </div>
      <NuxtLink to="/installments" class="text-[11px] font-bold text-debt hover:underline">
        Lihat Semua →
      </NuxtLink>
    </div>

    <!-- List 5 Tagihan -->
    <div class="bg-debt-container/50 px-2 py-1 text-xs rounded-xl shadow">
      <div
        v-for="item in items"
        :key="item.scheduleId"
        class="py-3 flex items-center justify-between gap-3 hover:bg-debt-dim/50 rounded-xl px-2 -mx-2 transition"
      >
        <!-- Info Pelanggan & Tenor -->
        <div class="flex items-center gap-3 rounded-lg">
          <div class="bg-red-100 p-2 rounded-full">
            <div class=" bg-red-500 p-1.5 rounded-full">
              <ClockAlert :size="15" class="text-white " />
            </div>
          </div>
          <div>
            <div class="font-bold text-debt-dark flex items-center gap-1.5">
              <span>{{ item.customerName || `Customer #${item.customerId}` }} </span>
            </div>
            <div class="text-[10px] mt-1">
              <span>{{ item.contractNumber }}</span>
            </div>
           
          </div>
        </div>

        <!-- Nominal & Tombol Aksi Bayar/Tagih -->
        <div class="text-right flex items-center gap-3">
          <div>
            <span class="font-black text-[13px] block" :class="item.isOverdue ? 'text-rose-700' : 'text-debt-dark'">
              {{ formatRupiah(item.amount) }}
            </span>
             <div class="text-[10px] text-debt-dark mt-0.5">
              Jatuh Tempo: <b class="text-slate-600">{{ formatDate(item.dueDate) }}</b> 
            </div>
          </div>

          <!-- <NuxtLink
            :to="`/installments?contractId=${item.contractId}`"
            class="h-7 px-2.5 bg-debt text-white rounded-lg text-[10px] font-bold flex items-center gap-1 hover:bg-[#68001a] transition shadow-2xs"
            title="Proses Pembayaran Cicilan"
          >
            <span>Bayar</span>
            <span class="material-symbols-outlined text-[13px]">arrow_forward</span>
          </NuxtLink> -->
        </div>
      </div>

      <!-- State Kosong jika tidak ada tagihan -->
      <div v-if="!items?.length && !loading" class="py-6 text-center text-debt text-xs">
        Tidak Ada Tagihan
      </div>
    </div>
  </div>
</template>