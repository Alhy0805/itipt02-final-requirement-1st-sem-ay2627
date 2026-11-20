
import { Injectable } from '@angular/core';

interface Transaction {
    amount: number | string;
}

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

    private readonly API = 'http://127.0.0.1:8000';

    getLocalStorageData<T = unknown>(): T | null {
        const data = localStorage.getItem('finance-resources');
        return data ? JSON.parse(data) as T : null;
    }

    getUserData(): any {
        const data = localStorage.getItem('finance-user');
        return data ? JSON.parse(data) : null;
    }

    getUserId(): number {
        const userId = Number(this.getUserData()?.user_id);
        if (!Number.isInteger(userId) || userId <= 0) {
            throw new Error('No valid logged-in user ID was found.');
        }
        return userId;
    }
    async getTotalBalance(): Promise<number> {
        const response = await fetch(`${this.API}/accounts/${this.getUserId()}`);
        if (!response.ok) {
            throw new Error(`Could not load accounts (${response.status}).`);
        }

        const accounts: { balance: number | string }[] = await response.json();
        return accounts.reduce((total, account) => total + Number(account.balance), 0);
    }



    async filterTransactionData(userId: number | string, filter: string): Promise<Transaction[]> {
        const url = `${this.API}/transactionFilter/${encodeURIComponent(userId)}/${encodeURIComponent(filter)}`;
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`Could not load transactions (${response.status}).`);
        }
        return response.json();
    }

    async getTotalIncome(): Promise<number> {
        const incomeTransactions = await this.filterTransactionData(this.getUserId(), 'Income');
        return incomeTransactions.reduce(
            (total, transaction) => total + Number(transaction.amount),
            0,
        );
    }

    async getTotalExpense(): Promise<number> {
        const expenseTransactions = await this.filterTransactionData(this.getUserId(), 'Expense');
        return expenseTransactions.reduce(
            (total, transaction) => total + Number(transaction.amount),
            0,
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

}
