<template>
  <button @click="$emit('click')" class="cs-button"><slot /></button>
</template>

<script setup lang="ts">
defineEmits(["click"]);
</script>
<style scoped>
@import url("https://fonts.googleapis.com/css2?family=Anton&Oswald:wght@400&display=swap");

.cs-button {
  @apply text-white px-4 py-2 hover:bg-[#2a6b94] transition-colors text-sm sm:text-base font-semibold;
  background-color: rgb(50, 129, 172);
  border-radius: 2px;
  font-family: "Oswald", sans-serif;
}
</style>
