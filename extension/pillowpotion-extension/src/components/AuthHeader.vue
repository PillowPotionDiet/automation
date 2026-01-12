<template>
  <div class="auth-header-bar">
    <!-- Credits badge -->
    <div class="credits-badge">
      <span class="credits-icon">💎</span>
      <div>
        <div class="credits-balance">{{ formattedCredits }}</div>
        <div class="credits-label">Credits</div>
      </div>
    </div>

    <!-- User menu -->
    <div class="user-menu">
      <span class="user-email" :title="user?.email">{{ user?.email }}</span>
      <button class="btn-logout" @click="handleLogout">
        Logout
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import creditsService from '../services/credits.js';

// Props
const props = defineProps({
  user: {
    type: Object,
    required: true
  }
});

// Emits
const emit = defineEmits(['logout']);

// State
const credits = ref(props.user?.credits || 0);

// Computed
const formattedCredits = computed(() => {
  return creditsService.formatCredits(credits.value);
});

/**
 * Handle logout button click
 */
const handleLogout = () => {
  emit('logout');
};

/**
 * Update credits from service
 */
const updateCredits = (newCredits) => {
  credits.value = newCredits;
};

// Lifecycle hooks
onMounted(() => {
  // Start watching for credits updates
  creditsService.startWatching(updateCredits);

  // Listen for storage changes (syncs across extension views)
  creditsService.onCreditsChange(updateCredits);
});

onUnmounted(() => {
  // Stop watching when component unmounts
  creditsService.stopWatching();
});
</script>

<style scoped>
/* Component uses global auth.css styles */
</style>
