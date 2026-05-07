import { useState, useEffect } from 'react';
import { getAllTransactions } from '../api/queries.js';
import type { Transaction } from '../types/index.js';

export function useTransactions(refreshKey = 0) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    getAllTransactions()
      .then(setTransactions)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [refreshKey]);

  return { transactions, loading, error };
}
