<!-- components/layout/TheSidebar.vue -->
<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";

defineProps<{
  isExpanded: boolean;
  toggleSidebar: () => void;
}>();

defineEmits<{
  (e: "toggle"): void;
}>();

const route = useRoute();

const topMenuItems = [
  { name: "Dashboard", icon: "grid_view", path: "/" },
  { name: "Statistik", icon: "monitoring", path: "/analytics" },
  { name: "Piutang Bon", icon: "account_balance_wallet", path: "/debts" },
  { name: "Kontrak Cicilan", icon: "calendar_month", path: "/installments" },
];

const bottomMenuItems = [
  { name: "Pengaturan", icon: "settings", path: "/settings" },
  { name: "Logout", icon: "logout", path: "/logout" },
];

// Gabungkan menu untuk mobile bottom bar
const mobileMenuItems = computed(() => [
  ...topMenuItems,
  { name: "Pengaturan", icon: "settings", path: "/settings" },
]);
</script>

<template>
  <!-- ==================== DESKTOP SIDEBAR (md ke atas) ==================== -->
  <aside class="hidden md:flex flex-col items-center justify-center">
    <!-- Tombol Toggle Sidebar -->
    <div class="p-2.5">
      <button
        type="button"
        @click="toggleSidebar"
        class="w-12 h-12 rounded-full bg-white hover:bg-debt-container flex items-center justify-center transition shadow-xs"
        title="Buka / Tutup Sidebar"
      >
        <span class="material-symbols-outlined text-[20px] text-debt-dark">
          {{ isExpanded ? "menu_open" : "menu" }}
        </span>
      </button>
    </div>

    <!-- Group Atas -->
    <div
      :class="[
        'bg-white p-2.5 flex flex-col justify-center shadow shrink-0 transition-all duration-300',
        isExpanded ? 'w-52 rounded-3xl' : 'w-16 rounded-full',
      ]"
    >
      <NuxtLink
        v-for="item in topMenuItems"
        :key="item.path"
        :to="item.path"
        :class="[
          'h-11 flex items-center gap-3 transition-colors px-2.5',
          route.path === item.path
            ? 'bg-debt text-white shadow-sm rounded-full'
            : 'text-slate-500 hover:bg-debt-container hover:text-debt-dark rounded-full',
        ]"
        :title="item.name"
      >
        <span class="material-symbols-outlined text-[20px] shrink-0">
          {{ item.icon }}
        </span>
        <span
          v-if="isExpanded"
          class="text-[13px] font-semibold whitespace-nowrap overflow-hidden transition-opacity"
        >
          {{ item.name }}
        </span>
      </NuxtLink>
    </div>

    <!-- Group Bawah (Settings, Logout) -->
    <div
      :class="[
        'bg-white p-2.5 flex flex-col justify-center mt-3 shadow shrink-0 transition-all duration-300',
        isExpanded ? 'w-52 rounded-3xl' : 'w-16 rounded-full',
      ]"
    >
      <NuxtLink
        v-for="item in bottomMenuItems"
        :key="item.path"
        :to="item.path"
        class="h-11 flex items-center gap-3 text-slate-500 hover:text-debt-dark hover:bg-debt-container rounded-full transition px-2.5"
        :title="item.name"
      >
        <span class="material-symbols-outlined text-[20px] shrink-0">
          {{ item.icon }}
        </span>
        <span
          v-if="isExpanded"
          class="text-[13px] font-semibold whitespace-nowrap overflow-hidden"
        >
          {{ item.name }}
        </span>
      </NuxtLink>
    </div>
  </aside>

  <!-- ==================== MOBILE FLOATING PILL BAR (Bawah md) ==================== -->
  <nav
    class="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 md:hidden w-[92%] max-w-md bg-white/95 backdrop-blur-md rounded-full shadow-xl border border-slate-100 px-3 py-2 flex items-center justify-between transition-all duration-300"
    aria-label="Mobile Navigation"
  >
    <NuxtLink
      v-for="item in mobileMenuItems"
      :key="item.path"
      :to="item.path"
      :class="[
        'flex items-center justify-center transition-all duration-300 ease-out select-none',
        route.path === item.path
          ? 'bg-debt text-white px-4 py-2 rounded-full gap-2 shadow-md'
          : 'text-slate-500 hover:text-debt p-2 rounded-full hover:bg-slate-100/70',
      ]"
      :title="item.name"
    >
      <span class="material-symbols-outlined text-[22px] shrink-0">
        {{ item.icon }}
      </span>

      <!-- Label muncul dengan animasi hanya jika rute aktif -->
      <span
        v-if="route.path === item.path"
        class="text-xs font-semibold whitespace-nowrap animate-in fade-in zoom-in-95 duration-200"
      >
        {{ item.name }}
      </span>
    </NuxtLink>
  </nav>
</template>