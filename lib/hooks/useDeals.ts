"use client";

import { useState, useEffect, useCallback } from "react";
import type { LocalDeal, DealMode, DealStatus, BRRRRInputs, NNNInputs, BRRRRResult, NNNResult } from "@/types/deal";

const KEY = "banyan-deals";

export function useDeals() {
  const [deals, setDeals] = useState<LocalDeal[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setDeals(JSON.parse(raw));
    } catch {}
    setLoaded(true);
  }, []);

  const persist = useCallback((next: LocalDeal[]) => {
    setDeals(next);
    localStorage.setItem(KEY, JSON.stringify(next));
  }, []);

  function saveDeal(data: {
    name: string;
    address: string;
    mode: DealMode;
    status: DealStatus;
    inputs: BRRRRInputs | NNNInputs;
    result: BRRRRResult | NNNResult;
    id?: string;
  }): LocalDeal {
    const now = new Date().toISOString();
    if (data.id) {
      const updated = deals.map(d =>
        d.id === data.id ? { ...d, ...data, updatedAt: now } : d
      ) as LocalDeal[];
      persist(updated);
      return updated.find(d => d.id === data.id)!;
    }
    const deal: LocalDeal = {
      ...data,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    };
    persist([deal, ...deals]);
    return deal;
  }

  function updateStatus(id: string, status: DealStatus) {
    persist(deals.map(d => d.id === id ? { ...d, status, updatedAt: new Date().toISOString() } : d));
  }

  function deleteDeal(id: string) {
    persist(deals.filter(d => d.id !== id));
  }

  return { deals, loaded, saveDeal, updateStatus, deleteDeal };
}
