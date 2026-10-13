import { Toast } from "@base-ui/react/toast";

/** Uses the nearest screen's ToastProvider; no global notification state. */
export function useToast() {
  return Toast.useToastManager();
}
