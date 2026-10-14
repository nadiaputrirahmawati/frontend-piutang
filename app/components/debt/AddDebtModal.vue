<!-- components/debt/AddDebtModal.vue -->
<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { useDebtStore } from '~/stores/debt';
import { 
  X, 
  PlusCircle, 
  User, 
  CreditCard, 
  FileText, 
  AlertCircle, 
  Loader2,
  ChevronDown,
  UserPlus,
  Users
} from 'lucide-vue-next';

const props = defineProps<{
  show: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'success'): void;
}>();

const debtStore = useDebtStore();

// Mode: Pilih pelanggan terdaftar VS Pelanggan Baru
const customerMode = ref<'existing' | 'new'>('existing');

// State
const selectedCustomerId = ref<number | ''>('');
const newCustomerName = ref('');
const amount = ref<number | ''>('');
const notes = ref('');
const localError = ref<string | null>(null);
const isSubmitting = ref(false);

const quickAmounts = [10000, 25000, 50000, 100000];

// Pelanggan yang dipilih dari database
const selectedCustomer = computed(() => {
  if (customerMode.value !== 'existing' || !selectedCustomerId.value) return null;
  return debtStore.debts.find(d => d.customerId === Number(selectedCustomerId.value)) || null;
});

const formatRupiah = (val: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(val || 0);
};

const isValid = computed(() => {
  const hasCustomer = customerMode.value === 'existing' 
    ? Number(selectedCustomerId.value) > 0 
    : newCustomerName.value.trim().length > 0;

  return hasCustomer && Number(amount.value) >= 100;
});

watch(() => props.show, (active) => {
  if (active) {
    customerMode.value = debtStore.debts.length > 0 ? 'existing' : 'new';
    selectedCustomerId.value = '';
    newCustomerName.value = '';
    amount.value = '';
    notes.value = '';
    localError.value = null;
  }
});

const handleSubmit = async () => {
  if (!isValid.value) {
    localError.value = 'Silakan pilih atau isi nama pelanggan serta nominal dengan benar.';
    return;
  }

  isSubmitting.value = true;
  localError.value = null;

  // Jika pelanggan baru, backend yang akan generate ID otomatis (atau gunakan dummy sequence)
  const payload = {
    customerId: customerMode.value === 'existing' ? Number(selectedCustomerId.value) : 0, // 0 menandakan auto-generate di backend
    customerName: customerMode.value === 'existing' ? (selectedCustomer.value?.customerName || '') : newCustomerName.value.trim(),
    amount: Number(amount.value),
    notes: notes.value.trim() || undefined
  };

  const result = await debtStore.createManualDebt(payload);
  isSubmitting.value = false;

  if (result.success) {
    emit('success');
    emit('close');
  } else {
    localError.value = result.message || 'Gagal menyimpan bon manual.';
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
            <PlusCircle :size="20" class="text-white/80" />
            <h3 class="text-sm font-bold tracking-wide">Tambah Hutang</h3>
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

          <!-- Pilihan Tipe: Pelanggan yang Sudah Ada VS Pelanggan Baru -->
          <div>
            <div class="grid grid-cols-2 gap-1.5 p-1 bg-debt-container rounded-xl text-xs font-bold">
              <button
                type="button"
                @click="customerMode = 'existing'"
                :class="[
                  'py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition text-[11px]',
                  customerMode === 'existing' 
                    ? 'bg-debt text-white shadow-2xs' 
                    : 'text-slate-600 hover:text-debt'
                ]"
              >
                <Users :size="14" />
                <span>Pelanggan Terdaftar</span>
              </button>
              <button
                type="button"
                @click="customerMode = 'new'"
                :class="[
                  'py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition text-[11px]',
                  customerMode === 'new' 
                    ? 'bg-debt text-white shadow-2xs' 
                    : 'text-slate-600 hover:text-debt'
                ]"
              >
                <UserPlus :size="14" />
                <span>Pelanggan Baru</span>
              </button>
            </div>
          </div>

          <!-- OPSI 1: Pilih dari Pelanggan Terdaftar -->
          <div v-if="customerMode === 'existing'">
            <label class="block text-[11px] font-bold text-debt-dark uppercase mb-1">Pilih Nama Pelanggan</label>
            <div class="relative">
              <User :size="16" class="absolute left-3 top-1/2 -translate-y-1/2 text-debt-dark pointer-events-none" />
              <select
                v-model="selectedCustomerId"
                required
                class="w-full h-10 pl-9 pr-8 bg-debt-dim shadow rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-debt transition appearance-none cursor-pointer"
              >
                <option value="" disabled>-- Cari / Pilih Pelanggan --</option>
                <option 
                  v-for="c in debtStore.debts" 
                  :key="c.customerId" 
                  :value="c.customerId"
                >
                  {{ c.customerName }}
                </option>
              </select>
              <ChevronDown :size="16" class="absolute right-3 top-1/2 -translate-y-1/2 text-debt-dark pointer-events-none" />
            </div>

            <!-- Tampilan Info Saldo Berjalan Pelanggan Terpilih -->
            <div 
              v-if="selectedCustomer" 
              class="mt-2 p-2.5 bg-debt-container rounded-xl flex items-center justify-between text-xs"
            >
              <span class="text-slate-500 font-medium">Hutang Saat Ini:</span>
              <span class="font-bold text-debt-dark">
                {{ formatRupiah(selectedCustomer.totalDebt) }}
              </span>
            </div>
          </div>

          <!-- OPSI 2: Pelanggan Baru (HANYA INPUT NAMA, TANPA ID) -->
          <div v-else>
            <label class="block text-[11px] font-bold text-debt-dark uppercase mb-1">Nama Pelanggan Baru</label>
            <div class="relative">
              <User :size="16" class="absolute left-3 top-1/2 -translate-y-1/2 text-debt-dark pointer-events-none" />
              <input
                v-model="newCustomerName"
                type="text"
                placeholder="Contoh: Pak Haji Ahmad / Bu Rina..."
                required
                class="w-full h-10 pl-9 pr-3 bg-debt-dim shadow rounded-lg text-xs font-semibold text-slate-800 outline-none focus:border-debt transition"
              />
            </div>
          </div>

          <!-- Nominal Tambahan Bon -->
          <div>
            <div class="flex items-center justify-between mb-1">
              <label class="text-[11px] font-bold text-debt-dark uppercase">Nominal Bon (Rp)</label>
              <span v-if="Number(amount) > 0" class="text-xs font-black text-debt">
                +{{ formatRupiah(Number(amount)) }}
              </span>
            </div>
            <div class="relative">
              <CreditCard :size="16" class="absolute left-3 top-1/2 -translate-y-1/2 text-debt-dark pointer-events-none" />
              <input
                v-model.number="amount"
                type="number"
                min="100"
                step="any"
                placeholder="0"
                required
                class="w-full h-10 pl-9 pr-3 bg-debt-dim shadow rounded-lg text-xs font-bold text-slate-800 outline-none focus:border-debt transition"
              />
            </div>

            <!-- Pintasan Nominal -->
            <div class="flex gap-1.5 mt-2">
              <button
                v-for="amt in quickAmounts"
                :key="amt"
                type="button"
                @click="amount = amt"
                class="flex-1 py-1 px-2 rounded-lg bg-debt-container hover:bg-debt-container-high text-[10px] font-bold text-debt-dark transition"
              >
                +{{ amt / 1000 }}k
              </button>
            </div>
          </div>

          <!-- Keterangan / Catatan -->
          <div>
            <label class="block text-[11px] font-bold text-debt-dark uppercase mb-1">Catatan</label>
            <div class="relative">
              <FileText :size="16" class="absolute left-3 top-3 text-debt-dark pointer-events-none" />
              <textarea
                v-model="notes"
                rows="2"
                placeholder="Contoh: Titip rokok/sembako di luar kasir..."
                class="w-full pl-9 pr-3 py-2 bg-debt-dim shadow rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-debt transition resize-none"
              ></textarea>
            </div>
          </div>

          <!-- Tombol Aksi -->
          <div class="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              @click="emit('close')"
              class="h-10 px-4 rounded-xl border border-debt-grey hover:bg-slate-100 text-xs font-bold text-slate-600 transition"
            >
              Batal
            </button>
            <button
              type="submit"
              :disabled="!isValid || isSubmitting"
              class="h-10 px-5 rounded-xl bg-debt hover:bg-[#66001a] text-white text-xs font-bold flex items-center gap-1.5 transition shadow-sm disabled:opacity-50"
            >
              <Loader2 v-if="isSubmitting" :size="15" class="animate-spin" />
              <span>{{ isSubmitting ? 'Menyimpan...' : 'Simpan Bon' }}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  </Teleport>
</template>