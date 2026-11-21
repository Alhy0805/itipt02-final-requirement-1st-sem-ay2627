import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
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

@Service()
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

@Injectable({
    providedIn: 'root'
})
export class MainService {

    private apiUrl = 'http://127.0.0.1:8000';
    private http = inject(HttpClient);

  // GENERAL AND USER

    checkConnection(): Observable<any> {
        return this.http.get(`${this.apiUrl}/`);
    getLocalStorageData<T = unknown>(): T | null {
        const data = localStorage.getItem('finance-resources');
        return data ? JSON.parse(data) as T : null;
    }

    getUsers(): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/users`);
    }

    signup(userData: any): Observable<any> {
        return this.http.post(`${this.apiUrl}/signup`, userData);
    }

    checkCredentials(credentials: any): Observable<any> {
        return this.http.post(`${this.apiUrl}/checkCredentials`, credentials);
    }

    getResources(userId: number): Observable<any> {
        return this.http.get(`${this.apiUrl}/resources/${userId}`);
    }

  // ACCOUNTS AND CATEGORIES

    getAccounts(userId: number): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/accounts/${userId}`);
    }

    getAccountTypes(): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/account-types`);
    }

    createAccount(userId: number, accountData: any): Observable<any> {
        return this.http.post(`${this.apiUrl}/accounts/${userId}`, accountData);
    }

    updateAccount(userId: number, accountId: number, accountData: any): Observable<any> {
        return this.http.put(`${this.apiUrl}/accounts/${userId}/${accountId}`,accountData);
    }

    getCategories(userId: number): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/categories/${userId}`);
    }

  // BUDGETS

    getBudgets(userId: number): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/budget/${userId}`);
    }

    createBudget(budgetData: any): Observable<any> {
        return this.http.post(`${this.apiUrl}/budgets`, budgetData);
    }

    updateBudget(userId: number, budgetId: number, budgetData: any): Observable<any> {
        return this.http.put(`${this.apiUrl}/budgets/${userId}/${budgetId}`,budgetData);
    }

    deleteBudget(userId: number, budgetId: number): Observable<any> {
        return this.http.delete(`${this.apiUrl}/budgets/${userId}/${budgetId}`);
    }

  // TRANSACTIONS

    getTransactions(userId: number): Observable<Transaction[]> {
        return this.http.get<Transaction[]>(`${this.apiUrl}/transactionFilter/${userId}`);
    }
    async getTotalBalance(): Promise<number> {
        const response = await fetch(`${this.API}/accounts/${this.getUserId()}`);
        if (!response.ok) {
            throw new Error(`Could not load accounts (${response.status}).`);
        }

    filterTransactions(userId: number, transactionType: string): Observable<Transaction[]> {
        return this.http.get<Transaction[]>(`${this.apiUrl}/transactionFilter/${userId}/${encodeURIComponent(transactionType)}`);
    }

    sortTransactions(userId: number,isOrder: string | boolean,order: string): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/transactionFilter/${userId}/${isOrder}/${encodeURIComponent(order)}`);
    }

    searchTransactions(userId: number, searchTerm: string): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/transactionSearch/${userId}`, {params: { search_term: searchTerm }});
    }

    filterTransactionData(
        userId: number,
        filter: TransactionFilter = 'all',
        order: TransactionOrder = 'newest',
        searchTerm = '',
    ): Observable<Transaction[]> {
        const search = searchTerm.trim();
        const transactions$ = search
            ? this.searchTransactions(userId, search)
            : this.getTransactions(userId);

        return transactions$.pipe(
            map((transactions: Transaction[]) => {
                const normalizedFilter = filter.toLowerCase();
                const filteredTransactions = transactions.filter(
                    (transaction) =>
                        normalizedFilter === 'all' ||
                        transaction.transaction_type.toLowerCase() === normalizedFilter,
                );

                return [...filteredTransactions].sort((first, second) => {
                    switch (order) {
                        case 'newest':
                            return new Date(second.transaction_date).getTime() - new Date(first.transaction_date).getTime();
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
                            return 0;
                    }
                });
            }),
        );
    }

  // INCOME

    addIncome(userId: number, incomeData: any): Observable<any> {
        return this.http.post(`${this.apiUrl}/addincome/${userId}`,incomeData);
    }

    updateIncome(userId: number, transactionId: number, incomeData: any): Observable<any> {
        return this.http.put(`${this.apiUrl}/income/${userId}/${transactionId}`,incomeData);
    }

    deleteIncome(userId: number, transactionId: number): Observable<any> {
        return this.http.delete(`${this.apiUrl}/income/${userId}/${transactionId}`);
    }

  // EXPENSES

    addExpense(userId: number, expenseData: any): Observable<any> {
        return this.http.post(`${this.apiUrl}/addexpense/${userId}`,expenseData);
    }

    updateExpense(userId: number, transactionId: number, expenseData: any): Observable<any> {
        return this.http.put(`${this.apiUrl}/expense/${userId}/${transactionId}`,expenseData);
    }

    deleteExpense(userId: number, transactionId: number): Observable<any> {
        return this.http.delete(`${this.apiUrl}/expense/${userId}/${transactionId}`);
    }

  // LOCAL STORAGE

    getLocalStorageData(): any {
        const data = localStorage.getItem('finance-resources');
        return data ? JSON.parse(data) : null;
    }

    getUserData(): any {
        const data = localStorage.getItem('finance-user');
        return data ? JSON.parse(data) : null;
    }

    // CALCULATIONS

    getTotalBalance(userId: number): Observable<number> {
        return this.getAccounts(userId).pipe(
            map((accounts) =>
                accounts.reduce(
                    (total: number, account: { balance: number | string }) =>
                        total + Number(account.balance),
                    0,
                ),
            ),
        );
    }

    getTotalIncome(userId: number): Observable<number> {
        return this.filterTransactions(userId, 'Income').pipe(
            map((transactions) =>
                transactions.reduce((total, transaction) => total + Number(transaction.amount), 0),
            ),
        );
    }
    
    //BALANCE METHODS
        setLocalStorageData(data: unknown): void {
        localStorage.setItem('finance-resources', JSON.stringify(data));
    }

    updateBudgetCache(budgets: Budget[]): void {
        const resources = this.getLocalStorageData<Record<string, unknown>>() ?? {};
        this.setLocalStorageData({ ...resources, budgets });
    }

    async getBudgetCategories(): Promise<BudgetCategory[]> {
        const userId = this.getUserId();
        const response = await fetch(`${this.API}/categories/${userId}`);
        await this.ensureSuccess(response, 'Could not load budget categories');
        return response.json();
    }

    async getBudgets(): Promise<Budget[]> {
        const userId = this.getUserId();
        const response = await fetch(`${this.API}/budget/${userId}`);
        await this.ensureSuccess(response, 'Could not load budgets');
        return response.json();
    }

    async createBudget(budget: BudgetInput): Promise<Budget> {
        const response = await fetch(`${this.API}/budgets`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...budget, user_id: this.getUserId() }),
        });
        await this.ensureSuccess(response, 'Could not create budget');
        return response.json();
    }

    async updateBudget(budgetId: number, budget: BudgetInput): Promise<Budget> {
        const userId = this.getUserId();
        const response = await fetch(`${this.API}/budgets/${userId}/${budgetId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...budget, user_id: userId }),
        });
        await this.ensureSuccess(response, 'Could not update budget');
        return response.json();
    }

    async deleteBudget(budgetId: number): Promise<void> {
        const response = await fetch(`${this.API}/budgets/${this.getUserId()}/${budgetId}`, {
            method: 'DELETE',
        });
        await this.ensureSuccess(response, 'Could not delete budget');
    }

    private async ensureSuccess(response: Response, message: string): Promise<void> {
        if (response.ok) {
            return;
        }

        const payload = await response.json().catch(() => null) as { detail?: unknown } | null;
        const detail = typeof payload?.detail === 'string' ? payload.detail : `${message} (${response.status}).`;
        throw new Error(detail);
    }

    getTotalExpense(userId: number): Observable<number> {
        return this.filterTransactions(userId, 'Expense').pipe(
            map((transactions) =>
                transactions.reduce((total, transaction) => total + Number(transaction.amount), 0),
            ),
        );
    }
}