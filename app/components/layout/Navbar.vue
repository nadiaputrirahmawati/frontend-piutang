<!-- components/layout/TheNavbar.vue -->
<script setup lang="ts">
const navItems = [
  { name: "Dashboard", path: "/" },
  { name: "Daftar Piutang", path: "/debts" },
  { name: "Kontrak Cicilan", path: "/installments" },
  { name: "Riwayat Mutasi", path: "/mutations" },
  { name: "Pelanggan", path: "/customers" },
];
</script>

<template>
  <header
    class="w-full flex items-center justify-center fixed top-5 z-50 mb-10"
  >
    <nav
      class="hidden md:flex items-center justify-between gap-24 bg-white border border-debt-on-surface rounded-full px-5 py-1.5 shadow-2xs"
    >
      <div class="flex items-center gap-3 shrink-0">
        <div class="flex items-center gap-2">
          <div
            class="w-9 h-9 "
          >
            <img src="@/assets/img/logo.svg" alt="Banner Promo" />
          </div>
          <span class="font-extrabold text-xl text-debt-dark  navbar tracking-wider"
            >Credify</span
          >
        </div>
      </div>
      <div>
        <NuxtLink
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          class="px-4 py-1.5 rounded-full text-sm tracking-wider font-semibold text-debt-dark/60 transition hover:text-debt-dark/80"
          active-class=" !text-debt-dark !font-extrabold tracking-widest !font-lg"
        >
          {{ item.name }}
        </NuxtLink>
      </div>

      <div class="flex items-center gap-2 pl-1">
        <div
          class="w-10 h-10 rounded-full bg-debt-container-high border-2 border-white flex items-center justify-center font-bold text-debt text-xs shadow-2xs overflow-hidden"
        >
          <span class="material-symbols-outlined text-[24px]"
            >account_circle</span
          >
        </div>
      </div>
    </nav>
  </header>
</template>
