<template>
  <div class="bg-white rounded-lg shadow-sm border border-gray-200">
    <!-- Header -->
    <div class="flex items-center justify-between p-4 border-b border-gray-200">
      <h3 class="text-lg font-medium text-gray-900">{{ title }}</h3>

      <div class="flex items-center space-x-2">
        <!-- Time Range Selector -->
        <select
          v-model="selectedTimeRange"
          class="text-sm border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          @change="loadAnalytics"
        >
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
          <option value="all">All time</option>
        </select>

        <!-- Refresh Button -->
        <button
          @click="loadAnalytics"
          :disabled="isLoading"
          class="p-2 text-gray-600 hover:text-gray-900 transition-colors disabled:opacity-50"
          title="Refresh analytics"
        >
          <svg
            :class="['w-4 h-4', isLoading ? 'animate-spin' : '']"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="flex items-center justify-center h-48">
      <div class="text-center">
        <svg
          class="animate-spin mx-auto h-8 w-8 text-blue-600 mb-4"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            class="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            stroke-width="4"
          ></circle>
          <path
            class="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
        <p class="text-sm text-gray-600">Loading analytics...</p>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="p-4">
      <div class="bg-red-50 border border-red-200 rounded-md p-4">
        <div class="flex">
          <svg
            class="h-5 w-5 text-red-400"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fill-rule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clip-rule="evenodd"
            />
          </svg>
          <div class="ml-3">
            <h3 class="text-sm font-medium text-red-800">Analytics Error</h3>
            <p class="text-sm text-red-700 mt-1">{{ error }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Analytics Content -->
    <div v-else-if="analytics" class="p-4 space-y-6">
      <!-- Overview Stats -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="bg-blue-50 rounded-lg p-4">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <svg
                class="h-8 w-8 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-blue-600">Total Generations</p>
              <p class="text-2xl font-semibold text-blue-900">
                {{ analytics.totalGenerations }}
              </p>
            </div>
          </div>
        </div>

        <div class="bg-green-50 rounded-lg p-4">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <svg
                class="h-8 w-8 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-green-600">Success Rate</p>
              <p class="text-2xl font-semibold text-green-900">
                {{ Math.round(analytics.successRate * 100) }}%
              </p>
            </div>
          </div>
        </div>

        <div class="bg-purple-50 rounded-lg p-4">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <svg
                class="h-8 w-8 text-purple-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-purple-600">Favorites</p>
              <p class="text-2xl font-semibold text-purple-900">
                {{ analytics.favoriteCount }}
              </p>
            </div>
          </div>
        </div>

        <div class="bg-orange-50 rounded-lg p-4">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <svg
                class="h-8 w-8 text-orange-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-orange-600">Downloads</p>
              <p class="text-2xl font-semibold text-orange-900">
                {{ analytics.downloadCount }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Popular Prompts -->
      <div v-if="analytics.popularPrompts?.length > 0">
        <h4 class="text-sm font-medium text-gray-900 mb-3">Popular Prompts</h4>
        <div class="space-y-2">
          <div
            v-for="prompt in analytics.popularPrompts"
            :key="prompt.text"
            class="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
          >
            <div class="flex-1 min-w-0">
              <p class="text-sm text-gray-900 truncate">{{ prompt.text }}</p>
              <p class="text-xs text-gray-500">
                {{ prompt.count }} generations
              </p>
            </div>
            <button
              @click="$emit('reusePrompt', prompt.text)"
              class="ml-3 text-xs text-blue-600 hover:text-blue-800 transition-colors"
            >
              Use again
            </button>
          </div>
        </div>
      </div>

      <!-- Preferred Styles -->
      <div v-if="analytics.preferredStyles?.length > 0">
        <h4 class="text-sm font-medium text-gray-900 mb-3">Preferred Styles</h4>
        <div class="flex flex-wrap gap-2">
          <div
            v-for="style in analytics.preferredStyles"
            :key="style.name"
            class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
          >
            {{ style.name }}
            <span class="ml-1 text-blue-600">({{ style.usage }}%)</span>
          </div>
        </div>
      </div>

      <!-- Color Preferences -->
      <div v-if="analytics.colorPreferences?.length > 0">
        <h4 class="text-sm font-medium text-gray-900 mb-3">
          Color Preferences
        </h4>
        <div class="flex flex-wrap gap-2">
          <div
            v-for="color in analytics.colorPreferences"
            :key="color.hex"
            class="flex items-center space-x-2 bg-gray-50 rounded-lg px-3 py-2"
          >
            <div
              class="w-4 h-4 rounded border border-gray-300"
              :style="{ backgroundColor: color.hex }"
            />
            <span class="text-xs text-gray-700">{{ color.hex }}</span>
            <span class="text-xs text-gray-500">({{ color.usage }}%)</span>
          </div>
        </div>
      </div>

      <!-- Learning Insights -->
      <div v-if="showLearningInsights && analytics.learningInsights">
        <h4 class="text-sm font-medium text-gray-900 mb-3">
          Learning Insights
        </h4>
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div class="flex">
            <svg
              class="h-5 w-5 text-blue-400"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fill-rule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clip-rule="evenodd"
              />
            </svg>
            <div class="ml-3">
              <h5 class="text-sm font-medium text-blue-800">
                Personalization Active
              </h5>
              <div class="mt-2 text-sm text-blue-700 space-y-1">
                <p v-for="insight in analytics.learningInsights" :key="insight">
                  {{ insight }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Usage Timeline -->
      <div v-if="analytics.usageTimeline?.length > 0">
        <h4 class="text-sm font-medium text-gray-900 mb-3">Usage Timeline</h4>
        <div class="space-y-2">
          <div
            v-for="day in analytics.usageTimeline"
            :key="day.date"
            class="flex items-center justify-between"
          >
            <span class="text-sm text-gray-600">{{
              formatDate(day.date)
            }}</span>
            <div class="flex items-center space-x-2">
              <div class="flex-1 bg-gray-200 rounded-full h-2 w-24">
                <div
                  class="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  :style="{ width: `${(day.count / maxDailyUsage) * 100}%` }"
                />
              </div>
              <span class="text-sm text-gray-900 w-8 text-right">{{
                day.count
              }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="flex items-center justify-center h-48">
      <div class="text-center">
        <svg
          class="mx-auto h-12 w-12 text-gray-400 mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
        <p class="text-sm text-gray-500">No analytics data available</p>
        <p class="text-xs text-gray-400 mt-1">
          Generate some SVGs to see your usage patterns
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";

interface AnalyticsData {
  totalGenerations: number;
  successRate: number;
  favoriteCount: number;
  downloadCount: number;
  popularPrompts: Array<{ text: string; count: number }>;
  preferredStyles: Array<{ name: string; usage: number }>;
  colorPreferences: Array<{ hex: string; usage: number }>;
  learningInsights?: string[];
  usageTimeline: Array<{ date: string; count: number }>;
}

interface Props {
  title?: string;
  userId?: string;
  showLearningInsights?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface Emits {
  (e: "reusePrompt", prompt: string): void;
  (e: "error", error: string): void;
}

const props = withDefaults(defineProps<Props>(), {
  title: "Personal Analytics",
  showLearningInsights: true,
  autoRefresh: false,
  refreshInterval: 300000, // 5 minutes
});

const emit = defineEmits<Emits>();

// State
const analytics = ref<AnalyticsData | null>(null);
const isLoading = ref(false);
const error = ref<string | null>(null);
const selectedTimeRange = ref("30d");

// Computed properties
const maxDailyUsage = computed(() => {
  if (!analytics.value?.usageTimeline) return 1;
  return Math.max(...analytics.value.usageTimeline.map((day) => day.count));
});

// Methods
const loadAnalytics = async () => {
  if (isLoading.value) return;

  isLoading.value = true;
  error.value = null;

  try {
    // Simulate API call - replace with actual API
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Mock data - replace with actual API response
    analytics.value = {
      totalGenerations: 42,
      successRate: 0.89,
      favoriteCount: 8,
      downloadCount: 15,
      popularPrompts: [
        { text: "blue circle with red border", count: 5 },
        { text: "simple house icon", count: 3 },
        { text: "geometric pattern", count: 2 },
      ],
      preferredStyles: [
        { name: "Minimalist", usage: 45 },
        { name: "Geometric", usage: 30 },
        { name: "Organic", usage: 25 },
      ],
      colorPreferences: [
        { hex: "#3B82F6", usage: 35 },
        { hex: "#EF4444", usage: 25 },
        { hex: "#10B981", usage: 20 },
        { hex: "#F59E0B", usage: 20 },
      ],
      learningInsights: [
        "You prefer geometric shapes with clean lines",
        "Blue and red are your most used colors",
        "You tend to create icons more than illustrations",
      ],
      usageTimeline: [
        { date: "2024-01-01", count: 3 },
        { date: "2024-01-02", count: 5 },
        { date: "2024-01-03", count: 2 },
        { date: "2024-01-04", count: 7 },
        { date: "2024-01-05", count: 4 },
        { date: "2024-01-06", count: 1 },
        { date: "2024-01-07", count: 6 },
      ],
    };
  } catch (err) {
    const errorMessage =
      err instanceof Error ? err.message : "Failed to load analytics";
    error.value = errorMessage;
    emit("error", errorMessage);
  } finally {
    isLoading.value = false;
  }
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
};

// Lifecycle
onMounted(() => {
  loadAnalytics();

  if (props.autoRefresh) {
    setInterval(loadAnalytics, props.refreshInterval);
  }
});
</script>
