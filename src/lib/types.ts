export type CategoryType = "INCOME" | "EXPENSE";

export interface Category {
  id: string;
  name: string;
  type: CategoryType;
  color: string;
  budget?: Budget | null;
}

export interface Transaction {
  id: string;
  categoryId: string;
  category: Category;
  amount: number;
  date: string;
  note: string | null;
}

export interface Budget {
  id: string;
  categoryId: string;
  monthlyLimit: number;
}

export interface StatsTotals {
  income: number;
  expense: number;
  balance: number;
}

export interface StatsMonthly {
  key: string;
  label: string;
  income: number;
  expense: number;
}

export interface StatsByCategory {
  category: Category;
  total: number;
}

export interface BudgetStatus {
  category: Category;
  limit: number;
  spent: number;
  percent: number;
}

export interface Stats {
  month: string;
  totals: StatsTotals;
  monthly: StatsMonthly[];
  byCategory: StatsByCategory[];
  budgets: BudgetStatus[];
}