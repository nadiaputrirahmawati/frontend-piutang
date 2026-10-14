<!-- pages/installments/create.vue -->
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useInstallmentStore } from '~/stores/installment';
import { useDebtStore } from '~/stores/debt';
import { 
  ArrowLeft, 
  FilePlus, 
  User, 
  Users, 
  UserPlus, 
  Calendar, 
  CreditCard, 
  Percent,
  Package, 
  AlertCircle, 
  Loader2,
  Search,
  CalendarDays
} from 'lucide-vue-next';

const router = useRouter();
const installmentStore = useInstallmentStore();
const debtStore = useDebtStore();

const customerMode = ref<'existing' | 'new'>('existing');
const selectedCustomerId = ref<number | null>(null);
const searchCustomerQuery = ref('');
const isDropdownOpen = ref(false);
const newCustomerName = ref('');

// Form Values
const itemName = ref('');
const principalAmount = ref<number | ''>(''); // Nilai Pokok Barang
const interestRate = ref<number>(0);          // Bunga (%)
const tenorMonths = ref<number>(6);
const firstDueDate = ref<string>('');         // Tanggal Jatuh Tempo Pertama

const isSubmitting = ref(false);
const localError = ref<string | null>(null);

const availableTenors = [3, 6, 10, 12, 24];
const quickInterestRates = [0, 2.5, 5, 10];

onMounted(async () => {
  // Set default jatuh tempo pertama adalah 1 bulan dari hari ini
  const nextMonth = new Date();
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  firstDueDate.value = nextMonth.toISOString().split('T')[0]!;

  if (debtStore.debts.length === 0) {
    await debtStore.fetchDebts('all');
  }
  customerMode.value = debtStore.debts.length > 0 ? 'existing' : 'new';
});

const filteredCustomers = computed(() => {
  const query = searchCustomerQuery.value.toLowerCase().trim();
  if (!query) return debtStore.debts;
  return debtStore.debts.filter(c => 
    c.customerName.toLowerCase().includes(query) || 
    c.customerId.toString().includes(query)
  );
});

const selectedCustomer = computed(() => {
  if (customerMode.value !== 'existing' || !selectedCustomerId.value) return null;
  return debtStore.debts.find(d => d.customerId === selectedCustomerId.value) || null;
});

const selectCustomer = (customer: any) => {
  selectedCustomerId.value = customer.customerId;
  searchCustomerQuery.value = customer.customerName;
  isDropdownOpen.value = false;
};

// 1. Nominal Bunga Rupiah (TotalInterest yang diterima C#)
const calculatedTotalInterest = computed(() => {
  const principal = Number(principalAmount.value || 0);
  const rate = Number(interestRate.value || 0);
  if (principal <= 0 || rate <= 0) return 0;
  return Math.round((principal * rate) / 100);
});

// 2. Total Tagihan Keseluruhan (Pokok + Bunga)
const totalFinanced = computed(() => {
  return Number(principalAmount.value || 0) + calculatedTotalInterest.value;
});

// 3. Cicilan per Bulan
const monthlyInstallment = computed(() => {
  if (tenorMonths.value <= 0 || totalFinanced.value <= 0) return 0;
  return Math.round(totalFinanced.value / tenorMonths.value);
});

// 4. Simulasi Jatuh Tempo
const scheduleSimulations = computed(() => {
  if (totalFinanced.value <= 0 || tenorMonths.value <= 0 || !firstDueDate.value) return [];

  const list = [];
  const start = new Date(firstDueDate.value);
  const monthly = monthlyInstallment.value;
  const totalMonths = tenorMonths.value;
  const totalBill = totalFinanced.value;

  for (let i = 1; i <= totalMonths; i++) {
    const due = new Date(start);
    due.setMonth(due.getMonth() + (i - 1));

    const amount = (i === totalMonths) 
      ? (totalBill - (monthly * (totalMonths - 1))) 
      : monthly;

    list.push({
      number: i,
      dueDate: due.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
      amount: amount
    });
  }

  return list;
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
    ? selectedCustomerId.value !== null 
    : newCustomerName.value.trim().length > 0;

  return hasCustomer && 
         itemName.value.trim().length > 0 && 
         Number(principalAmount.value || 0) >= 10000 && 
         tenorMonths.value > 0 && 
         firstDueDate.value.length > 0;
});

const handleSubmit = async () => {
  if (!isValid.value) {
    localError.value = 'Mohon lengkapi formulir dengan benar.';
    return;
  }

  isSubmitting.value = true;
  localError.value = null;

  // SESUAIKAN DENGAN CreateInstallmentContractRequest DI C#
  const payload = {
    customerId: customerMode.value === 'existing' ? Number(selectedCustomerId.value) : 0,
    itemName: itemName.value.trim(),
    principalAmount: Number(principalAmount.value),
    totalInterest: calculatedTotalInterest.value, // Kirim nominal rupiah bunga
    tenorMonths: Number(tenorMonths.value),
    firstDueDate: new Date(firstDueDate.value).toISOString()
  };

  const res = await installmentStore.createContract(payload as any);
  isSubmitting.value = false;

  if (res.success) {
    router.push('/installments');
  } else {
    localError.value = res.message || 'Gagal menerbitkan kontrak cicilan.';
  }
};
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center gap-3 pb-2 border-b border-debt-grey/60">
      <button
        type="button"
        @click="router.push('/installments')"
        class="w-10 h-10 rounded-2xl bg-white border border-debt-grey hover:bg-debt-container flex items-center justify-center transition shadow-2xs text-debt-dark cursor-pointer"
      >
        <ArrowLeft :size="18" />
      </button>
      <div>
        <h1 class="text-xl font-bold text-debt-dark">Terbitkan Kontrak Cicilan</h1>
        <p class="text-xs text-slate-500">Penetapan pokok barang, margin bunga, dan jadwal jatuh tempo tenor</p>
      </div>
    </div>

    <div v-if="localError" class="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-2xl flex items-center gap-2">
      <AlertCircle :size="16" class="shrink-0" />
      <span>{{ localError }}</span>
    </div>

    <form @submit.prevent="handleSubmit" class="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      <!-- KOLOM KIRI (7/12) -->
      <div class="lg:col-span-7 space-y-5">
        
        <!-- CARD 1: IDENTITAS PELANGGAN -->
        <div class="bg-white border border-debt-grey/80 rounded-3xl p-5 shadow-2xs space-y-4">
          <div class="flex items-center justify-between pb-2 border-b border-debt-grey/50">
            <span class="text-xs font-bold text-debt-dark uppercase tracking-wider">Identitas Pelanggan</span>
            
            <div class="flex items-center bg-debt-container p-1 rounded-xl text-xs font-bold">
              <button
                type="button"
                @click="customerMode = 'existing'"
                :class="[
                  'px-3 py-1.5 rounded-lg transition text-[11px] cursor-pointer flex items-center gap-1.5',
                  customerMode === 'existing' ? 'bg-debt text-white shadow-2xs' : 'text-slate-600 hover:text-debt'
                ]"
              >
                <Users :size="13" />
                <span>Dari Database</span>
              </button>
              <button
                type="button"
                @click="customerMode = 'new'"
                :class="[
                  'px-3 py-1.5 rounded-lg transition text-[11px] cursor-pointer flex items-center gap-1.5',
                  customerMode === 'new' ? 'bg-debt text-white shadow-2xs' : 'text-slate-600 hover:text-debt'
                ]"
              >
                <UserPlus :size="13" />
                <span>Input Manual</span>
              </button>
            </div>
          </div>

          <!-- Pelanggan Terdaftar -->
          <div v-if="customerMode === 'existing'" class="relative">
            <label class="block text-[11px] font-bold text-slate-700 uppercase mb-1">Cari Nama Pelanggan</label>
            <div class="relative">
              <Search :size="16" class="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                v-model="searchCustomerQuery"
                type="text"
                placeholder="Ketik untuk mencari pelanggan..."
                @focus="isDropdownOpen = true"
                class="w-full h-11 pl-10 pr-3 bg-debt-dim/40 border border-debt-grey rounded-2xl text-xs font-semibold text-slate-800 outline-none focus:border-debt transition"
              />
            </div>

            <!-- List Dropdown -->
            <div
              v-if="isDropdownOpen"
              class="absolute left-0 right-0 top-full mt-1.5 bg-white border border-debt-grey rounded-2xl shadow-xl z-30 max-h-56 overflow-y-auto divide-y divide-debt-grey/40"
            >
              <div
                v-for="c in filteredCustomers"
                :key="c.customerId"
                @click="selectCustomer(c)"
                class="p-3 hover:bg-debt-dim/60 cursor-pointer flex items-center justify-between text-xs transition"
              >
                <div>
                  <span class="font-bold text-slate-800 block">{{ c.customerName }}</span>
                  <span class="text-[10px] text-slate-400 font-mono">ID: #{{ c.customerId }}</span>
                </div>
                <span class="font-bold text-debt">{{ formatRupiah(c.totalDebt) }}</span>
              </div>
            </div>

            <div 
              v-if="selectedCustomer" 
              class="mt-2.5 p-3 bg-debt-container/40 border border-debt-grey/60 rounded-2xl flex items-center justify-between text-xs"
            >
              <span class="font-bold text-slate-800">{{ selectedCustomer.customerName }}</span>
              <span class="font-bold text-debt-dark">Hutang Toko: {{ formatRupiah(selectedCustomer.totalDebt) }}</span>
            </div>
          </div>

          <!-- Pelanggan Baru -->
          <div v-else>
            <label class="block text-[11px] font-bold text-slate-700 uppercase mb-1">Nama Lengkap Pelanggan Baru</label>
            <div class="relative">
              <User :size="16" class="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                v-model="newCustomerName"
                type="text"
                placeholder="Masukkan nama lengkap pelanggan..."
                required
                class="w-full h-11 pl-10 pr-3 bg-debt-dim/40 border border-debt-grey rounded-2xl text-xs font-semibold text-slate-800 outline-none focus:border-debt transition"
              />
            </div>
          </div>
        </div>

        <!-- CARD 2: RINCIAN BARANG, POKOK & BUNGA -->
        <div class="bg-white border border-debt-grey/80 rounded-3xl p-5 shadow-2xs space-y-4">
          <span class="text-xs font-bold text-debt-dark uppercase tracking-wider block pb-2 border-b border-debt-grey/50">
            Nilai Pembiayaan & Tenor
          </span>

          <!-- Nama Barang (itemName) -->
          <div>
            <label class="block text-[11px] font-bold text-slate-700 uppercase mb-1">Nama Barang / Item (itemName)</label>
            <div class="relative">
              <Package :size="16" class="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                v-model="itemName"
                type="text"
                placeholder="Contoh: 10 Sak Semen Tiga Roda, Beras Ramos 50kg..."
                required
                class="w-full h-11 pl-10 pr-3 bg-debt-dim/40 border border-debt-grey rounded-2xl text-xs font-semibold text-slate-800 outline-none focus:border-debt transition"
              />
            </div>
          </div>

          <!-- Pokok Pinjaman Barang -->
          <div>
            <label class="block text-[11px] font-bold text-slate-700 uppercase mb-1">Nilai Pokok Barang (Rp)</label>
            <div class="relative">
              <CreditCard :size="16" class="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                v-model.number="principalAmount"
                type="number"
                min="10000"
                step="any"
                placeholder="0"
                required
                class="w-full h-11 pl-10 pr-3 bg-debt-dim/40 border border-debt-grey rounded-2xl text-xs font-bold text-slate-800 outline-none focus:border-debt transition"
              />
            </div>
          </div>

          <!-- Bunga Persentase (%) -->
          <div>
            <div class="flex items-center justify-between mb-1">
              <label class="text-[11px] font-bold text-slate-700 uppercase">Margin Bunga (%)</label>
              <span v-if="calculatedTotalInterest > 0" class="text-xs font-bold text-debt">
                +{{ formatRupiah(calculatedTotalInterest) }}
              </span>
            </div>
            <div class="flex items-center gap-3">
              <div class="relative flex-1">
                <Percent :size="16" class="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  v-model.number="interestRate"
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  placeholder="0"
                  class="w-full h-11 pl-10 pr-3 bg-debt-dim/40 border border-debt-grey rounded-2xl text-xs font-bold text-slate-800 outline-none focus:border-debt transition"
                />
              </div>

              <!-- Pilihan Chip Cepat -->
              <div class="flex items-center gap-1.5">
                <button
                  v-for="rate in quickInterestRates"
                  :key="rate"
                  type="button"
                  @click="interestRate = rate"
                  :class="[
                    'h-11 px-3 rounded-2xl text-xs font-bold transition border cursor-pointer',
                    interestRate === rate
                      ? 'bg-debt text-white border-debt shadow-2xs'
                      : 'bg-white border-debt-grey text-slate-600 hover:bg-debt-container'
                  ]"
                >
                  {{ rate }}%
                </button>
              </div>
            </div>
          </div>

          <!-- Tenor Angsuran -->
          <div>
            <label class="block text-[11px] font-bold text-slate-700 uppercase mb-1.5">Tenor Angsuran (Bulan)</label>
            <div class="grid grid-cols-5 gap-2">
              <button
                v-for="t in availableTenors"
                :key="t"
                type="button"
                @click="tenorMonths = t"
                :class="[
                  'py-2.5 rounded-xl font-bold text-xs transition border cursor-pointer',
                  tenorMonths === t
                    ? 'bg-debt text-white border-debt shadow-2xs'
                    : 'bg-white border-debt-grey text-slate-700 hover:bg-debt-container'
                ]"
              >
                {{ t }} Bulan
              </button>
            </div>
          </div>

          <!-- Tanggal Jatuh Tempo Pertama -->
          <div>
            <label class="block text-[11px] font-bold text-slate-700 uppercase mb-1">Tanggal Jatuh Tempo Pertama (FirstDueDate)</label>
            <div class="relative">
              <Calendar :size="16" class="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                v-model="firstDueDate"
                type="date"
                required
                class="w-full h-11 pl-10 pr-3 bg-debt-dim/40 border border-debt-grey rounded-2xl text-xs font-semibold text-slate-800 outline-none focus:border-debt transition"
              />
            </div>
          </div>
        </div>

      </div>

      <!-- KOLOM KANAN (5/12) -->
      <div class="lg:col-span-5 space-y-5">
        
        <!-- CARD SUMMARY -->
        <div class="bg-gradient-to-br from-debt via-[#961233] to-debt-dark text-white rounded-3xl p-6 shadow-md relative overflow-hidden flex flex-col justify-between">
          <div class="flex items-center justify-between pb-3 border-b border-white/10">
            <span class="text-xs uppercase font-bold tracking-wider opacity-80">Kalkulasi Kredit</span>
            <span class="text-xs font-mono font-bold">{{ tenorMonths }}x Angsuran</span>
          </div>

          <div class="my-4">
            <span class="text-[11px] text-white/70 block font-medium">Cicilan per Bulan:</span>
            <h2 class="text-3xl font-black tracking-tight mt-0.5">
              {{ formatRupiah(monthlyInstallment) }}
              <span class="text-xs font-normal text-white/70">/ bulan</span>
            </h2>
          </div>

          <div class="space-y-1.5 text-xs border-t border-white/10 pt-3 text-white/80">
            <div class="flex justify-between">
              <span>Pokok Pinjaman:</span>
              <span class="font-bold">{{ formatRupiah(Number(principalAmount || 0)) }}</span>
            </div>
            <div class="flex justify-between text-white/90">
              <span>Total Margin Bunga ({{ interestRate }}%):</span>
              <span class="font-bold">+ {{ formatRupiah(calculatedTotalInterest) }}</span>
            </div>
            <div class="flex justify-between font-bold text-white pt-1.5 border-t border-white/10">
              <span>Total Tagihan Kontrak:</span>
              <span class="text-amber-200">{{ formatRupiah(totalFinanced) }}</span>
            </div>
          </div>
        </div>

        <!-- SIMULASI JADWAL -->
        <div class="bg-white border border-debt-grey/80 rounded-3xl p-5 shadow-2xs space-y-3">
          <div class="flex items-center justify-between pb-2 border-b border-debt-grey/50">
            <h4 class="text-xs font-bold text-debt-dark uppercase tracking-wider">Simulasi Tanggal Jatuh Tempo</h4>
            <CalendarDays :size="15" class="text-slate-400" />
          </div>

          <div class="max-h-60 overflow-y-auto space-y-2 pr-1 divide-y divide-debt-grey/40 text-xs">
            <div
              v-for="s in scheduleSimulations"
              :key="s.number"
              class="pt-2 flex items-center justify-between"
            >
              <div class="flex items-center gap-2">
                <span class="w-6 h-6 rounded-lg bg-debt-container text-debt font-bold text-[10px] flex items-center justify-center">
                  #{{ s.number }}
                </span>
                <span class="text-slate-600 font-medium">{{ s.dueDate }}</span>
              </div>
              <span class="font-bold text-debt-dark">{{ formatRupiah(s.amount) }}</span>
            </div>

            <div v-if="scheduleSimulations.length === 0" class="py-6 text-center text-slate-400">
              Isi nilai pokok barang untuk melihat rincian tanggal jatuh tempo.
            </div>
          </div>
        </div>

        <!-- TOMBOL SIMPAN -->
        <button
          type="submit"
          :disabled="!isValid || isSubmitting"
          class="w-full h-12 rounded-2xl bg-debt hover:bg-[#68001a] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md transition active:scale-95 disabled:opacity-50 cursor-pointer"
        >
          <Loader2 v-if="isSubmitting" :size="18" class="animate-spin" />
          <FilePlus v-else :size="18" />
          <span>{{ isSubmitting ? 'Menerbitkan Kontrak...' : 'Terbitkan Kontrak Cicilan' }}</span>
        </button>

      </div>

    </form>
  </div>
</template>