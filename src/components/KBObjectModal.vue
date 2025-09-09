<template>
  <!-- Modal Overlay -->
  <div class="fixed inset-0 z-50 overflow-y-auto">
    <div
      class="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0"
    >
      <!-- Background overlay -->
      <div
        class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
        @click="$emit('cancel')"
      ></div>

      <!-- Modal panel -->
      <div
        class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full"
      >
        <!-- Header -->
        <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg leading-6 font-medium text-gray-900">
              {{
                isEditing
                  ? "Edit Knowledge Base Object"
                  : "Create Knowledge Base Object"
              }}
            </h3>
            <button
              @click="$emit('cancel')"
              class="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg
                class="w-6 h-6"
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

          <!-- Form -->
          <form @submit.prevent="handleSubmit" class="space-y-6">
            <!-- Basic Information -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <!-- Object Type -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Object Type *
                </label>
                <select
                  v-model="formData.kind"
                  :disabled="isEditing"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                  required
                >
                  <option value="">Select type...</option>
                  <option value="style_pack">Style Pack</option>
                  <option value="motif">Motif</option>
                  <option value="glossary">Glossary</option>
                  <option value="rule">Rule</option>
                  <option value="fewshot">Few-shot Example</option>
                </select>
              </div>

              <!-- Status -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  v-model="formData.status"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="active">Active</option>
                  <option value="experimental">Experimental</option>
                  <option value="deprecated">Deprecated</option>
                </select>
              </div>
            </div>

            <!-- Title -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Title *
              </label>
              <input
                v-model="formData.title"
                type="text"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter a descriptive title"
                required
              />
            </div>

            <!-- Tags -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Tags
              </label>
              <div class="flex flex-wrap gap-2 mb-2">
                <span
                  v-for="(tag, index) in formData.tags"
                  :key="index"
                  class="inline-flex items-center px-2 py-1 rounded-md text-sm bg-blue-100 text-blue-800"
                >
                  {{ tag }}
                  <button
                    type="button"
                    @click="removeTag(index)"
                    class="ml-1 text-blue-600 hover:text-blue-800"
                  >
                    <svg
                      class="w-3 h-3"
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
                </span>
              </div>
              <div class="flex">
                <input
                  v-model="newTag"
                  type="text"
                  class="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Add tag..."
                  @keydown.enter.prevent="addTag"
                />
                <button
                  type="button"
                  @click="addTag"
                  class="px-4 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Add
                </button>
              </div>
            </div>

            <!-- Content Editor -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Content *
              </label>

              <!-- Content Type Tabs -->
              <div class="flex border-b border-gray-200 mb-4">
                <button
                  type="button"
                  @click="contentMode = 'json'"
                  :class="[
                    'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
                    contentMode === 'json'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700',
                  ]"
                >
                  JSON Editor
                </button>
                <button
                  type="button"
                  @click="contentMode = 'form'"
                  :class="[
                    'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
                    contentMode === 'form'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700',
                  ]"
                >
                  Form Editor
                </button>
              </div>

              <!-- JSON Editor -->
              <div v-if="contentMode === 'json'">
                <textarea
                  v-model="contentJson"
                  rows="12"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                  placeholder="Enter JSON content..."
                  @input="validateJson"
                />
                <div v-if="jsonError" class="mt-2 text-sm text-red-600">
                  {{ jsonError }}
                </div>
                <div class="mt-2 text-xs text-gray-500">
                  Token estimate: {{ tokenEstimate }} / 500 ({{
                    tokenEstimate > 500 ? "Over limit!" : "OK"
                  }})
                </div>
              </div>

              <!-- Form Editor -->
              <div v-else-if="contentMode === 'form'" class="space-y-4">
                <!-- Style Pack Form -->
                <div v-if="formData.kind === 'style_pack'" class="space-y-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2"
                      >Colors</label
                    >
                    <div class="flex flex-wrap gap-2 mb-2">
                      <div
                        v-for="(color, index) in stylePackForm.colors"
                        :key="index"
                        class="flex items-center space-x-2 bg-gray-50 rounded px-2 py-1"
                      >
                        <div
                          class="w-4 h-4 rounded border border-gray-300"
                          :style="{ backgroundColor: color }"
                        />
                        <span class="text-sm font-mono">{{ color }}</span>
                        <button
                          type="button"
                          @click="stylePackForm.colors.splice(index, 1)"
                          class="text-red-500 hover:text-red-700"
                        >
                          <svg
                            class="w-3 h-3"
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
                    <div class="flex">
                      <input
                        v-model="newColor"
                        type="color"
                        class="w-12 h-10 border border-gray-300 rounded-l-md"
                      />
                      <input
                        v-model="newColor"
                        type="text"
                        class="flex-1 px-3 py-2 border-t border-b border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="#000000"
                      />
                      <button
                        type="button"
                        @click="addColor"
                        class="px-4 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700"
                      >
                        Add
                      </button>
                    </div>
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2"
                      >Stroke Rules</label
                    >
                    <div class="grid grid-cols-2 gap-4">
                      <div>
                        <label class="block text-xs text-gray-600 mb-1"
                          >Min Width</label
                        >
                        <input
                          v-model.number="stylePackForm.strokeRules.minWidth"
                          type="number"
                          min="0.1"
                          step="0.1"
                          class="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label class="block text-xs text-gray-600 mb-1"
                          >Max Width</label
                        >
                        <input
                          v-model.number="stylePackForm.strokeRules.maxWidth"
                          type="number"
                          min="0.1"
                          step="0.1"
                          class="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Motif Form -->
                <div v-else-if="formData.kind === 'motif'" class="space-y-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2"
                      >Shape Type</label
                    >
                    <select
                      v-model="motifForm.shape"
                      class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="circle">Circle</option>
                      <option value="square">Square</option>
                      <option value="triangle">Triangle</option>
                      <option value="house">House</option>
                      <option value="star">Star</option>
                      <option value="custom">Custom</option>
                    </select>
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2"
                      >Complexity</label
                    >
                    <select
                      v-model="motifForm.complexity"
                      class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="simple">Simple</option>
                      <option value="moderate">Moderate</option>
                      <option value="complex">Complex</option>
                    </select>
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2"
                      >Description</label
                    >
                    <textarea
                      v-model="motifForm.description"
                      rows="3"
                      class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Describe the motif..."
                    />
                  </div>
                </div>

                <!-- Generic form for other types -->
                <div v-else>
                  <p class="text-sm text-gray-600 mb-4">
                    Use the JSON editor for
                    {{ formatObjectType(formData.kind || "unknown") }} objects.
                  </p>
                  <button
                    type="button"
                    @click="contentMode = 'json'"
                    class="text-blue-600 hover:text-blue-800 underline"
                  >
                    Switch to JSON Editor
                  </button>
                </div>
              </div>
            </div>

            <!-- Version and Parent -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Version
                </label>
                <input
                  v-model="formData.version"
                  type="text"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="1.0.0"
                  pattern="^\d+\.\d+\.\d+$"
                  title="Use semantic versioning (e.g., 1.0.0)"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Parent Object ID
                </label>
                <input
                  v-model="formData.parent_id"
                  type="text"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Optional parent object ID"
                />
              </div>
            </div>

            <!-- Quality Score -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Quality Score (0-10)
              </label>
              <input
                v-model.number="formData.quality_score"
                type="number"
                min="0"
                max="10"
                step="0.1"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </form>
        </div>

        <!-- Footer -->
        <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
          <button
            @click="handleSubmit"
            :disabled="!isFormValid || isSaving"
            class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg
              v-if="isSaving"
              class="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
            {{
              isSaving
                ? "Saving..."
                : isEditing
                  ? "Update Object"
                  : "Create Object"
            }}
          </button>

          <button
            @click="$emit('cancel')"
            type="button"
            class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
          >
            Cancel
          </button>

          <!-- Test Button -->
          <button
            v-if="isFormValid"
            @click="testObject"
            :disabled="isTesting"
            type="button"
            class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
          >
            <svg
              v-if="isTesting"
              class="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-700"
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
            {{ isTesting ? "Testing..." : "Test Object" }}
          </button>
        </div>

        <!-- Test Results -->
        <div
          v-if="testResults.length > 0"
          class="border-t border-gray-200 bg-blue-50 px-4 py-3"
        >
          <h4 class="text-sm font-medium text-blue-800 mb-2">Test Results</h4>
          <div class="space-y-1">
            <div
              v-for="result in testResults"
              :key="result.prompt"
              class="flex items-center justify-between text-sm"
            >
              <span class="text-blue-700">{{ result.prompt }}</span>
              <span
                :class="[
                  'px-2 py-0.5 rounded text-xs font-medium',
                  result.passed
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800',
                ]"
              >
                {{ result.passed ? "Pass" : "Fail" }}
                {{ result.score ? `(${result.score.toFixed(2)})` : "" }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";

interface KBObject {
  id: string;
  kind: "style_pack" | "motif" | "glossary" | "rule" | "fewshot";
  title: string;
  body: any;
  tags: string[];
  version: string;
  status: "active" | "deprecated" | "experimental";
  quality_score: number;
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
  object?: KBObject | null;
  isEditing?: boolean;
}

interface Emits {
  (e: "save", object: KBObject): void;
  (e: "cancel"): void;
}

const props = withDefaults(defineProps<Props>(), {
  object: null,
  isEditing: false,
});

const emit = defineEmits<Emits>();

// State
const isSaving = ref(false);
const isTesting = ref(false);
const contentMode = ref<"json" | "form">("form");
const jsonError = ref<string | null>(null);
const newTag = ref("");
const newColor = ref("#000000");
const testResults = ref<TestResult[]>([]);

// Form data
const formData = ref<Partial<KBObject>>({
  kind: "style_pack",
  title: "",
  body: {},
  tags: [],
  version: "1.0.0",
  status: "active",
  quality_score: 5.0,
  parent_id: "",
});

// Form-specific data
const stylePackForm = ref({
  colors: ["#3B82F6", "#EF4444"],
  strokeRules: {
    minWidth: 1,
    maxWidth: 4,
  },
});

const motifForm = ref({
  shape: "circle",
  complexity: "simple",
  description: "",
});

// Computed properties
const contentJson = computed({
  get: () => {
    if (contentMode.value === "form") {
      // Convert form data to JSON
      if (formData.value.kind === "style_pack") {
        return JSON.stringify(stylePackForm.value, null, 2);
      } else if (formData.value.kind === "motif") {
        return JSON.stringify(motifForm.value, null, 2);
      }
    }
    return JSON.stringify(formData.value.body || {}, null, 2);
  },
  set: (value: string) => {
    try {
      const parsed = JSON.parse(value);
      formData.value.body = parsed;
      jsonError.value = null;
    } catch (err) {
      jsonError.value = "Invalid JSON format";
    }
  },
});

const tokenEstimate = computed(() => {
  // Rough token estimation (1 token ≈ 4 characters)
  const content = JSON.stringify(formData.value.body || {});
  return Math.ceil(content.length / 4);
});

const isFormValid = computed(() => {
  return (
    formData.value.kind &&
    formData.value.title &&
    formData.value.version &&
    !jsonError.value &&
    tokenEstimate.value <= 500
  );
});

// Watch for form changes to update body
watch(
  [stylePackForm, motifForm],
  () => {
    if (contentMode.value === "form") {
      if (formData.value.kind === "style_pack") {
        formData.value.body = { ...stylePackForm.value };
      } else if (formData.value.kind === "motif") {
        formData.value.body = { ...motifForm.value };
      }
    }
  },
  { deep: true }
);

// Methods
const addTag = () => {
  if (
    newTag.value.trim() &&
    !formData.value.tags?.includes(newTag.value.trim())
  ) {
    formData.value.tags = [...(formData.value.tags || []), newTag.value.trim()];
    newTag.value = "";
  }
};

const removeTag = (index: number) => {
  formData.value.tags?.splice(index, 1);
};

const addColor = () => {
  if (newColor.value && !stylePackForm.value.colors.includes(newColor.value)) {
    stylePackForm.value.colors.push(newColor.value);
    newColor.value = "#000000";
  }
};

const validateJson = () => {
  try {
    JSON.parse(contentJson.value);
    jsonError.value = null;
  } catch (err) {
    jsonError.value = "Invalid JSON format";
  }
};

const testObject = async () => {
  if (!isFormValid.value) return;

  isTesting.value = true;
  testResults.value = [];

  try {
    // Simulate compatibility testing
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const mockResults: TestResult[] = [
      { prompt: "blue circle", passed: true, score: 0.85 },
      {
        prompt: "simple house",
        passed: formData.value.kind === "motif",
        score: 0.72,
      },
      { prompt: "geometric pattern", passed: true, score: 0.68 },
    ];

    testResults.value = mockResults;
  } catch (err) {
    console.error("Test failed:", err);
  } finally {
    isTesting.value = false;
  }
};

const handleSubmit = async () => {
  if (!isFormValid.value) return;

  isSaving.value = true;

  try {
    const now = new Date().toISOString();
    const objectData: KBObject = {
      id: props.object?.id || `obj_${Date.now()}`,
      kind: formData.value.kind!,
      title: formData.value.title!,
      body: formData.value.body!,
      tags: formData.value.tags || [],
      version: formData.value.version!,
      status: formData.value.status!,
      quality_score: formData.value.quality_score || 5.0,
      created_at: props.object?.created_at || now,
      updated_at: now,
      parent_id: formData.value.parent_id || undefined,
    };

    emit("save", objectData);
  } catch (err) {
    console.error("Save failed:", err);
  } finally {
    isSaving.value = false;
  }
};

const formatObjectType = (kind: string): string => {
  const labels = {
    style_pack: "Style Pack",
    motif: "Motif",
    glossary: "Glossary",
    rule: "Rule",
    fewshot: "Few-shot Example",
  };
  return labels[kind as keyof typeof labels] || kind;
};

// Initialize form data
onMounted(() => {
  if (props.object) {
    formData.value = { ...props.object };

    // Initialize form-specific data
    if (props.object.kind === "style_pack" && props.object.body) {
      stylePackForm.value = { ...stylePackForm.value, ...props.object.body };
    } else if (props.object.kind === "motif" && props.object.body) {
      motifForm.value = { ...motifForm.value, ...props.object.body };
    }
  }
});
</script>
