<!-- components/installment/PayScheduleModal.vue -->
<script setup lang="ts">
import { ref } from 'vue';
import { X, Wallet, CheckCircle2 } from 'lucide-vue-next';
import type { InstallmentScheduleResponse } from '~/stores/installment';

const props = defineProps<{
  show: boolean;
  schedule: InstallmentScheduleResponse | null;
  itemName?: string;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'confirm', payload: { scheduleId: number; paymentMethod: string }): void;
}>();

const paymentMethod = ref<'Cash' | 'QRIS' | 'Transfer'>('Cash');

const formatRupiah = (val: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(val || 0);
};

const handleConfirm = () => {
  if (!props.schedule) return;
  emit('confirm', {
    scheduleId: props.schedule.id,
    paymentMethod: paymentMethod.value
  });
};
</script>

<template>
  <Teleport to="body">
    <div
      v-if="show"
      class="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
      @click.self="emit('close')"
    >
      <div class="w-full max-w-sm bg-white rounded-3xl border border-debt-grey shadow-2xl overflow-hidden flex flex-col z-[121]">
        <!-- Header Modal -->
        <div class="px-5 py-4 bg-debt text-white flex items-center justify-between">
          <div class="flex items-center gap-2">
            <Wallet :size="18" class="text-white/80" />
            <h3 class="text-sm font-bold">Pilih Pembayaran Angsuran</h3>
          </div>
          <button type="button" @click="emit('close')" class="text-white/70 hover:text-white transition cursor-pointer">
            <X :size="18" />
          </button>
        </div>

        <div class="p-5 space-y-4">
          <!-- Rincian Tagihan -->
          <div class="p-3.5 bg-debt-container/50 rounded-2xl space-y-1.5 text-xs">
            <div class="flex justify-between text-slate-500">
              <span>Barang / Item:</span>
              <b class="text-debt-dark">{{ itemName || 'Barang Cicilan' }}</b>
            </div>
            <div class="flex justify-between text-slate-500">
              <span>Tagihan Bulan Ke:</span>
              <b class="text-debt-dark">#{{ schedule?.installmentNumber }}</b>
            </div>
            <div class="flex justify-between text-slate-500 pt-1.5 border-t border-debt-grey/40">
              <span>Total Bayar:</span>
              <b class="text-base font-black text-debt">{{ formatRupiah(schedule?.amount || 0) }}</b>
            </div>
          </div>

          <!-- Pilihan Metode Pembayaran -->
          <div>
            <label class="block text-[11px] font-bold text-slate-700 uppercase mb-2">Metode Pembayaran</label>
            <div class="grid grid-cols-3 gap-2">
              <button
                v-for="method in (['Cash', 'QRIS', 'Transfer'] as const)"
                :key="method"
                type="button"
                @click="paymentMethod = method"
                :class="[
                  'py-2.5 rounded-xl text-xs font-bold transition border cursor-pointer',
                  paymentMethod === method
                    ? 'bg-debt text-white border-debt shadow-2xs'
                    : 'bg-white border-debt-grey text-slate-700 hover:bg-debt-container'
                ]"
              >
                {{ method }}
              </button>
            </div>
          </div>

          <!-- Tombol Aksi -->
          <div class="flex items-center gap-2 pt-2">
            <button
              type="button"
              @click="emit('close')"
              class="flex-1 h-10 rounded-xl border border-debt-grey hover:bg-slate-100 text-xs font-bold text-slate-600 transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              @click="handleConfirm"
              class="flex-1 h-10 rounded-xl bg-debt hover:bg-[#68001a] text-white text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-sm cursor-pointer"
            >
              <CheckCircle2 :size="15" />
              <span>Konfirmasi Bayar</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>