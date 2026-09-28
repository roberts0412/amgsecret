"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";
import { type Consent, CONSENT_EVENT, readConsent } from "@/lib/consent";

declare global {
  interface Window {
    adsbygoogle?: unknown[] & { requestNonPersonalizedAds?: number };
  }
}

/**
 * Unidade do AdSense (100px fixos). Só carrega depois da escolha de cookies:
 * "all" = anúncios normais; "essential" = anúncios NÃO personalizados.
 */
export function AdSenseUnit({ client, slot }: { client: string; slot: string }) {
  const [consent, setConsent] = useState<Consent | null>(null);
  const pushed = useRef(false);

  useEffect(() => {
    setConsent(readConsent(document.cookie));
    const onChange = (e: Event) => setConsent((e as CustomEvent<Consent>).detail);
    window.addEventListener(CONSENT_EVENT, onChange);
    return () => window.removeEventListener(CONSENT_EVENT, onChange);
  }, []);

  useEffect(() => {
    if (!consent || pushed.current) return;
    pushed.current = true;
    try {
      const q = (window.adsbygoogle = window.adsbygoogle || []);
      if (consent === "essential") q.requestNonPersonalizedAds = 1;
      q.push({});
    } catch {
      // bloqueador de anúncios ou falha do script: a página segue normal
    }
  }, [consent]);

  if (!consent) return null; // sem escolha, nenhum script de terceiros
  return (
    <>
      <Script
        id="adsbygoogle-js"
        src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${client}`}
        strategy="lazyOnload"
        crossOrigin="anonymous"
      />
      <ins
        className="adsbygoogle"
        style={{ display: "block", width: "100%", height: "100px" }}
        data-ad-client={client}
        data-ad-slot={slot}
      />
    </>
  );
}
