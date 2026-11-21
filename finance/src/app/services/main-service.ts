import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

export interface Transaction {
  transaction_id: number;
  account_id: number;
  category_id: number | null;
  amount: number | string;
  transaction_type: string;
  description: string;
  transaction_date: string;
  notes: string | null;
}

export type TransactionFilter = 'all' | 'Income' | 'Expense';
export type TransactionOrder = 'newest' | 'oldest' | 'a-z' | 'z-a' | 'highest' | 'lowest';

export interface Budget {
  budget_id?: number;
  category_id: number;
  budget_name: string;
  budget_amount: number | string;
  start_date: string;
  end_date: string;
  created_at: string;
}

export interface BudgetInput {
  category_id: number;
  budget_name: string;
  budget_amount: number;
  start_date: string;
  end_date: string;
}

export interface BudgetCategory {
  category_id: number;
  category_name: string;
}

@Injectable({ providedIn: 'root' })
export class MainService {
  private readonly apiUrl = 'http://127.0.0.1:8000';
  private readonly http = inject(HttpClient);

  checkConnection(): Observable<unknown> {
    return this.http.get<unknown>(`${this.apiUrl}/`);
  }

  getUsers(): Observable<unknown[]> {
    return this.http.get<unknown[]>(`${this.apiUrl}/users`);
  }

  signup(userData: unknown): Observable<unknown> {
    return this.http.post<unknown>(`${this.apiUrl}/signup`, userData);
  }

  checkCredentials(credentials: unknown): Observable<unknown> {
    return this.http.post<unknown>(`${this.apiUrl}/checkCredentials`, credentials);
  }

  getResources(userId: number): Observable<unknown> {
    return this.http.get<unknown>(`${this.apiUrl}/resources/${userId}`);
  }

  getAccounts(userId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/accounts/${userId}`);
  }

  getAccountTypes(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/account-types`);
  }

  createAccount(userId: number, accountData: unknown): Observable<unknown> {
    return this.http.post<unknown>(`${this.apiUrl}/accounts/${userId}`, accountData);
  }

  updateAccount(userId: number, accountId: number, accountData: unknown): Observable<unknown> {
    return this.http.put<unknown>(`${this.apiUrl}/accounts/${userId}/${accountId}`, accountData);
  }

  getCategories(userId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/categories/${userId}`);
  }

  getTransactions(userId: number): Observable<Transaction[]> {
    return this.http.get<Transaction[]>(`${this.apiUrl}/transactionFilter/${userId}`);
  }

  filterTransactions(userId: number, transactionType: string): Observable<Transaction[]> {
    return this.http.get<Transaction[]>(
      `${this.apiUrl}/transactionFilter/${userId}/${encodeURIComponent(transactionType)}`,
    );
  }

  sortTransactions(userId: number, isOrder: string | boolean, order: string): Observable<Transaction[]> {
    return this.http.get<Transaction[]>(
      `${this.apiUrl}/transactionFilter/${userId}/${isOrder}/${encodeURIComponent(order)}`,
    );
  }

  searchTransactions(userId: number, searchTerm: string): Observable<Transaction[]> {
    return this.http.get<Transaction[]>(`${this.apiUrl}/transactionSearch/${userId}`, {
      params: { search_term: searchTerm },
    });
  }

  filterTransactionData(
    userId: number,
    filter: TransactionFilter = 'all',
    order: TransactionOrder = 'newest',
    searchTerm = '',
  ): Observable<Transaction[]> {
    const transactions$ = searchTerm.trim()
      ? this.searchTransactions(userId, searchTerm)
      : this.getTransactions(userId);

    return transactions$.pipe(
      map((transactions) => {
        const normalizedFilter = filter.toLowerCase();
        const filtered = transactions.filter(
          (transaction) =>
            normalizedFilter === 'all' ||
            transaction.transaction_type.toLowerCase() === normalizedFilter,
        );

        return [...filtered].sort((first, second) => {
          switch (order) {
            case 'oldest':
              return new Date(first.transaction_date).getTime() - new Date(second.transaction_date).getTime();
            case 'a-z':
              return first.description.localeCompare(second.description);
            case 'z-a':
              return second.description.localeCompare(first.description);
            case 'highest':
              return Number(second.amount) - Number(first.amount);
            case 'lowest':
              return Number(first.amount) - Number(second.amount);
            default:
              return new Date(second.transaction_date).getTime() - new Date(first.transaction_date).getTime();
          }
        });
      }),
    );
  }

  addIncome(userId: number, incomeData: unknown): Observable<unknown> {
    return this.http.post<unknown>(`${this.apiUrl}/addincome/${userId}`, incomeData);
  }

  updateIncome(userId: number, transactionId: number, transactionData: unknown): Observable<unknown> {
    return this.http.put<unknown>(
      `${this.apiUrl}/income/${userId}/${transactionId}`,
      transactionData,
    );
  }

  deleteIncome(userId: number, transactionId: number): Observable<unknown> {
    return this.http.delete<unknown>(`${this.apiUrl}/income/${userId}/${transactionId}`);
  }

  addExpense(userId: number, expenseData: unknown): Observable<unknown> {
    return this.http.post<unknown>(`${this.apiUrl}/addexpense/${userId}`, expenseData);
  }

  updateExpense(userId: number, transactionId: number, transactionData: unknown): Observable<unknown> {
    return this.http.put<unknown>(
      `${this.apiUrl}/expense/${userId}/${transactionId}`,
      transactionData,
    );
  }

  deleteExpense(userId: number, transactionId: number): Observable<unknown> {
    return this.http.delete<unknown>(`${this.apiUrl}/expense/${userId}/${transactionId}`);
  }

  getLocalStorageData<T = unknown>(): T | null {
    const data = localStorage.getItem('finance-resources');
    return data ? JSON.parse(data) as T : null;
  }

  setLocalStorageData(data: unknown): void {
    localStorage.setItem('finance-resources', JSON.stringify(data));
  }

  getUserData(): any {
    const data = localStorage.getItem('finance-user');
    return data ? JSON.parse(data) : null;
  }

  getUserId(): number {
    return Number(this.getUserData()?.user_id ?? 0);
  }

  async getTotalBalance(): Promise<number>;
  async getTotalBalance(userId: number): Promise<number>;
  async getTotalBalance(userId?: number): Promise<number> {
    const id = userId ?? this.getUserId();
    const response = await fetch(`${this.apiUrl}/accounts/${id}`);
    await this.ensureSuccess(response, 'Could not load accounts');
    const accounts = await response.json() as Array<{ balance: number | string }>;
    return accounts.reduce((total, account) => total + Number(account.balance), 0);
  }

  async getTotalIncome(): Promise<number>;
  async getTotalIncome(userId: number): Promise<number>;
  async getTotalIncome(userId?: number): Promise<number> {
    const transactions = await this.fetchTransactions(userId ?? this.getUserId(), 'Income');
    return transactions.reduce((total, transaction) => total + Number(transaction.amount), 0);
  }

  async getTotalExpense(): Promise<number>;
  async getTotalExpense(userId: number): Promise<number>;
  async getTotalExpense(userId?: number): Promise<number> {
    const transactions = await this.fetchTransactions(userId ?? this.getUserId(), 'Expense');
    return transactions.reduce((total, transaction) => total + Number(transaction.amount), 0);
  }

  async getDashboardTransactions(userId: number): Promise<Transaction[]> {
    return this.fetchTransactions(userId, 'all');
  }

  async getBudgetCategories(): Promise<BudgetCategory[]> {
    const response = await fetch(`${this.apiUrl}/categories/${this.getUserId()}`);
    await this.ensureSuccess(response, 'Could not load budget categories');
    return response.json();
  }

  async getBudgets(): Promise<Budget[]> {
    const response = await fetch(`${this.apiUrl}/budget/${this.getUserId()}`);
    await this.ensureSuccess(response, 'Could not load budgets');
    return response.json();
  }

  async createBudget(budget: BudgetInput): Promise<Budget> {
    const response = await fetch(`${this.apiUrl}/budgets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...budget, user_id: this.getUserId() }),
    });
    await this.ensureSuccess(response, 'Could not create budget');
    return response.json();
  }

  async updateBudget(budgetId: number, budget: BudgetInput): Promise<Budget> {
    const userId = this.getUserId();
    const response = await fetch(`${this.apiUrl}/budgets/${userId}/${budgetId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...budget, user_id: userId }),
    });
    await this.ensureSuccess(response, 'Could not update budget');
    return response.json();
  }

  async deleteBudget(budgetId: number): Promise<void> {
    const response = await fetch(`${this.apiUrl}/budgets/${this.getUserId()}/${budgetId}`, {
      method: 'DELETE',
    });
    await this.ensureSuccess(response, 'Could not delete budget');
  }

  updateBudgetCache(budgets: Budget[]): void {
    const resources = this.getLocalStorageData<Record<string, unknown>>() ?? {};
    this.setLocalStorageData({ ...resources, budgets });
  }

  private async fetchTransactions(userId: number, type: 'all' | 'Income' | 'Expense'): Promise<Transaction[]> {
    const suffix = type === 'all' ? '' : `/${encodeURIComponent(type)}`;
    const response = await fetch(`${this.apiUrl}/transactionFilter/${userId}${suffix}`);
    await this.ensureSuccess(response, 'Could not load transactions');
    return response.json();
  }

  private async ensureSuccess(response: Response, message: string): Promise<void> {
    if (response.ok) return;
    const payload = await response.json().catch(() => null) as { detail?: unknown } | null;
    const detail = typeof payload?.detail === 'string'
      ? payload.detail
      : `${message} (${response.status}).`;
    throw new Error(detail);
  }
}
