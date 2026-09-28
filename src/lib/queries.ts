import "server-only";
import { cache } from "react";
import { getDb } from "@/lib/db/client";
import { getPublicGroupView } from "@/lib/services/groups";

/**
 * Visão pública do grupo memoizada POR REQUISIÇÃO: layout, generateMetadata e
 * página pedem o mesmo grupo — com cache, é 1 consulta em vez de 3.
 */
export const getGroupView = cache((code: string) => getPublicGroupView(getDb(), code));
