"use client";

import Script from "next/script";
import { useEffect, useRef } from "react";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

/** Unidade do AdSense com altura fixa de 100px (formato discreto). */
export function AdSenseUnit({ client, slot }: { client: string; slot: string }) {
  const pushed = useRef(false);
  useEffect(() => {
    if (pushed.current) return;
    pushed.current = true;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // bloqueador de anúncios ou falha do script: a página segue normal
    }
  }, []);
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
