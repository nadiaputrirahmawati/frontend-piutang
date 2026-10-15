<!-- components/installment/CustomerInstallmentCard.vue -->
<script setup lang="ts">
import { computed } from 'vue';
import { Package, Calendar, History, ArrowRight } from 'lucide-vue-next';
import type { InstallmentContractResponse } from '~/stores/installment';

export interface CustomerGroupedInstallment {
  customerId: number;
  customerName: string;
  contracts: InstallmentContractResponse[];
  totalRemaining: number;
  totalMonthlyBill: number;
  activeCount: number;
  completedCount: number;
}

const props = defineProps<{
  group: CustomerGroupedInstallment;
}>();

const emit = defineEmits<{
  (e: 'openSchedule', contract: InstallmentContractResponse): void;
  (e: 'viewDetail', customerId: number): void;
}>();

const formatRupiah = (val: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(val || 0);
};

// Sisa pokok per kontrak dari jadwal yang belum lunas
const getContractRemaining = (contract: InstallmentContractResponse) => {
  return (contract.schedules || [])
    .filter(s => s.status !== 'paid')
    .reduce((sum, s) => sum + Number(s.amount || 0), 0);
};

// Progress tenor
const getPaidProgress = (contract: InstallmentContractResponse) => {
  const paidCount = (contract.schedules || []).filter(s => s.status === 'paid').length;
  return `${paidCount}/${contract.tenorMonths} bln`;
};
</script>

<template>
  <div class="bg-white border border-debt-grey/80 rounded-3xl p-5 shadow-2xs hover:border-debt/40 transition flex flex-col justify-between space-y-4">
    <div class="space-y-4">
      <!-- 1. Header Pelanggan -->
      <div class="flex items-center justify-between pb-3 border-b border-debt-grey/50">
        <div class="flex items-center gap-2.5">
          <div class="w-9 h-9 rounded-2xl bg-debt-container-high text-debt font-black text-xs flex items-center justify-center shrink-0">
            {{ group.customerName.charAt(0).toUpperCase() }}
          </div>
          <div>
            <h3 class="font-bold text-sm text-debt-dark leading-tight">{{ group.customerName }}</h3>
          </div>
        </div>

        <span class="px-2.5 py-1 rounded-full text-[10px] font-bold bg-debt/10 text-debt border border-debt/20">
          {{ group.contracts.length }} Cicilan
        </span>
      </div>

      <!-- 2. Ringkasan Finansial Gabungan Pelanggan Ini -->
      <div class="grid grid-cols-2 gap-2 p-3 bg-debt-dim shadow-md rounded-2xl text-xs">
        <div>
          <span class="text-[10px] text-black block font-medium">Total Angsuran / Bln</span>
          <span class="font-bold text-debt-dark">{{ formatRupiah(group.totalMonthlyBill) }}</span>
        </div>
        <div class="text-right">
          <span class="text-[10px] text-slate-600 block font-medium">Total Sisa Pokok</span>
          <span class="font-black text-debt">{{ formatRupiah(group.totalRemaining) }}</span>
        </div>
      </div>

      <!-- 3. Daftar Barang Cicilan (Hanya 1 Tombol Jadwal per Barang) -->
      <div class="space-y-2">
        <span class="text-[10px] font-bold text-debt-dark uppercase tracking-wider block">
          Daftar Kontrak Barang:
        </span>

        <div 
          v-for="contract in group.contracts" 
          :key="contract.id"
          class="p-3 bg-debt-container/60 shadow-2xs rounded-2xl flex items-center justify-between gap-3"
        >
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-1.5 font-bold text-xs text-debt-dark">
              <Package :size="13" class="text-debt shrink-0" />
              <span class="truncate">{{ contract.itemName }}</span>
            </div>
            <div class="flex items-center gap-2 text-[10px] text-slate-800 font-mono mt-0.5">
              <span>{{ getPaidProgress(contract) }}</span>
              <span>•</span>
              <span class="font-bold" :class="getContractRemaining(contract) > 0 ? 'text-debt' : 'text-emerald-700'">
                Sisa: {{ getContractRemaining(contract) > 0 ? formatRupiah(getContractRemaining(contract)) : 'Lunas' }}
              </span>
            </div>
          </div>

          <!-- Tombol Tunggal per Barang: Buka Drawer Jadwal & Bayar -->
          <button
            type="button"
            @click="emit('openSchedule', contract)"
            class="h-8 px-2.5 bg-debt hover:bg-[#68001a] text-white rounded-xl text-[11px] font-bold flex items-center gap-1 transition shadow-2xs shrink-0 cursor-pointer"
            title="Lihat Jadwal Angsuran & Bayar"
          >
            <Calendar :size="12" />
            <span>Jadwal</span>
          </button>
        </div>
      </div>
    </div>

    <!-- 4. FOOTER KARTU: HANYA 1 TOMBOL DETAIL RIWAYAT UNTUK PELANGGAN INI -->
    <div class="pt-2 border-t border-debt-grey/50">
      <button
        type="button"
        @click="emit('viewDetail', group.customerId)"
        class="w-full h-10 rounded-xl bg-debt-dark hover:bg-debt-container text-white hover:text-debt border border-debt-grey text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-2xs cursor-pointer"
      >
        <History :size="14" class="text-white" />
        <span>Detail Riwayat  Cicilan </span>
        <ArrowRight :size="14" />
      </button>
    </div>
  </div>
</template>