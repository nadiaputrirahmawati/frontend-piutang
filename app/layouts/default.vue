<!-- layouts/default.vue -->
<script setup lang="ts">
import { ref } from 'vue';

const isSidebarExpanded = ref(false);

const toggleSidebar = () => {
  isSidebarExpanded.value = !isSidebarExpanded.value;
};
</script>

<template>
    <div class="w-full  bg-debt-dim/70  p-4 sm:p-6 shadow-2xl flex flex-col gap-5 overflow-hidden">
      
      <!-- TOP NAVBAR KAPSUL -->
      <LayoutNavbar />

      <!-- BODY: SIDEBAR + KONTEN DASHBOARD -->
      <div class="flex items-start gap-4 sm:gap-6 flex-1 lg:mt-15 mt-0">
        <!-- SIDEBAR ICON VERTICAL (EXPANDABLE) -->
        <LayoutSidebar :is-expanded="isSidebarExpanded" :toggle-sidebar="toggleSidebar" />

        <!-- AREA KONTEN -->
        <main class="flex-1 min-w-0">
          <slot />
        </main>
      </div>

    </div>
</template>