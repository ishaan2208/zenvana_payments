type RazorpayCheckoutInput = {
  keyId: string;
  orderId: string;
  amount: number;
  currency: string;
  name?: string;
  description?: string;
  onSuccess?: () => void | Promise<void>;
  onDismiss?: () => void;
};

type RazorpayFailure = {
  error?: { description?: string };
};

type RazorpayInstance = {
  open: () => void;
  on: (event: string, handler: (response: RazorpayFailure) => void) => void;
};

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => RazorpayInstance;
  }
}

let scriptPromise: Promise<void> | null = null;

export function loadRazorpayCheckoutScript(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("RAZORPAY_NO_WINDOW"));
  }
  if (window.Razorpay) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("RAZORPAY_SCRIPT_FAILED"));
    document.body.appendChild(script);
  });

  return scriptPromise;
}

export async function openRazorpayCheckout(input: RazorpayCheckoutInput): Promise<void> {
  await loadRazorpayCheckoutScript();
  if (!window.Razorpay) throw new Error("RAZORPAY_UNAVAILABLE");

  return new Promise((resolve, reject) => {
    const rzp = new window.Razorpay!({
      key: input.keyId,
      order_id: input.orderId,
      amount: input.amount,
      currency: input.currency,
      name: input.name ?? "Zenvana",
      description: input.description ?? "Payment collection",
      handler: async () => {
        try {
          await input.onSuccess?.();
          resolve();
        } catch (err) {
          reject(err instanceof Error ? err : new Error("RAZORPAY_VERIFY_FAILED"));
        }
      },
      modal: {
        ondismiss: () => {
          input.onDismiss?.();
          resolve();
        },
      },
    });

    rzp.on("payment.failed", (response) => {
      reject(new Error(response?.error?.description ?? "Payment failed"));
    });
    rzp.open();
  });
}
