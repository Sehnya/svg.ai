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
          <option value="1h">Last Hour</option>
          <option value="24h">Last 24 Hours</option>
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
        </select>

        <!-- Auto Refresh Toggle -->
        <button
          @click="toggleAutoRefresh"
          :class="[
            'px-3 py-1 text-xs font-medium rounded-md transition-colors',
            autoRefresh
              ? 'bg-green-100 text-green-800'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
          ]"
        >
          <svg
            :class="['w-4 h-4 inline mr-1', autoRefresh ? 'animate-spin' : '']"
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
          Auto Refresh
        </button>

        <!-- Export Button -->
        <button
          @click="exportData"
          class="px-3 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <svg
            class="w-4 h-4 inline mr-1"
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
          Export
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

    <!-- Analytics Content -->
    <div v-else-if="analytics" class="p-4 space-y-6">
      <!-- System Health Overview -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <!-- Generation Success Rate -->
        <div class="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-4">
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
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-green-600">Success Rate</p>
              <p class="text-2xl font-semibold text-green-900">
                {{ (analytics.successRate * 100).toFixed(1) }}%
              </p>
              <p class="text-xs text-green-700">
                {{ analytics.successfulGenerations }}/{{
                  analytics.totalGenerations
                }}
              </p>
            </div>
          </div>
        </div>

        <!-- Average Response Time -->
        <div class="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4">
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
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-blue-600">Avg Response Time</p>
              <p class="text-2xl font-semibold text-blue-900">
                {{ analytics.avgResponseTime.toFixed(0) }}ms
              </p>
              <p class="text-xs text-blue-700">
                P95: {{ analytics.p95ResponseTime.toFixed(0) }}ms
              </p>
            </div>
          </div>
        </div>

        <!-- Token Usage -->
        <div
          class="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-4"
        >
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
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-purple-600">Token Usage</p>
              <p class="text-2xl font-semibold text-purple-900">
                {{ formatNumber(analytics.totalTokens) }}
              </p>
              <p class="text-xs text-purple-700">
                Cost: ${{ analytics.tokenCost.toFixed(2) }}
              </p>
            </div>
          </div>
        </div>

        <!-- Cache Hit Rate -->
        <div
          class="bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg p-4"
        >
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
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-orange-600">Cache Hit Rate</p>
              <p class="text-2xl font-semibold text-orange-900">
                {{ (analytics.cacheHitRate * 100).toFixed(1) }}%
              </p>
              <p class="text-xs text-orange-700">
                {{ analytics.cacheHits }}/{{ analytics.totalRequests }} hits
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Charts Section -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Generation Timeline -->
        <div class="bg-gray-50 rounded-lg p-4">
          <h4 class="text-sm font-medium text-gray-900 mb-4">
            Generation Timeline
          </h4>
          <div class="space-y-2">
            <div
              v-for="point in analytics.timeline"
              :key="point.timestamp"
              class="flex items-center justify-between"
            >
              <span class="text-sm text-gray-600">{{
                formatTime(point.timestamp)
              }}</span>
              <div class="flex items-center space-x-4">
                <div class="flex items-center space-x-2">
                  <div class="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span class="text-sm text-gray-700">{{
                    point.successful
                  }}</span>
                </div>
                <div class="flex items-center space-x-2">
                  <div class="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span class="text-sm text-gray-700">{{ point.failed }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Error Distribution -->
        <div class="bg-gray-50 rounded-lg p-4">
          <h4 class="text-sm font-medium text-gray-900 mb-4">
            Error Distribution
          </h4>
          <div class="space-y-3">
            <div
              v-for="error in analytics.errorTypes"
              :key="error.type"
              class="flex items-center justify-between"
            >
              <div class="flex-1">
                <div class="flex items-center justify-between mb-1">
                  <span class="text-sm font-medium text-gray-700">{{
                    error.type
                  }}</span>
                  <span class="text-sm text-gray-500">{{ error.count }}</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-2">
                  <div
                    class="bg-red-500 h-2 rounded-full transition-all duration-300"
                    :style="{
                      width: `${(error.count / analytics.totalErrors) * 100}%`,
                    }"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Knowledge Base Health -->
      <div class="bg-gray-50 rounded-lg p-4">
        <h4 class="text-sm font-medium text-gray-900 mb-4">
          Knowledge Base Health
        </h4>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <!-- Object Counts -->
          <div>
            <h5 class="text-xs font-medium text-gray-700 mb-2">
              Object Counts
            </h5>
            <div class="space-y-1">
              <div
                v-for="(count, type) in analytics.kbObjectCounts"
                :key="type"
                class="flex items-center justify-between text-sm"
              >
                <span class="text-gray-600 capitalize">{{
                  type.replace("_", " ")
                }}</span>
                <span class="font-medium text-gray-900">{{ count }}</span>
              </div>
            </div>
          </div>

          <!-- Quality Metrics -->
          <div>
            <h5 class="text-xs font-medium text-gray-700 mb-2">
              Quality Metrics
            </h5>
            <div class="space-y-1">
              <div class="flex items-center justify-between text-sm">
                <span class="text-gray-600">Avg Quality Score</span>
                <span class="font-medium text-gray-900">
                  {{ analytics.avgQualityScore.toFixed(1) }}/10
                </span>
              </div>
              <div class="flex items-center justify-between text-sm">
                <span class="text-gray-600">Active Objects</span>
                <span class="font-medium text-gray-900">
                  {{ analytics.activeObjectsPercent.toFixed(1) }}%
                </span>
              </div>
              <div class="flex items-center justify-between text-sm">
                <span class="text-gray-600">Stale Objects</span>
                <span class="font-medium text-gray-900">{{
                  analytics.staleObjects
                }}</span>
              </div>
            </div>
          </div>

          <!-- Usage Patterns -->
          <div>
            <h5 class="text-xs font-medium text-gray-700 mb-2">
              Usage Patterns
            </h5>
            <div class="space-y-1">
              <div class="flex items-center justify-between text-sm">
                <span class="text-gray-600">Most Used Object</span>
                <span class="font-medium text-gray-900 truncate">
                  {{ analytics.mostUsedObject }}
                </span>
              </div>
              <div class="flex items-center justify-between text-sm">
                <span class="text-gray-600">Unused Objects</span>
                <span class="font-medium text-gray-900">{{
                  analytics.unusedObjects
                }}</span>
              </div>
              <div class="flex items-center justify-between text-sm">
                <span class="text-gray-600">Preference Diversity</span>
                <span class="font-medium text-gray-900">
                  {{ analytics.preferenceDiversity.toFixed(2) }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- System Alerts -->
      <div
        v-if="analytics.alerts && analytics.alerts.length > 0"
        class="space-y-3"
      >
        <h4 class="text-sm font-medium text-gray-900">System Alerts</h4>
        <div
          v-for="alert in analytics.alerts"
          :key="alert.id"
          :class="[
            'p-4 rounded-md border',
            alert.severity === 'critical'
              ? 'bg-red-50 border-red-200'
              : alert.severity === 'warning'
                ? 'bg-yellow-50 border-yellow-200'
                : 'bg-blue-50 border-blue-200',
          ]"
        >
          <div class="flex items-start">
            <div class="flex-shrink-0">
              <svg
                :class="[
                  'h-5 w-5',
                  alert.severity === 'critical'
                    ? 'text-red-400'
                    : alert.severity === 'warning'
                      ? 'text-yellow-400'
                      : 'text-blue-400',
                ]"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  v-if="alert.severity === 'critical'"
                  fill-rule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clip-rule="evenodd"
                />
                <path
                  v-else
                  fill-rule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clip-rule="evenodd"
                />
              </svg>
            </div>
            <div class="ml-3 flex-1">
              <h5
                :class="[
                  'text-sm font-medium',
                  alert.severity === 'critical'
                    ? 'text-red-800'
                    : alert.severity === 'warning'
                      ? 'text-yellow-800'
                      : 'text-blue-800',
                ]"
              >
                {{ alert.title }}
              </h5>
              <p
                :class="[
                  'text-sm mt-1',
                  alert.severity === 'critical'
                    ? 'text-red-700'
                    : alert.severity === 'warning'
                      ? 'text-yellow-700'
                      : 'text-blue-700',
                ]"
              >
                {{ alert.message }}
              </p>
              <div class="mt-2 flex items-center space-x-2">
                <span
                  :class="[
                    'text-xs',
                    alert.severity === 'critical'
                      ? 'text-red-600'
                      : alert.severity === 'warning'
                        ? 'text-yellow-600'
                        : 'text-blue-600',
                  ]"
                >
                  {{ formatTime(alert.timestamp) }}
                </span>
                <button
                  @click="dismissAlert(alert.id)"
                  :class="[
                    'text-xs underline hover:no-underline',
                    alert.severity === 'critical'
                      ? 'text-red-700 hover:text-red-800'
                      : alert.severity === 'warning'
                        ? 'text-yellow-700 hover:text-yellow-800'
                        : 'text-blue-700 hover:text-blue-800',
                  ]"
                >
                  Dismiss
                </button>
              </div>
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
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";

interface SystemAlert {
  id: string;
  title: string;
  message: string;
  severity: "info" | "warning" | "critical";
  timestamp: string;
}

interface AnalyticsData {
  successRate: number;
  totalGenerations: number;
  successfulGenerations: number;
  avgResponseTime: number;
  p95ResponseTime: number;
  totalTokens: number;
  tokenCost: number;
  cacheHitRate: number;
  cacheHits: number;
  totalRequests: number;
  totalErrors: number;
  timeline: Array<{ timestamp: string; successful: number; failed: number }>;
  errorTypes: Array<{ type: string; count: number }>;
  kbObjectCounts: Record<string, number>;
  avgQualityScore: number;
  activeObjectsPercent: number;
  staleObjects: number;
  mostUsedObject: string;
  unusedObjects: number;
  preferenceDiversity: number;
  alerts?: SystemAlert[];
}

interface Props {
  title?: string;
  autoRefreshInterval?: number;
}

interface Emits {
  (e: "alertDismissed", alertId: string): void;
  (e: "error", error: string): void;
}

const props = withDefaults(defineProps<Props>(), {
  title: "System Analytics",
  autoRefreshInterval: 30000, // 30 seconds
});

const emit = defineEmits<Emits>();

// State
const analytics = ref<AnalyticsData | null>(null);
const isLoading = ref(false);
const selectedTimeRange = ref("24h");
const autoRefresh = ref(false);
let refreshInterval: NodeJS.Timeout | null = null;

// Methods
const loadAnalytics = async () => {
  isLoading.value = true;

  try {
    // Simulate API call - replace with actual API
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Mock data - replace with actual API response
    analytics.value = {
      successRate: 0.94,
      totalGenerations: 1247,
      successfulGenerations: 1172,
      avgResponseTime: 1850,
      p95ResponseTime: 3200,
      totalTokens: 125000,
      tokenCost: 12.5,
      cacheHitRate: 0.78,
      cacheHits: 972,
      totalRequests: 1247,
      totalErrors: 75,
      timeline: [
        { timestamp: "2024-01-01T12:00:00Z", successful: 45, failed: 3 },
        { timestamp: "2024-01-01T13:00:00Z", successful: 52, failed: 2 },
        { timestamp: "2024-01-01T14:00:00Z", successful: 38, failed: 5 },
        { timestamp: "2024-01-01T15:00:00Z", successful: 41, failed: 1 },
      ],
      errorTypes: [
        { type: "Validation Error", count: 28 },
        { type: "Token Limit Exceeded", count: 18 },
        { type: "API Timeout", count: 15 },
        { type: "Quality Gate Failed", count: 14 },
      ],
      kbObjectCounts: {
        style_pack: 12,
        motif: 45,
        glossary: 8,
        rule: 23,
        fewshot: 15,
      },
      avgQualityScore: 7.8,
      activeObjectsPercent: 89.2,
      staleObjects: 7,
      mostUsedObject: "Mediterranean Line Art",
      unusedObjects: 3,
      preferenceDiversity: 0.73,
      alerts: [
        {
          id: "alert_1",
          title: "High Error Rate",
          message: "Error rate has increased to 8.2% in the last hour",
          severity: "warning",
          timestamp: "2024-01-01T15:30:00Z",
        },
        {
          id: "alert_2",
          title: "Token Budget Alert",
          message: "Monthly token usage is at 85% of budget",
          severity: "info",
          timestamp: "2024-01-01T14:45:00Z",
        },
      ],
    };
  } catch (err) {
    const errorMessage =
      err instanceof Error ? err.message : "Failed to load analytics";
    emit("error", errorMessage);
  } finally {
    isLoading.value = false;
  }
};

const toggleAutoRefresh = () => {
  autoRefresh.value = !autoRefresh.value;

  if (autoRefresh.value) {
    refreshInterval = setInterval(loadAnalytics, props.autoRefreshInterval);
  } else if (refreshInterval) {
    clearInterval(refreshInterval);
    refreshInterval = null;
  }
};

const exportData = () => {
  if (!analytics.value) return;

  const data = JSON.stringify(analytics.value, null, 2);
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = `system-analytics-${selectedTimeRange.value}-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
};

const dismissAlert = (alertId: string) => {
  if (analytics.value?.alerts) {
    analytics.value.alerts = analytics.value.alerts.filter(
      (alert) => alert.id !== alertId
    );
  }
  emit("alertDismissed", alertId);
};

// Utility functions
const formatNumber = (num: number): string => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
};

const formatTime = (timestamp: string): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

// Lifecycle
onMounted(() => {
  loadAnalytics();
});

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval);
  }
});
</script>
