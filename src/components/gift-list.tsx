import { AFFILIATE_DISCLOSURE, amazonSearchLink } from "@/lib/affiliate";
import type { GiftGroup } from "@/lib/gift-ideas";
import { Card } from "./ui";

/** Ideias agrupadas, cada uma com uma busca na Amazon limitada ao valor da página. */
export function GiftList({ groups, maxReais, tag }: { groups: GiftGroup[]; maxReais: number; tag?: string }) {
  return (
    <>
      {groups.map((g) => (
        <Card key={g.heading}>
          <h2 className="mb-3 text-lg font-bold">{g.heading}</h2>
          <ul className="flex flex-col gap-3">
            {g.ideas.map((idea) => {
              const link = amazonSearchLink(idea.query, maxReais, tag);
              return (
                <li key={idea.name} className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200">
                  <p className="font-semibold">{idea.name}</p>
                  <p className="text-sm text-slate-600">{idea.note}</p>
                  <a
                    href={link.href}
                    target="_blank"
                    rel={link.affiliate ? "sponsored noopener noreferrer nofollow" : "noopener noreferrer nofollow"}
                    className="mt-1 inline-block text-sm font-medium text-brand underline"
                  >
                    Ver opções até R$ {maxReais} na Amazon ↗
                  </a>
                </li>
              );
            })}
          </ul>
        </Card>
      ))}
      {tag && <p className="text-center text-xs text-slate-500">{AFFILIATE_DISCLOSURE}</p>}
    </>
  );
}
