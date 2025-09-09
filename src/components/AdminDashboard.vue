<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <header class="bg-white shadow-sm border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <div class="flex items-center">
            <h1 class="text-xl font-semibold text-gray-900">
              SVG AI Administration
            </h1>
          </div>
          <div class="flex items-center space-x-4">
            <!-- System Status -->
            <div class="flex items-center space-x-2">
              <div
                :class="[
                  'w-2 h-2 rounded-full',
                  systemStatus === 'healthy'
                    ? 'bg-green-400'
                    : systemStatus === 'warning'
                      ? 'bg-yellow-400'
                      : 'bg-red-400',
                ]"
              ></div>
              <span class="text-xs text-gray-500 capitalize">
                {{ systemStatus }}
              </span>
            </div>

            <!-- User Info -->
            <div class="text-sm text-gray-500">Admin User</div>
          </div>
        </div>
      </div>
    </header>

    <!-- Navigation Tabs -->
    <div class="bg-white border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav class="flex space-x-8">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            @click="activeTab = tab.id"
            :class="[
              'py-4 px-1 border-b-2 font-medium text-sm transition-colors',
              activeTab === tab.id
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
            ]"
          >
            <svg
              class="w-5 h-5 inline mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                :d="tab.icon"
              />
            </svg>
            {{ tab.label }}
            <span
              v-if="tab.badge"
              class="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800"
            >
              {{ tab.badge }}
            </span>
          </button>
        </nav>
      </div>
    </div>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Overview Tab -->
      <div v-if="activeTab === 'overview'" class="space-y-6">
        <!-- Quick Stats -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div class="bg-white rounded-lg shadow p-6">
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
                    d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                  />
                </svg>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-500">
                  Total KB Objects
                </p>
                <p class="text-2xl font-semibold text-gray-900">
                  {{ overviewStats.totalObjects }}
                </p>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-lg shadow p-6">
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
                <p class="text-sm font-medium text-gray-500">Active Objects</p>
                <p class="text-2xl font-semibold text-gray-900">
                  {{ overviewStats.activeObjects }}
                </p>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-lg shadow p-6">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <svg
                  class="h-8 w-8 text-yellow-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-500">Pending Review</p>
                <p class="text-2xl font-semibold text-gray-900">
                  {{ overviewStats.pendingReview }}
                </p>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-lg shadow p-6">
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
                    d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                  />
                </svg>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-500">
                  Avg Quality Score
                </p>
                <p class="text-2xl font-semibold text-gray-900">
                  {{ overviewStats.avgQuality.toFixed(1) }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Recent Activity -->
        <div class="bg-white rounded-lg shadow">
          <div class="px-6 py-4 border-b border-gray-200">
            <h3 class="text-lg font-medium text-gray-900">Recent Activity</h3>
          </div>
          <div class="divide-y divide-gray-200">
            <div
              v-for="activity in recentActivity"
              :key="activity.id"
              class="px-6 py-4 flex items-center justify-between"
            >
              <div class="flex items-center space-x-3">
                <div
                  :class="[
                    'flex-shrink-0 w-2 h-2 rounded-full',
                    activity.type === 'created'
                      ? 'bg-green-400'
                      : activity.type === 'updated'
                        ? 'bg-blue-400'
                        : activity.type === 'deprecated'
                          ? 'bg-yellow-400'
                          : 'bg-red-400',
                  ]"
                />
                <div>
                  <p class="text-sm font-medium text-gray-900">
                    {{ activity.title }}
                  </p>
                  <p class="text-sm text-gray-500">
                    {{ activity.description }}
                  </p>
                </div>
              </div>
              <div class="text-sm text-gray-500">
                {{ formatTime(activity.timestamp) }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Knowledge Base Tab -->
      <div v-if="activeTab === 'knowledge-base'">
        <KBObjectManager
          @object-created="handleObjectCreated"
          @object-updated="handleObjectUpdated"
          @object-deleted="handleObjectDeleted"
          @error="handleError"
        />
      </div>

      <!-- Analytics Tab -->
      <div v-if="activeTab === 'analytics'">
        <SystemAnalytics
          @alert-dismissed="handleAlertDismissed"
          @error="handleError"
        />
      </div>

      <!-- System Health Tab -->
      <div v-if="activeTab === 'system-health'" class="space-y-6">
        <!-- Health Checks -->
        <div class="bg-white rounded-lg shadow">
          <div class="px-6 py-4 border-b border-gray-200">
            <h3 class="text-lg font-medium text-gray-900">
              System Health Checks
            </h3>
          </div>
          <div class="p-6">
            <div class="space-y-4">
              <div
                v-for="check in healthChecks"
                :key="check.name"
                class="flex items-center justify-between p-4 border rounded-lg"
                :class="
                  check.status === 'healthy'
                    ? 'border-green-200 bg-green-50'
                    : check.status === 'warning'
                      ? 'border-yellow-200 bg-yellow-50'
                      : 'border-red-200 bg-red-50'
                "
              >
                <div class="flex items-center space-x-3">
                  <div
                    :class="[
                      'w-3 h-3 rounded-full',
                      check.status === 'healthy'
                        ? 'bg-green-500'
                        : check.status === 'warning'
                          ? 'bg-yellow-500'
                          : 'bg-red-500',
                    ]"
                  />
                  <div>
                    <p class="font-medium text-gray-900">{{ check.name }}</p>
                    <p class="text-sm text-gray-600">{{ check.description }}</p>
                  </div>
                </div>
                <div class="text-right">
                  <p class="text-sm font-medium text-gray-900">
                    {{ check.value }}
                  </p>
                  <p class="text-xs text-gray-500">
                    Last checked: {{ formatTime(check.lastChecked) }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- System Configuration -->
        <div class="bg-white rounded-lg shadow">
          <div class="px-6 py-4 border-b border-gray-200">
            <h3 class="text-lg font-medium text-gray-900">
              System Configuration
            </h3>
          </div>
          <div class="p-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 class="text-sm font-medium text-gray-900 mb-3">
                  Cache Settings
                </h4>
                <div class="space-y-2 text-sm">
                  <div class="flex justify-between">
                    <span class="text-gray-600">Grounding Cache TTL</span>
                    <span class="font-medium"
                      >{{ config.groundingCacheTTL }}min</span
                    >
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-600">Max Cache Size</span>
                    <span class="font-medium">{{ config.maxCacheSize }}MB</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-600">Cache Hit Rate Target</span>
                    <span class="font-medium"
                      >{{ config.cacheHitRateTarget }}%</span
                    >
                  </div>
                </div>
              </div>

              <div>
                <h4 class="text-sm font-medium text-gray-900 mb-3">
                  Quality Settings
                </h4>
                <div class="space-y-2 text-sm">
                  <div class="flex justify-between">
                    <span class="text-gray-600">Min Quality Score</span>
                    <span class="font-medium"
                      >{{ config.minQualityScore }}/10</span
                    >
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-600"
                      >Auto Deprecation Threshold</span
                    >
                    <span class="font-medium"
                      >{{ config.autoDeprecationDays }} days</span
                    >
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-600">Preference Cap</span>
                    <span class="font-medium">{{ config.preferenceCap }}x</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Audit Log Tab -->
      <div v-if="activeTab === 'audit-log'" class="space-y-6">
        <!-- Filters -->
        <div class="bg-white rounded-lg shadow p-6">
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2"
                >Action Type</label
              >
              <select
                v-model="auditFilters.actionType"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                @change="loadAuditLog"
              >
                <option value="">All Actions</option>
                <option value="created">Created</option>
                <option value="updated">Updated</option>
                <option value="deprecated">Deprecated</option>
                <option value="deleted">Deleted</option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2"
                >Object Type</label
              >
              <select
                v-model="auditFilters.objectType"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                @change="loadAuditLog"
              >
                <option value="">All Types</option>
                <option value="style_pack">Style Packs</option>
                <option value="motif">Motifs</option>
                <option value="glossary">Glossary</option>
                <option value="rule">Rules</option>
                <option value="fewshot">Few-shot Examples</option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2"
                >Date Range</label
              >
              <select
                v-model="auditFilters.dateRange"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                @change="loadAuditLog"
              >
                <option value="24h">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="90d">Last 90 Days</option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2"
                >User</label
              >
              <input
                v-model="auditFilters.userId"
                type="text"
                placeholder="User ID or name"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                @input="debouncedLoadAuditLog"
              />
            </div>
          </div>
        </div>

        <!-- Audit Log Entries -->
        <div class="bg-white rounded-lg shadow">
          <div class="px-6 py-4 border-b border-gray-200">
            <h3 class="text-lg font-medium text-gray-900">Audit Log</h3>
          </div>
          <div class="divide-y divide-gray-200">
            <div v-for="entry in auditLog" :key="entry.id" class="px-6 py-4">
              <div class="flex items-start justify-between">
                <div class="flex-1">
                  <div class="flex items-center space-x-2 mb-2">
                    <span
                      :class="[
                        'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
                        entry.action === 'created'
                          ? 'bg-green-100 text-green-800'
                          : entry.action === 'updated'
                            ? 'bg-blue-100 text-blue-800'
                            : entry.action === 'deprecated'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800',
                      ]"
                    >
                      {{ entry.action }}
                    </span>
                    <span class="text-sm font-medium text-gray-900">{{
                      entry.objectTitle
                    }}</span>
                    <span class="text-xs text-gray-500"
                      >({{ entry.objectType }})</span
                    >
                  </div>
                  <p class="text-sm text-gray-600 mb-2">
                    {{ entry.description }}
                  </p>
                  <div
                    class="flex items-center space-x-4 text-xs text-gray-500"
                  >
                    <span>User: {{ entry.userId || "System" }}</span>
                    <span>{{ formatTime(entry.timestamp) }}</span>
                    <span v-if="entry.reason">Reason: {{ entry.reason }}</span>
                  </div>
                </div>
                <button
                  v-if="entry.beforeState || entry.afterState"
                  @click="showAuditDetails(entry)"
                  class="text-sm text-blue-600 hover:text-blue-800 underline"
                >
                  View Details
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Toast Notifications -->
    <div
      v-if="notification"
      class="fixed bottom-4 right-4 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50"
    >
      <div class="flex items-center">
        <div
          :class="[
            'flex-shrink-0 w-2 h-2 rounded-full mr-3',
            notification.type === 'success'
              ? 'bg-green-400'
              : notification.type === 'warning'
                ? 'bg-yellow-400'
                : 'bg-red-400',
          ]"
        />
        <p class="text-sm text-gray-900">{{ notification.message }}</p>
        <button
          @click="notification = null"
          class="ml-4 text-gray-400 hover:text-gray-600"
        >
          <svg
            class="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { debounce } from "../utils/debounce";
import KBObjectManager from "./KBObjectManager.vue";
import SystemAnalytics from "./SystemAnalytics.vue";

interface Tab {
  id: string;
  label: string;
  icon: string;
  badge?: number;
}

interface OverviewStats {
  totalObjects: number;
  activeObjects: number;
  pendingReview: number;
  avgQuality: number;
}

interface Activity {
  id: string;
  type: "created" | "updated" | "deprecated" | "deleted";
  title: string;
  description: string;
  timestamp: string;
}

interface HealthCheck {
  name: string;
  description: string;
  status: "healthy" | "warning" | "critical";
  value: string;
  lastChecked: string;
}

interface SystemConfig {
  groundingCacheTTL: number;
  maxCacheSize: number;
  cacheHitRateTarget: number;
  minQualityScore: number;
  autoDeprecationDays: number;
  preferenceCap: number;
}

interface AuditEntry {
  id: string;
  action: "created" | "updated" | "deprecated" | "deleted";
  objectId: string;
  objectTitle: string;
  objectType: string;
  description: string;
  userId?: string;
  timestamp: string;
  reason?: string;
  beforeState?: any;
  afterState?: any;
}

interface Notification {
  type: "success" | "warning" | "error";
  message: string;
}

// State
const activeTab = ref("overview");
const systemStatus = ref<"healthy" | "warning" | "critical">("healthy");
const notification = ref<Notification | null>(null);

const tabs: Tab[] = [
  {
    id: "overview",
    label: "Overview",
    icon: "M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z",
  },
  {
    id: "knowledge-base",
    label: "Knowledge Base",
    icon: "M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4",
    badge: 3,
  },
  {
    id: "analytics",
    label: "Analytics",
    icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
  },
  {
    id: "system-health",
    label: "System Health",
    icon: "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z",
  },
  {
    id: "audit-log",
    label: "Audit Log",
    icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
  },
];

// Data
const overviewStats = ref<OverviewStats>({
  totalObjects: 103,
  activeObjects: 92,
  pendingReview: 3,
  avgQuality: 7.8,
});

const recentActivity = ref<Activity[]>([
  {
    id: "1",
    type: "created",
    title: "New Style Pack Created",
    description: "Mediterranean Line Art v2.0 added to knowledge base",
    timestamp: "2024-01-01T15:30:00Z",
  },
  {
    id: "2",
    type: "updated",
    title: "Motif Updated",
    description: "Simple House motif quality score improved to 8.2",
    timestamp: "2024-01-01T14:45:00Z",
  },
  {
    id: "3",
    type: "deprecated",
    title: "Rule Deprecated",
    description: "Old stroke width rule marked as deprecated",
    timestamp: "2024-01-01T13:20:00Z",
  },
]);

const healthChecks = ref<HealthCheck[]>([
  {
    name: "Database Connection",
    description: "PostgreSQL connection and query performance",
    status: "healthy",
    value: "< 50ms",
    lastChecked: "2024-01-01T15:45:00Z",
  },
  {
    name: "OpenAI API",
    description: "LLM service availability and response times",
    status: "healthy",
    value: "< 2s",
    lastChecked: "2024-01-01T15:44:00Z",
  },
  {
    name: "Cache Performance",
    description: "Redis cache hit rate and memory usage",
    status: "warning",
    value: "72% hit rate",
    lastChecked: "2024-01-01T15:43:00Z",
  },
  {
    name: "Token Budget",
    description: "Monthly API token usage tracking",
    status: "healthy",
    value: "65% used",
    lastChecked: "2024-01-01T15:42:00Z",
  },
]);

const config = ref<SystemConfig>({
  groundingCacheTTL: 10,
  maxCacheSize: 512,
  cacheHitRateTarget: 80,
  minQualityScore: 6.0,
  autoDeprecationDays: 120,
  preferenceCap: 1.5,
});

const auditFilters = ref({
  actionType: "",
  objectType: "",
  dateRange: "7d",
  userId: "",
});

const auditLog = ref<AuditEntry[]>([
  {
    id: "audit_1",
    action: "created",
    objectId: "obj_123",
    objectTitle: "Mediterranean Line Art v2.0",
    objectType: "style_pack",
    description: "New style pack created with improved color palette",
    userId: "admin_user",
    timestamp: "2024-01-01T15:30:00Z",
    reason: "User request for Mediterranean theme",
  },
  {
    id: "audit_2",
    action: "updated",
    objectId: "obj_456",
    objectTitle: "Simple House",
    objectType: "motif",
    description: "Quality score updated from 7.1 to 8.2",
    userId: "curator_user",
    timestamp: "2024-01-01T14:45:00Z",
    reason: "Improved compatibility test results",
  },
]);

// Methods
const showNotification = (type: Notification["type"], message: string) => {
  notification.value = { type, message };
  setTimeout(() => {
    notification.value = null;
  }, 5000);
};

const handleObjectCreated = (object: any) => {
  overviewStats.value.totalObjects++;
  overviewStats.value.activeObjects++;
  showNotification("success", `Created ${object.title}`);
};

const handleObjectUpdated = (object: any) => {
  showNotification("success", `Updated ${object.title}`);
};

const handleObjectDeleted = (_objectId: string) => {
  overviewStats.value.totalObjects--;
  showNotification("success", "Object deleted");
};

const handleAlertDismissed = (alertId: string) => {
  console.log("Alert dismissed:", alertId);
};

const handleError = (error: string) => {
  showNotification("error", error);
};

const loadAuditLog = async () => {
  // Simulate API call to load audit log with filters
  console.log("Loading audit log with filters:", auditFilters.value);
};

const debouncedLoadAuditLog = debounce(loadAuditLog, 300);

const showAuditDetails = (entry: AuditEntry) => {
  // Show modal with before/after state comparison
  console.log("Show audit details for:", entry);
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
  // Load initial data
  loadAuditLog();
});
</script>
