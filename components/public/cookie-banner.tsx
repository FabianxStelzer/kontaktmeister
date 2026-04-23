"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "km_cookie_ack";

export function CookieBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (!window.localStorage.getItem(STORAGE_KEY)) setShow(true);
    } catch {
      /* ignore */
    }
  }, []);

  if (!show) return null;

  return (
    <div className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-xl rounded-xl border bg-card p-4 shadow-2xl">
      <p className="text-sm">
        Diese Seite verwendet nur technisch notwendige Cookies sowie anonyme Besuchsmessung zur
        Erfolgsauswertung. Details in unserer{" "}
        <a href="/datenschutz" className="underline">
          Datenschutzerklaerung
        </a>
        .
      </p>
      <div className="mt-3 flex justify-end">
        <Button
          size="sm"
          onClick={() => {
            try {
              window.localStorage.setItem(STORAGE_KEY, "1");
            } catch {
              /* ignore */
            }
            setShow(false);
          }}
        >
          Verstanden
        </Button>
      </div>
    </div>
  );
}
