import type { Plan } from "@/generated/prisma/enums";
import { adMode } from "@/lib/ads";
import { AdSenseUnit } from "./adsense-unit";

/**
 * Espaço de anúncio discreto: um bloco pequeno, de altura fixa (sem "pulo"
 * de layout), identificado como "Publicidade". Use no máximo um por página.
 */
export function AdSlot({ plan = "FREE" }: { plan?: Plan }) {
  const mode = adMode(plan);
  if (mode.kind === "none") return null;
  return (
    <aside aria-label="Publicidade" className="mt-2 rounded-2xl bg-white/70 p-2 ring-1 ring-slate-900/5">
      <p className="mb-1 text-center text-[11px] tracking-wide text-slate-500 uppercase">Publicidade</p>
      <div className="h-[100px] overflow-hidden">
        {mode.kind === "adsense" ? (
          <AdSenseUnit client={mode.client} slot={mode.slot} />
        ) : (
          <div className="flex h-full items-center justify-center rounded-xl border-2 border-dashed border-slate-300 text-xs text-slate-400">
            Espaço de anúncio (configure ADSENSE_CLIENT_ID e ADSENSE_SLOT_ID)
          </div>
        )}
      </div>
    </aside>
  );
}
