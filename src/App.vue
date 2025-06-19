<template>
  <div class="min-h-screen bg-gray-100">
    <div v-if="$route.path !== '/'" class="flex flex-col items-center p-4">
      <button
        @click="goToDashboard"
        class="mb-4 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
      >
        Powrót do Dashboard
      </button>
    </div>
    <router-view></router-view>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";

const router = useRouter();

const goToDashboard = () => {
  router.push("/");
};
</script>
