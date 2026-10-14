<!-- components/common/StatCard.vue -->
<script setup lang="ts">
defineProps<{
  title: string;
  value: string | number;
  icon: string;
  colorClass?: string;
  subtext?: string;
  loading?: boolean;
}>();
</script>

<template>
  <div class="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
    <div class="space-y-1">
      <span class="text-[12px] font-semibold text-slate-500 uppercase tracking-wide">{{ title }}</span>
      <div v-if="loading" class="h-7 w-28 bg-slate-100 rounded-lg animate-pulse"></div>
      <h3 v-else class="text-[22px] font-black text-slate-900 tracking-tight">{{ value }}</h3>
      <p v-if="subtext" class="text-[11px] text-slate-400 font-medium">{{ subtext }}</p>
    </div>
    <div :class="['w-12 h-12 rounded-2xl flex items-center justify-center shrink-0', colorClass || 'bg-emerald-50 text-emerald-700']">
      <span class="material-symbols-outlined text-[26px]">{{ icon }}</span>
    </div>
  </div>
</template>