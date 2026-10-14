<!-- components/dashboard/RecentMutationsTable.vue -->
<script setup lang="ts">
interface MutationItem {
  id: number;
  customerId: number;
  referenceNumber: string;
  sourceType: string;
  mutationType: string;
  amount: number;
  balanceAfter: number;
  notes?: string;
  createdAt: string;
}

defineProps<{
  items: MutationItem[];
  loading?: boolean;
}>();

const formatRupiah = (val: number) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
};

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
};
</script>

<template>
  <div class="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
    <div class="p-5 border-b border-slate-100 flex items-center justify-between">
      <div>
        <h3 class="font-bold text-[15px] text-slate-900">Aktivitas & Mutasi Terkini</h3>
        <p class="text-[12px] text-slate-400">5 transaksi piutang dan cicilan terakhir</p>
      </div>
      <NuxtLink to="/debts" class="text-[12px] font-bold text-[#005d42] hover:underline">
        Lihat Semua Piutang →
      </NuxtLink>
    </div>

    <div class="overflow-x-auto">
      <table class="w-full text-left text-[13px]">
        <thead class="bg-slate-50/75 border-b border-slate-100 text-[11px] font-bold uppercase text-slate-500">
          <tr>
            <th class="px-5 py-3">Waktu</th>
            <th class="px-5 py-3">No. Referensi</th>
            <th class="px-5 py-3">Customer ID</th>
            <th class="px-5 py-3">Jenis Mutasi</th>
            <th class="px-5 py-3">Nominal</th>
            <th class="px-5 py-3">Sisa Saldo</th>
            <th class="px-5 py-3">Keterangan</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr v-for="mut in items" :key="mut.id" class="hover:bg-slate-50/50 transition">
            <td class="px-5 py-3.5 text-slate-500 whitespace-nowrap">{{ formatDate(mut.createdAt) }}</td>
            <td class="px-5 py-3.5 font-mono font-medium text-slate-700">{{ mut.referenceNumber }}</td>
            <td class="px-5 py-3.5 font-semibold text-slate-800">#{{ mut.customerId }}</td>
            <td class="px-5 py-3.5">
              <span
                :class="[
                  'px-2.5 py-1 rounded-full text-[11px] font-bold inline-flex items-center gap-1',
                  mut.mutationType === 'increase'
                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                ]"
              >
                {{ mut.mutationType === 'increase' ? '➕ Tambah Bon' : '➖ Bayar Bon' }}
              </span>
            </td>
            <td class="px-5 py-3.5 font-bold" :class="mut.mutationType === 'increase' ? 'text-rose-700' : 'text-emerald-700'">
              {{ mut.mutationType === 'increase' ? '+' : '-' }} {{ formatRupiah(mut.amount) }}
            </td>
            <td class="px-5 py-3.5 font-semibold text-slate-700">{{ formatRupiah(mut.balanceAfter) }}</td>
            <td class="px-5 py-3.5 text-slate-500 max-w-xs truncate">{{ mut.notes || '-' }}</td>
          </tr>
          <tr v-if="!items?.length && !loading">
            <td colspan="7" class="px-5 py-8 text-center text-slate-400">Belum ada riwayat mutasi piutang.</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>