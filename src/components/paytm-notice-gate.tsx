"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function PaytmNoticeGate({ children }: { children: React.ReactNode }) {
  const [acknowledged, setAcknowledged] = useState(false);

  if (!acknowledged) {
    return (
      <div className="fixed inset-0 z-[300] flex items-center justify-center bg-[#050505]/80 p-4 backdrop-blur-sm">
        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="paytm-notice-title"
          aria-describedby="paytm-notice-body"
          className="quiet-card w-full max-w-md bg-card/95 p-6 sm:p-7"
        >
          <p className="eyebrow text-accent">Important</p>
          <h2 id="paytm-notice-title" className="display mt-2 text-xl text-foreground">
            Paytm is working normally
          </h2>
          <p id="paytm-notice-body" className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Paytm is working normally as usual. Use that. If in case you still want to use this app
            then proceed.
          </p>
          <div className="mt-6 flex justify-end">
            <Button size="lg" onClick={() => setAcknowledged(true)}>
              Yes, proceed
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
