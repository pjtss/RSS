"use client";

import { useEffect, useState } from "react";
import type { ContractDetails } from "@/lib/types";
import styles from "./contract-badge.module.css";

interface Props {
  rceptNo: string;
}

export function ContractBadge({ rceptNo }: Props) {
  const [state, setState] = useState<{
    data: ContractDetails | null;
    loading: boolean;
    error: boolean;
  }>({
    data: null,
    loading: true,
    error: false
  });

  useEffect(() => {
    if (!rceptNo) {
      setState(prev => ({ ...prev, loading: false }));
      return;
    }

    let cancelled = false;

    async function load() {
      try {
        const res = await fetch(`/api/dart/contract?rceptNo=${rceptNo}`);
        if (!res.ok) throw new Error("Failed");
        const json = await res.json();
        
        if (!cancelled) {
          setState({ data: json, loading: false, error: false });
        }
      } catch (err) {
        if (!cancelled) {
          setState({ data: null, loading: false, error: true });
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [rceptNo]);

  if (state.loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <span>계약 상세 데이터 불러오는 중...</span>
      </div>
    );
  }

  if (state.error || !state.data) {
    // If it fails or not found, just don't show the badge to avoid clutter
    return null;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.icon}>💰</span>
        <strong>{state.data.contractAmount}</strong>
        <span className={styles.ratio}>(매출대비 {state.data.salesRatio}%)</span>
      </div>
      <div className={styles.details}>
        <span><strong>상대방:</strong> {state.data.partner}</span>
        <span><strong>기간:</strong> {state.data.period}</span>
      </div>
    </div>
  );
}
