<!-- components/debt/PayDebtModal.vue -->
<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useDebtStore } from '~/stores/debt';
import { 
  X, 
  CreditCard, 
  Wallet, 
  FileText, 
  AlertCircle, 
  Loader2, 
  CheckCircle2 
} from 'lucide-vue-next';

interface Props {
  show: boolean;
  customer: {
    customerId: number;
    customerName: string;
    totalDebt: number;
  } | null;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'success'): void;
}>();

const debtStore = useDebtStore();

const payAmount = ref<number | ''>('');
const paymentMethod = ref<'Cash' | 'Transfer' | 'QRIS'>('Cash');
const notes = ref('');
const localError = ref<string | null>(null);
const isSubmitting = ref(false);

const maxDebt = computed(() => Number(props.customer?.totalDebt || 0));

const formatRupiah = (val: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(val || 0);
};

// Sisa hutang setelah pembayaran
const remainingDebt = computed(() => {
  const current = Number(payAmount.value || 0);
  return Math.max(0, maxDebt.value - current);
});

const isValid = computed(() => {
  const amt = Number(payAmount.value || 0);
  return props.customer !== null && amt > 0 && amt <= maxDebt.value;
});

// Shortcut bayar seluruh tagihan
const handlePayFull = () => {
  payAmount.value = maxDebt.value;
};

// Reset saat modal dibuka
watch(() => props.show, (active) => {
  if (active) {
    payAmount.value = '';
    paymentMethod.value = 'Cash';
    notes.value = '';
    localError.value = null;
  }
});

const handleSubmit = async () => {
  if (!isValid.value || !props.customer) {
    localError.value = 'Nominal pembayaran tidak valid atau melebihi sisa hutang.';
    return;
  }

  isSubmitting.value = true;
  localError.value = null;

  const result = await debtStore.payDebt({
    customerId: props.customer.customerId,
    amount: Number(payAmount.value),
    paymentMethod: paymentMethod.value,
    notes: notes.value.trim() || undefined
  });

  isSubmitting.value = false;

  if (result.success) {
    emit('success');
    emit('close');
  } else {
    localError.value = result.message || 'Gagal menyimpan pembayaran.';
  }
};
</script>

<template>
  <Teleport to="body">
    <div
      v-if="show"
      class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
      @click.self="emit('close')"
    >
      <div class="w-full max-w-md bg-white rounded-3xl border border-debt-grey shadow-2xl overflow-hidden flex flex-col z-[101]">
        
        <!-- Header Modal Marun -->
        <div class="px-6 py-4 bg-debt text-white flex items-center justify-between">
          <div class="flex items-center gap-2">
            <CreditCard :size="20" class="text-white/80" />
            <h3 class="text-sm font-bold tracking-wide">Bayar / Cicil Bon</h3>
          </div>
          <button
            type="button"
            @click="emit('close')"
            class="text-white/70 hover:text-white p-1 rounded-lg transition"
          >
            <X :size="18" />
          </button>
        </div>

        <!-- Form Body -->
        <form @submit.prevent="handleSubmit" class="p-6 space-y-4">
          <!-- Alert Error -->
          <div v-if="localError" class="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle :size="16" class="shrink-0" />
            <span>{{ localError }}</span>
          </div>

          <!-- Ringkasan Info Pelanggan & Hutang Saat Ini -->
          <div class="p-3.5 bg-debt-container rounded-2xl flex items-center justify-between">
            <div>
              <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Pelanggan</span>
              <span class="font-bold text-sm text-debt-dark">
                {{ customer?.customerName }}
              </span>
              <span class="text-[10px] text-slate-400 block font-mono">ID: #{{ customer?.customerId }}</span>
            </div>
            <div class="text-right">
              <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Sisa Bon</span>
              <span class="font-black text-base text-debt">
                {{ formatRupiah(maxDebt) }}
              </span>
            </div>
          </div>

          <!-- Input Nominal Bayar -->
          <div>
            <div class="flex items-center justify-between mb-1">
              <label class="text-[11px] font-bold text-slate-700 uppercase">Nominal Bayar (Rp)</label>
              <button
                type="button"
                @click="handlePayFull"
                class="text-[11px] font-bold text-debt hover:underline cursor-pointer"
              >
                Bayar Lunas
              </button>
            </div>
            <div class="relative">
              <Wallet :size="16" class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                v-model.number="payAmount"
                type="number"
                min="500"
                :max="maxDebt"
                step="500"
                placeholder="Masukkan nominal bayar..."
                required
                class="w-full h-10 pl-9 pr-3 bg-debt-dim/50 border border-debt-grey rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-debt transition"
              />
            </div>

            <!-- Info Estimasi Sisa Hutang Setelah Bayar -->
            <div class="mt-1.5 flex justify-between text-[11px]">
              <span class="text-slate-500">Sisa Hutang Setelah Bayar:</span>
              <span class="font-bold" :class="remainingDebt === 0 ? 'text-emerald-700' : 'text-debt-dark'">
                {{ remainingDebt === 0 ? 'Lunas (Rp 0)' : formatRupiah(remainingDebt) }}
              </span>
            </div>
          </div>

          <!-- Metode Pembayaran -->
          <div>
            <label class="block text-[11px] font-bold text-slate-700 uppercase mb-1.5">Metode Bayar</label>
            <div class="grid grid-cols-3 gap-2">
              <button
                v-for="method in (['Cash', 'QRIS', 'Transfer'] as const)"
                :key="method"
                type="button"
                @click="paymentMethod = method"
                :class="[
                  'py-2 rounded-xl text-xs font-bold transition border',
                  paymentMethod === method
                    ? 'bg-debt text-white border-debt shadow-2xs'
                    : 'bg-white text-slate-700 border-debt-grey hover:bg-debt-container'
                ]"
              >
                {{ method }}
              </button>
            </div>
          </div>

          <!-- Catatan Pembayaran -->
          <div>
            <label class="block text-[11px] font-bold text-slate-700 uppercase mb-1">Catatan (Opsional)</label>
            <div class="relative">
              <FileText :size="16" class="absolute left-3 top-3 text-slate-400 pointer-events-none" />
              <textarea
                v-model="notes"
                rows="2"
                placeholder="Contoh: Titip uang lewat kasir, transfer BCA, dll..."
                class="w-full pl-9 pr-3 py-2 bg-debt-dim/50 border border-debt-grey rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-debt transition resize-none"
              ></textarea>
            </div>
          </div>

          <!-- Tombol Aksi -->
          <div class="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              @click="emit('close')"
              class="h-10 px-4 rounded-xl border border-debt-grey hover:bg-slate-100 text-xs font-bold text-slate-600 transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              :disabled="!isValid || isSubmitting"
              class="h-10 px-5 rounded-xl bg-debt hover:bg-[#66001a] text-white text-xs font-bold flex items-center gap-1.5 transition shadow-sm disabled:opacity-50 cursor-pointer"
            >
              <Loader2 v-if="isSubmitting" :size="15" class="animate-spin" />
              <span>{{ isSubmitting ? 'Memproses...' : 'Konfirmasi Bayar' }}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  </Teleport>
</template>