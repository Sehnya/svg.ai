<template>
  <div class="bg-white rounded-lg shadow-sm border border-gray-200">
    <!-- Header -->
    <div class="flex items-center justify-between p-4 border-b border-gray-200">
      <h3 class="text-lg font-medium text-gray-900">{{ title }}</h3>

      <div class="flex items-center space-x-2">
        <!-- Object Type Filter -->
        <select
          v-model="selectedObjectType"
          class="text-sm border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          @change="loadObjects"
        >
          <option value="">All Types</option>
          <option value="style_pack">Style Packs</option>
          <option value="motif">Motifs</option>
          <option value="glossary">Glossary</option>
          <option value="rule">Rules</option>
          <option value="fewshot">Few-shot Examples</option>
        </select>

        <!-- Status Filter -->
        <select
          v-model="selectedStatus"
          class="text-sm border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          @change="loadObjects"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="deprecated">Deprecated</option>
          <option value="experimental">Experimental</option>
        </select>

        <!-- Create New Button -->
        <button
          @click="showCreateModal = true"
          class="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <svg
            class="w-4 h-4 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 4v16m8-8H4"
            />
          </svg>
          Create Object
        </button>
      </div>
    </div>

    <!-- Search and Filters -->
    <div class="p-4 border-b border-gray-200 bg-gray-50">
      <div class="flex items-center space-x-4">
        <!-- Search Input -->
        <div class="flex-1">
          <div class="relative">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search objects by title, tags, or content..."
              class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              @input="debouncedSearch"
            />
            <div
              class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
            >
              <svg
                class="h-5 w-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>
        </div>

        <!-- Sort Options -->
        <select
          v-model="sortBy"
          class="text-sm border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          @change="loadObjects"
        >
          <option value="updated_at">Last Updated</option>
          <option value="created_at">Created Date</option>
          <option value="title">Title</option>
          <option value="quality_score">Quality Score</option>
          <option value="usage_count">Usage Count</option>
        </select>

        <select
          v-model="sortOrder"
          class="text-sm border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          @change="loadObjects"
        >
          <option value="desc">Descending</option>
          <option value="asc">Ascending</option>
        </select>
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
        <p class="text-sm text-gray-600">Loading objects...</p>
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
            <h3 class="text-sm font-medium text-red-800">
              Error Loading Objects
            </h3>
            <p class="text-sm text-red-700 mt-1">{{ error }}</p>
            <button
              @click="loadObjects"
              class="mt-2 text-sm text-red-800 underline hover:text-red-900"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Objects List -->
    <div v-else-if="objects.length > 0" class="divide-y divide-gray-200">
      <div
        v-for="object in objects"
        :key="object.id"
        class="p-4 hover:bg-gray-50 transition-colors"
      >
        <div class="flex items-start justify-between">
          <!-- Object Info -->
          <div class="flex-1 min-w-0">
            <div class="flex items-center space-x-2 mb-2">
              <h4 class="text-sm font-medium text-gray-900 truncate">
                {{ object.title }}
              </h4>

              <!-- Object Type Badge -->
              <span
                :class="[
                  'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
                  getTypeBadgeClasses(object.kind),
                ]"
              >
                {{ formatObjectType(object.kind) }}
              </span>

              <!-- Status Badge -->
              <span
                :class="[
                  'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
                  getStatusBadgeClasses(object.status),
                ]"
              >
                {{ object.status }}
              </span>

              <!-- Version -->
              <span class="text-xs text-gray-500 font-mono">
                v{{ object.version }}
              </span>
            </div>

            <!-- Tags -->
            <div
              v-if="object.tags?.length > 0"
              class="flex flex-wrap gap-1 mb-2"
            >
              <span
                v-for="tag in object.tags"
                :key="tag"
                class="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-800"
              >
                {{ tag }}
              </span>
            </div>

            <!-- Metadata -->
            <div class="flex items-center space-x-4 text-xs text-gray-500">
              <span>Quality: {{ object.quality_score.toFixed(1) }}/10</span>
              <span>Usage: {{ object.usage_count || 0 }}</span>
              <span>Updated: {{ formatDate(object.updated_at) }}</span>
              <span v-if="object.parent_id">
                Derived from: {{ object.parent_id.slice(0, 8) }}...
              </span>
            </div>

            <!-- Content Preview -->
            <div
              v-if="showContentPreview"
              class="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-700 font-mono max-h-20 overflow-hidden"
            >
              {{ getContentPreview(object.body) }}
            </div>
          </div>

          <!-- Actions -->
          <div class="flex items-center space-x-2 ml-4">
            <!-- Test Button -->
            <button
              @click="testObject(object)"
              :disabled="isTestingObject === object.id"
              class="p-2 text-gray-400 hover:text-blue-600 transition-colors"
              title="Test with canonical prompts"
            >
              <svg
                :class="[
                  'w-4 h-4',
                  isTestingObject === object.id ? 'animate-spin' : '',
                ]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
            </button>

            <!-- Edit Button -->
            <button
              @click="editObject(object)"
              class="p-2 text-gray-400 hover:text-blue-600 transition-colors"
              title="Edit object"
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
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
            </button>

            <!-- Clone Button -->
            <button
              @click="cloneObject(object)"
              class="p-2 text-gray-400 hover:text-green-600 transition-colors"
              title="Create new version"
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
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
            </button>

            <!-- Status Toggle -->
            <button
              @click="toggleObjectStatus(object)"
              :class="[
                'p-2 transition-colors',
                object.status === 'active'
                  ? 'text-green-600 hover:text-yellow-600'
                  : 'text-gray-400 hover:text-green-600',
              ]"
              :title="
                object.status === 'active'
                  ? 'Deprecate object'
                  : 'Activate object'
              "
            >
              <svg
                v-if="object.status === 'active'"
                class="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M10 14L21 3m0 0h-5.5M21 3v5.5M13 21H3a2 2 0 01-2-2V9a2 2 0 012-2h4l2-2h4a2 2 0 012 2v2"
                />
              </svg>
              <svg
                v-else
                class="w-4 h-4"
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
            </button>

            <!-- Delete Button -->
            <button
              @click="deleteObject(object)"
              class="p-2 text-gray-400 hover:text-red-600 transition-colors"
              title="Delete object"
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
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          </div>
        </div>

        <!-- Test Results -->
        <div
          v-if="testResults[object.id]"
          class="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md"
        >
          <h5 class="text-sm font-medium text-blue-800 mb-2">Test Results</h5>
          <div class="space-y-1 text-sm text-blue-700">
            <div
              v-for="result in testResults[object.id]"
              :key="result.prompt"
              class="flex items-center justify-between"
            >
              <span class="truncate">{{ result.prompt }}</span>
              <span
                :class="[
                  'px-2 py-0.5 rounded text-xs font-medium',
                  result.passed
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800',
                ]"
              >
                {{ result.passed ? "Pass" : "Fail" }}
              </span>
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
            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
          />
        </svg>
        <p class="text-sm text-gray-500">No knowledge base objects found</p>
        <button
          @click="showCreateModal = true"
          class="mt-2 text-sm text-blue-600 hover:text-blue-800 underline"
        >
          Create your first object
        </button>
      </div>
    </div>

    <!-- Pagination -->
    <div
      v-if="totalPages > 1"
      class="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50"
    >
      <div class="text-sm text-gray-700">
        Showing {{ (currentPage - 1) * pageSize + 1 }} to
        {{ Math.min(currentPage * pageSize, totalObjects) }} of
        {{ totalObjects }} objects
      </div>

      <div class="flex items-center space-x-2">
        <button
          @click="currentPage = Math.max(1, currentPage - 1)"
          :disabled="currentPage === 1"
          class="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>

        <span class="text-sm text-gray-700">
          Page {{ currentPage }} of {{ totalPages }}
        </span>

        <button
          @click="currentPage = Math.min(totalPages, currentPage + 1)"
          :disabled="currentPage === totalPages"
          class="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <KBObjectModal
      v-if="showCreateModal || editingObject"
      :object="editingObject"
      :is-editing="!!editingObject"
      @save="handleSaveObject"
      @cancel="handleCancelEdit"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { debounce } from "../utils/debounce";
import KBObjectModal from "./KBObjectModal.vue";

interface KBObject {
  id: string;
  kind: "style_pack" | "motif" | "glossary" | "rule" | "fewshot";
  title: string;
  body: any;
  tags: string[];
  version: string;
  status: "active" | "deprecated" | "experimental";
  quality_score: number;
  usage_count?: number;
  created_at: string;
  updated_at: string;
  parent_id?: string;
}

interface TestResult {
  prompt: string;
  passed: boolean;
  score?: number;
}

interface Props {
  title?: string;
  showContentPreview?: boolean;
  pageSize?: number;
}

interface Emits {
  (e: "objectCreated", object: KBObject): void;
  (e: "objectUpdated", object: KBObject): void;
  (e: "objectDeleted", objectId: string): void;
  (e: "error", error: string): void;
}

const props = withDefaults(defineProps<Props>(), {
  title: "Knowledge Base Objects",
  showContentPreview: true,
  pageSize: 20,
});

const emit = defineEmits<Emits>();

// State
const objects = ref<KBObject[]>([]);
const isLoading = ref(false);
const error = ref<string | null>(null);
const searchQuery = ref("");
const selectedObjectType = ref("");
const selectedStatus = ref("");
const sortBy = ref("updated_at");
const sortOrder = ref("desc");
const currentPage = ref(1);
const totalObjects = ref(0);
const showCreateModal = ref(false);
const editingObject = ref<KBObject | null>(null);
const isTestingObject = ref<string | null>(null);
const testResults = ref<Record<string, TestResult[]>>({});

// Computed properties
const totalPages = computed(() =>
  Math.ceil(totalObjects.value / props.pageSize)
);

// Debounced search
const debouncedSearch = debounce(() => {
  currentPage.value = 1;
  loadObjects();
}, 300);

// Methods
const loadObjects = async () => {
  isLoading.value = true;
  error.value = null;

  try {
    // Simulate API call - replace with actual API
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Mock data - replace with actual API response
    const mockObjects: KBObject[] = [
      {
        id: "obj_1",
        kind: "style_pack",
        title: "Mediterranean Line Art",
        body: { colors: ["#3B82F6", "#EF4444"], strokeRules: { minWidth: 1 } },
        tags: ["mediterranean", "line-art", "blue", "red"],
        version: "1.2.0",
        status: "active",
        quality_score: 8.5,
        usage_count: 42,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-15T00:00:00Z",
      },
      {
        id: "obj_2",
        kind: "motif",
        title: "Simple House",
        body: { shape: "house", complexity: "simple" },
        tags: ["house", "building", "simple"],
        version: "1.0.0",
        status: "active",
        quality_score: 7.2,
        usage_count: 18,
        created_at: "2024-01-02T00:00:00Z",
        updated_at: "2024-01-10T00:00:00Z",
      },
      {
        id: "obj_3",
        kind: "glossary",
        title: "Geometric Terms",
        body: { terms: { circle: "round shape", square: "four-sided shape" } },
        tags: ["geometry", "shapes", "definitions"],
        version: "2.1.0",
        status: "experimental",
        quality_score: 6.8,
        usage_count: 5,
        created_at: "2024-01-03T00:00:00Z",
        updated_at: "2024-01-20T00:00:00Z",
        parent_id: "obj_glossary_old",
      },
    ];

    // Apply filters
    let filteredObjects = mockObjects;

    if (selectedObjectType.value) {
      filteredObjects = filteredObjects.filter(
        (obj) => obj.kind === selectedObjectType.value
      );
    }

    if (selectedStatus.value) {
      filteredObjects = filteredObjects.filter(
        (obj) => obj.status === selectedStatus.value
      );
    }

    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase();
      filteredObjects = filteredObjects.filter(
        (obj) =>
          obj.title.toLowerCase().includes(query) ||
          obj.tags.some((tag) => tag.toLowerCase().includes(query)) ||
          JSON.stringify(obj.body).toLowerCase().includes(query)
      );
    }

    // Apply sorting
    filteredObjects.sort((a, b) => {
      let aValue = a[sortBy.value as keyof KBObject];
      let bValue = b[sortBy.value as keyof KBObject];

      if (typeof aValue === "string" && typeof bValue === "string") {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (sortOrder.value === "asc") {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    totalObjects.value = filteredObjects.length;

    // Apply pagination
    const startIndex = (currentPage.value - 1) * props.pageSize;
    const endIndex = startIndex + props.pageSize;
    objects.value = filteredObjects.slice(startIndex, endIndex);
  } catch (err) {
    const errorMessage =
      err instanceof Error ? err.message : "Failed to load objects";
    error.value = errorMessage;
    emit("error", errorMessage);
  } finally {
    isLoading.value = false;
  }
};

const testObject = async (object: KBObject) => {
  isTestingObject.value = object.id;

  try {
    // Simulate compatibility testing with canonical prompts
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const mockResults: TestResult[] = [
      { prompt: "blue circle", passed: true, score: 0.85 },
      { prompt: "simple house", passed: object.kind === "motif", score: 0.72 },
      { prompt: "geometric pattern", passed: true, score: 0.68 },
    ];

    testResults.value[object.id] = mockResults;
  } catch (err) {
    console.error("Test failed:", err);
  } finally {
    isTestingObject.value = null;
  }
};

const editObject = (object: KBObject) => {
  editingObject.value = { ...object };
};

const cloneObject = (object: KBObject) => {
  const cloned = {
    ...object,
    id: `${object.id}_clone_${Date.now()}`,
    title: `${object.title} (Copy)`,
    version: "1.0.0",
    parent_id: object.id,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  editingObject.value = cloned;
};

const toggleObjectStatus = async (object: KBObject) => {
  const newStatus = object.status === "active" ? "deprecated" : "active";

  if (
    newStatus === "deprecated" &&
    !confirm(`Are you sure you want to deprecate "${object.title}"?`)
  ) {
    return;
  }

  try {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500));

    object.status = newStatus;
    object.updated_at = new Date().toISOString();

    emit("objectUpdated", object);
  } catch (err) {
    const errorMessage =
      err instanceof Error ? err.message : "Failed to update object status";
    emit("error", errorMessage);
  }
};

const deleteObject = async (object: KBObject) => {
  if (!confirm(`Are you sure you want to delete "${object.title}"?`)) {
    return;
  }

  try {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500));

    objects.value = objects.value.filter((obj) => obj.id !== object.id);
    totalObjects.value--;

    emit("objectDeleted", object.id);
  } catch (err) {
    const errorMessage =
      err instanceof Error ? err.message : "Failed to delete object";
    emit("error", errorMessage);
  }
};

const handleSaveObject = async (object: KBObject) => {
  try {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    if (
      editingObject.value &&
      objects.value.find((obj) => obj.id === object.id)
    ) {
      // Update existing object
      const index = objects.value.findIndex((obj) => obj.id === object.id);
      objects.value[index] = object;
      emit("objectUpdated", object);
    } else {
      // Create new object
      objects.value.unshift(object);
      totalObjects.value++;
      emit("objectCreated", object);
    }

    showCreateModal.value = false;
    editingObject.value = null;
  } catch (err) {
    const errorMessage =
      err instanceof Error ? err.message : "Failed to save object";
    emit("error", errorMessage);
  }
};

const handleCancelEdit = () => {
  showCreateModal.value = false;
  editingObject.value = null;
};

// Utility functions
const getTypeBadgeClasses = (kind: string): string => {
  const classes = {
    style_pack: "bg-purple-100 text-purple-800",
    motif: "bg-blue-100 text-blue-800",
    glossary: "bg-green-100 text-green-800",
    rule: "bg-yellow-100 text-yellow-800",
    fewshot: "bg-pink-100 text-pink-800",
  };
  return classes[kind as keyof typeof classes] || "bg-gray-100 text-gray-800";
};

const getStatusBadgeClasses = (status: string): string => {
  const classes = {
    active: "bg-green-100 text-green-800",
    deprecated: "bg-red-100 text-red-800",
    experimental: "bg-yellow-100 text-yellow-800",
  };
  return classes[status as keyof typeof classes] || "bg-gray-100 text-gray-800";
};

const formatObjectType = (kind: string): string => {
  const labels = {
    style_pack: "Style Pack",
    motif: "Motif",
    glossary: "Glossary",
    rule: "Rule",
    fewshot: "Few-shot",
  };
  return labels[kind as keyof typeof labels] || kind;
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const getContentPreview = (body: any): string => {
  const content = JSON.stringify(body, null, 2);
  return content.length > 200 ? content.substring(0, 200) + "..." : content;
};

// Lifecycle
onMounted(() => {
  loadObjects();
});
</script>
