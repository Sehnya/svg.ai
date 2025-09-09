"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useFormValidation = useFormValidation;
var vue_1 = require("vue");
function useFormValidation() {
    // Form state
    var fields = (0, vue_1.reactive)({});
    var isSubmitting = (0, vue_1.ref)(false);
    var submitAttempted = (0, vue_1.ref)(false);
    // Computed properties
    var isFormValid = (0, vue_1.computed)(function () {
        return Object.values(fields).every(function (field) { return field.isValid; });
    });
    var hasErrors = (0, vue_1.computed)(function () {
        return Object.values(fields).some(function (field) { return !field.isValid && (field.isTouched || submitAttempted.value); });
    });
    var errorCount = (0, vue_1.computed)(function () {
        return Object.values(fields).filter(function (field) { return !field.isValid && (field.isTouched || submitAttempted.value); }).length;
    });
    var fieldErrors = (0, vue_1.computed)(function () {
        var errors = {};
        Object.entries(fields).forEach(function (_a) {
            var fieldName = _a[0], field = _a[1];
            if (!field.isValid &&
                (field.isTouched || submitAttempted.value) &&
                field.message) {
                errors[fieldName] = field.message;
            }
        });
        return errors;
    });
    var validationErrors = (0, vue_1.computed)(function () {
        return Object.entries(fields)
            .filter(function (_a) {
            var _ = _a[0], field = _a[1];
            return !field.isValid &&
                (field.isTouched || submitAttempted.value) &&
                field.message;
        })
            .map(function (_a) {
            var fieldName = _a[0], field = _a[1];
            return ({
                field: fieldName,
                message: field.message,
                code: field.code,
            });
        });
    });
    var allErrors = (0, vue_1.computed)(function () {
        return Object.values(fieldErrors.value);
    });
    // Methods
    var registerField = function (fieldName, initialState) {
        if (initialState === void 0) { initialState = {}; }
        fields[fieldName] = __assign({ isValid: true, message: undefined, isDirty: false, isTouched: false }, initialState);
    };
    var updateFieldValidation = function (fieldName, isValid, message, code) {
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
    var touchField = function (fieldName) {
        if (fields[fieldName]) {
            fields[fieldName].isTouched = true;
        }
    };
    var markFieldDirty = function (fieldName) {
        if (fields[fieldName]) {
            fields[fieldName].isDirty = true;
        }
    };
    var resetField = function (fieldName) {
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
    var resetForm = function () {
        Object.keys(fields).forEach(function (fieldName) {
            resetField(fieldName);
        });
        isSubmitting.value = false;
        submitAttempted.value = false;
    };
    var validateForm = function () {
        submitAttempted.value = true;
        // Touch all fields to show validation errors
        Object.keys(fields).forEach(function (fieldName) {
            touchField(fieldName);
        });
        return isFormValid.value;
    };
    var setSubmitting = function (submitting) {
        isSubmitting.value = submitting;
    };
    var getFieldState = function (fieldName) {
        return fields[fieldName] || null;
    };
    var shouldShowError = function (fieldName) {
        var field = fields[fieldName];
        return field
            ? !field.isValid && (field.isTouched || submitAttempted.value)
            : false;
    };
    var getFieldError = function (fieldName) {
        var field = fields[fieldName];
        return shouldShowError(fieldName) ? field === null || field === void 0 ? void 0 : field.message : undefined;
    };
    // Validation helpers
    var createValidationHandler = function (fieldName) {
        return function (isValid, message, code) {
            updateFieldValidation(fieldName, isValid, message, code);
        };
    };
    var createTouchHandler = function (fieldName) {
        return function () {
            touchField(fieldName);
        };
    };
    var createInputHandler = function (fieldName) {
        return function () {
            markFieldDirty(fieldName);
        };
    };
    // Batch validation
    var validateFields = function (rules) {
        rules.forEach(function (rule) {
            updateFieldValidation(rule.field, rule.isValid, rule.message);
        });
    };
    return {
        // State
        fields: fields,
        isSubmitting: isSubmitting,
        submitAttempted: submitAttempted,
        // Computed
        isFormValid: isFormValid,
        hasErrors: hasErrors,
        errorCount: errorCount,
        fieldErrors: fieldErrors,
        validationErrors: validationErrors,
        allErrors: allErrors,
        // Methods
        registerField: registerField,
        updateFieldValidation: updateFieldValidation,
        touchField: touchField,
        markFieldDirty: markFieldDirty,
        resetField: resetField,
        resetForm: resetForm,
        validateForm: validateForm,
        setSubmitting: setSubmitting,
        getFieldState: getFieldState,
        shouldShowError: shouldShowError,
        getFieldError: getFieldError,
        // Helpers
        createValidationHandler: createValidationHandler,
        createTouchHandler: createTouchHandler,
        createInputHandler: createInputHandler,
        validateFields: validateFields,
    };
}
