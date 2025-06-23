import { ref, type Ref } from "vue";
import { v4 as uuidv4 } from "uuid";

interface ErrorMessage {
  id: string;
  message: string;
  type?: "error" | "warning" | "info";
  duration?: number;
}

export const useErrorHandler = () => {
  const errors: Ref<ErrorMessage[]> = ref([]);

  const showError = (
    message: string,
    type: ErrorMessage["type"] = "error",
    duration = 5000
  ) => {
    const id = uuidv4();
    errors.value.push({ id, message, type, duration });
    if (duration > 0) {
      setTimeout(() => {
        clearError(id);
      }, duration);
    }
  };

  const clearError = (id: string) => {
    errors.value = errors.value.filter((error) => error.id !== id);
  };

  const clearAllErrors = () => {
    errors.value = [];
  };

  return {
    errors,
    showError,
    clearError,
    clearAllErrors,
  };
};
