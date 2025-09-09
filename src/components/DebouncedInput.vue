<template>
  <div class="relative">
    <!-- Input Element -->
    <component
      :is="inputComponent"
      ref="inputRef"
      v-model="internalValue"
      v-bind="inputProps"
      :class="inputClasses"
      :disabled="disabled || isProcessing"
      @input="handleInput"
      @focus="handleFocus"
      @blur="handleBlur"
      @keydown="handleKeydown"
    />

    <!-- Loading Indicator -->
    <div
      v-if="showLoadingIndicator && (isProcessing || isDebouncing)"
      class="absolute right-2 top-1/2 transform -translate-y-1/2"
    >
      <svg
        class="animate-spin h-4 w-4 text-gray-400"
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
    </div>

    <!-- Character Count -->
    <div
      v-if="showCharacterCount && maxLength"
      class="absolute right-2 bottom-1 text-xs text-gray-400"
    >
      {{ internalValue.length }}/{{ maxLength }}
    </div>

    <!-- Validation Message -->
    <div
      v-if="validationMessage"
      :class="[
        'mt-1 text-xs',
        validationState === 'error'
          ? 'text-red-600'
          : validationState === 'warning'
            ? 'text-yellow-600'
            : 'text-green-600',
      ]"
    >
      {{ validationMessage }}
    </div>

    <!-- Suggestions Dropdown -->
    <div
      v-if="showSuggestions && suggestions.length > 0"
      class="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto"
    >
      <div
        v-for="(suggestion, index) in suggestions"
        :key="getSuggestionKey(suggestion, index)"
        :class="[
          'px-3 py-2 cursor-pointer transition-colors',
          index === selectedSuggestionIndex
            ? 'bg-blue-50 text-blue-900'
            : 'hover:bg-gray-50',
        ]"
        @click="selectSuggestion(suggestion)"
        @mouseenter="selectedSuggestionIndex = index"
      >
        <div class="flex items-center justify-between">
          <span class="truncate">{{ getSuggestionText(suggestion) }}</span>
          <span
            v-if="getSuggestionMeta(suggestion)"
            class="text-xs text-gray-500 ml-2"
          >
            {{ getSuggestionMeta(suggestion) }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from "vue";
import { advancedDebounce } from "../utils/debounce";

interface Suggestion {
  text: string;
  value?: any;
  meta?: string;
}

interface Props {
  modelValue: string;
  debounceMs?: number;
  minLength?: number;
  maxLength?: number;
  placeholder?: string;
  disabled?: boolean;
  type?: "input" | "textarea";
  rows?: number;
  showLoadingIndicator?: boolean;
  showCharacterCount?: boolean;
  showSuggestions?: boolean;
  suggestions?: (string | Suggestion)[];
  validateOnInput?: boolean;
  validationRules?: Array<(value: string) => string | null>;
  class?: string;
  isProcessing?: boolean;
}

interface Emits {
  (e: "update:modelValue", value: string): void;
  (e: "debouncedInput", value: string): void;
  (e: "focus", event: FocusEvent): void;
  (e: "blur", event: FocusEvent): void;
  (e: "enter", value: string): void;
  (e: "suggestionSelect", suggestion: string | Suggestion): void;
  (
    e: "validationChange",
    state: "valid" | "error" | "warning",
    message: string
  ): void;
}

const props = withDefaults(defineProps<Props>(), {
  debounceMs: 300,
  minLength: 0,
  type: "input",
  rows: 3,
  showLoadingIndicator: true,
  showCharacterCount: false,
  showSuggestions: false,
  suggestions: () => [],
  validateOnInput: true,
  validationRules: () => [],
});

const emit = defineEmits<Emits>();

// Refs
const inputRef = ref<HTMLInputElement | HTMLTextAreaElement>();
const internalValue = ref(props.modelValue);
const isDebouncing = ref(false);
const isFocused = ref(false);
const selectedSuggestionIndex = ref(-1);
const validationState = ref<"valid" | "error" | "warning">("valid");
const validationMessage = ref("");

// Computed properties
const inputComponent = computed(() =>
  props.type === "textarea" ? "textarea" : "input"
);

const inputProps = computed(() => {
  const baseProps: any = {
    placeholder: props.placeholder,
    maxlength: props.maxLength,
  };

  if (props.type === "textarea") {
    baseProps.rows = props.rows;
  }

  return baseProps;
});

const inputClasses = computed(() => {
  const baseClasses = [
    "w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors",
    props.class || "",
  ];

  // Validation state classes
  if (validationState.value === "error") {
    baseClasses.push("border-red-300 focus:border-red-500 focus:ring-red-500");
  } else if (validationState.value === "warning") {
    baseClasses.push(
      "border-yellow-300 focus:border-yellow-500 focus:ring-yellow-500"
    );
  } else {
    baseClasses.push("border-gray-300 focus:border-blue-500");
  }

  // Processing state
  if (props.isProcessing || isDebouncing.value) {
    baseClasses.push("pr-8");
  }

  // Character count spacing
  if (props.showCharacterCount && props.maxLength) {
    baseClasses.push("pb-6");
  }

  return baseClasses.join(" ");
});

// Debounced function
const debouncedEmit = advancedDebounce((value: string) => {
  isDebouncing.value = false;
  emit("debouncedInput", value);
}, props.debounceMs);

// Methods
const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement | HTMLTextAreaElement;
  internalValue.value = target.value;

  // Immediate validation if enabled
  if (props.validateOnInput) {
    validateInput(internalValue.value);
  }

  // Reset suggestion selection
  selectedSuggestionIndex.value = -1;

  // Debounced emit
  if (internalValue.value.length >= props.minLength) {
    isDebouncing.value = true;
    debouncedEmit(internalValue.value);
  }
};

const handleFocus = (event: FocusEvent) => {
  isFocused.value = true;
  emit("focus", event);
};

const handleBlur = (event: FocusEvent) => {
  // Delay blur to allow suggestion clicks
  setTimeout(() => {
    isFocused.value = false;
    emit("blur", event);
  }, 150);
};

const handleKeydown = (event: KeyboardEvent) => {
  if (props.showSuggestions && suggestions.value.length > 0) {
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        selectedSuggestionIndex.value = Math.min(
          selectedSuggestionIndex.value + 1,
          suggestions.value.length - 1
        );
        break;

      case "ArrowUp":
        event.preventDefault();
        selectedSuggestionIndex.value = Math.max(
          selectedSuggestionIndex.value - 1,
          -1
        );
        break;

      case "Enter":
        event.preventDefault();
        if (selectedSuggestionIndex.value >= 0) {
          selectSuggestion(suggestions.value[selectedSuggestionIndex.value]);
        } else {
          emit("enter", internalValue.value);
        }
        break;

      case "Escape":
        selectedSuggestionIndex.value = -1;
        inputRef.value?.blur();
        break;
    }
  } else if (event.key === "Enter" && props.type === "input") {
    emit("enter", internalValue.value);
  }
};

const validateInput = (value: string): void => {
  if (props.validationRules.length === 0) {
    validationState.value = "valid";
    validationMessage.value = "";
    return;
  }

  for (const rule of props.validationRules) {
    const result = rule(value);
    if (result) {
      validationState.value = "error";
      validationMessage.value = result;
      emit("validationChange", "error", result);
      return;
    }
  }

  validationState.value = "valid";
  validationMessage.value = "";
  emit("validationChange", "valid", "");
};

const selectSuggestion = (suggestion: string | Suggestion) => {
  const text = typeof suggestion === "string" ? suggestion : suggestion.text;
  internalValue.value = text;
  selectedSuggestionIndex.value = -1;
  emit("suggestionSelect", suggestion);
  inputRef.value?.focus();
};

const getSuggestionKey = (
  suggestion: string | Suggestion,
  index: number
): string => {
  if (typeof suggestion === "string") return suggestion;
  return suggestion.value || suggestion.text || index.toString();
};

const getSuggestionText = (suggestion: string | Suggestion): string => {
  return typeof suggestion === "string" ? suggestion : suggestion.text;
};

const getSuggestionMeta = (
  suggestion: string | Suggestion
): string | undefined => {
  return typeof suggestion === "string" ? undefined : suggestion.meta;
};

// Computed for filtered suggestions
const suggestions = computed(() => {
  if (!props.showSuggestions || !isFocused.value || !internalValue.value) {
    return [];
  }

  const query = internalValue.value.toLowerCase();
  return props.suggestions.filter((suggestion) => {
    const text = getSuggestionText(suggestion).toLowerCase();
    return text.includes(query);
  });
});

const showSuggestions = computed(() => {
  return (
    props.showSuggestions && isFocused.value && suggestions.value.length > 0
  );
});

// Watch for external value changes
watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue !== internalValue.value) {
      internalValue.value = newValue;
      if (props.validateOnInput) {
        validateInput(newValue);
      }
    }
  }
);

// Watch for internal value changes
watch(internalValue, (newValue) => {
  emit("update:modelValue", newValue);
});

// Focus method for parent components
const focus = () => {
  inputRef.value?.focus();
};

const blur = () => {
  inputRef.value?.blur();
};

const select = () => {
  inputRef.value?.select();
};

// Expose methods
defineExpose({
  focus,
  blur,
  select,
  validate: () => validateInput(internalValue.value),
});

// Lifecycle
onMounted(() => {
  if (props.validateOnInput && internalValue.value) {
    validateInput(internalValue.value);
  }
});

onUnmounted(() => {
  // Cancel any pending debounced calls
  debouncedEmit.cancel();
});
</script>
