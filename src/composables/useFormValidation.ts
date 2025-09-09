import { ref, computed, reactive } from "vue";
import type { ValidationError } from "./useErrorHandler";

interface ValidationRule {
  field: string;
  isValid: boolean;
  message?: string;
  code?: string;
}

interface FormField {
  isValid: boolean;
  message?: string;
  code?: string;
  isDirty: boolean;
  isTouched: boolean;
}

export function useFormValidation() {
  // Form state
  const fields = reactive<Record<string, FormField>>({});
  const isSubmitting = ref(false);
  const submitAttempted = ref(false);

  // Computed properties
  const isFormValid = computed(() => {
    return Object.values(fields).every((field) => field.isValid);
  });

  const hasErrors = computed(() => {
    return Object.values(fields).some(
      (field) => !field.isValid && (field.isTouched || submitAttempted.value)
    );
  });

  const errorCount = computed(() => {
    return Object.values(fields).filter(
      (field) => !field.isValid && (field.isTouched || submitAttempted.value)
    ).length;
  });

  const fieldErrors = computed(() => {
    const errors: Record<string, string> = {};
    Object.entries(fields).forEach(([fieldName, field]) => {
      if (
        !field.isValid &&
        (field.isTouched || submitAttempted.value) &&
        field.message
      ) {
        errors[fieldName] = field.message;
      }
    });
    return errors;
  });

  const validationErrors = computed((): ValidationError[] => {
    return Object.entries(fields)
      .filter(
        ([_, field]) =>
          !field.isValid &&
          (field.isTouched || submitAttempted.value) &&
          field.message
      )
      .map(([fieldName, field]) => ({
        field: fieldName,
        message: field.message!,
        code: field.code,
      }));
  });

  const allErrors = computed(() => {
    return Object.values(fieldErrors.value);
  });

  // Methods
  const registerField = (
    fieldName: string,
    initialState: Partial<FormField> = {}
  ) => {
    fields[fieldName] = {
      isValid: true,
      message: undefined,
      isDirty: false,
      isTouched: false,
      ...initialState,
    };
  };

  const updateFieldValidation = (
    fieldName: string,
    isValid: boolean,
    message?: string,
    code?: string
  ) => {
    if (!fields[fieldName]) {
      registerField(fieldName);
    }

    fields[fieldName].isValid = isValid;
    fields[fieldName].message = message;
    fields[fieldName].code = code;

    if (!isValid || message) {
      fields[fieldName].isDirty = true;
    }
  };

  const touchField = (fieldName: string) => {
    if (fields[fieldName]) {
      fields[fieldName].isTouched = true;
    }
  };

  const markFieldDirty = (fieldName: string) => {
    if (fields[fieldName]) {
      fields[fieldName].isDirty = true;
    }
  };

  const resetField = (fieldName: string) => {
    if (fields[fieldName]) {
      fields[fieldName] = {
        isValid: true,
        message: undefined,
        code: undefined,
        isDirty: false,
        isTouched: false,
      };
    }
  };

  const resetForm = () => {
    Object.keys(fields).forEach((fieldName) => {
      resetField(fieldName);
    });
    isSubmitting.value = false;
    submitAttempted.value = false;
  };

  const validateForm = (): boolean => {
    submitAttempted.value = true;

    // Touch all fields to show validation errors
    Object.keys(fields).forEach((fieldName) => {
      touchField(fieldName);
    });

    return isFormValid.value;
  };

  const setSubmitting = (submitting: boolean) => {
    isSubmitting.value = submitting;
  };

  const getFieldState = (fieldName: string): FormField | null => {
    return fields[fieldName] || null;
  };

  const shouldShowError = (fieldName: string): boolean => {
    const field = fields[fieldName];
    return field
      ? !field.isValid && (field.isTouched || submitAttempted.value)
      : false;
  };

  const getFieldError = (fieldName: string): string | undefined => {
    const field = fields[fieldName];
    return shouldShowError(fieldName) ? field?.message : undefined;
  };

  // Validation helpers
  const createValidationHandler = (fieldName: string) => {
    return (isValid: boolean, message?: string, code?: string) => {
      updateFieldValidation(fieldName, isValid, message, code);
    };
  };

  const createTouchHandler = (fieldName: string) => {
    return () => {
      touchField(fieldName);
    };
  };

  const createInputHandler = (fieldName: string) => {
    return () => {
      markFieldDirty(fieldName);
    };
  };

  // Batch validation
  const validateFields = (rules: ValidationRule[]) => {
    rules.forEach((rule) => {
      updateFieldValidation(rule.field, rule.isValid, rule.message);
    });
  };

  return {
    // State
    fields,
    isSubmitting,
    submitAttempted,

    // Computed
    isFormValid,
    hasErrors,
    errorCount,
    fieldErrors,
    validationErrors,
    allErrors,

    // Methods
    registerField,
    updateFieldValidation,
    touchField,
    markFieldDirty,
    resetField,
    resetForm,
    validateForm,
    setSubmitting,
    getFieldState,
    shouldShowError,
    getFieldError,

    // Helpers
    createValidationHandler,
    createTouchHandler,
    createInputHandler,
    validateFields,
  };
}
