
import { Injectable } from '@angular/core';

export interface Transaction {
    amount: number | string;
    transaction_type: string;
    description: string;
    transaction_date: string;
    notes: string | null;
    category_id?: number | string;
}

export type TransactionFilter = 'all' | 'Income' | 'Expense';
export type TransactionOrder = 'newest' | 'oldest' | 'a-z' | 'z-a' | 'highest' | 'lowest';

@Injectable({
    providedIn: 'root'
})
export class MainService {

    private readonly API = 'http://127.0.0.1:8000';

    getLocalStorageData(): any {
        const data = localStorage.getItem('finance-resources');
        return data ? JSON.parse(data) : null;
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



    async filterTransactionData(
        userId: number | string,
        filter: TransactionFilter = 'all',
        order: TransactionOrder = 'newest',
        searchTerm = '',
    ): Promise<Transaction[]> {
        const encodedUserId = encodeURIComponent(userId);
        const search = searchTerm.trim();
        const url = search
            ? `${this.API}/transactionSearch/${encodedUserId}?${new URLSearchParams({ search_term: search })}`
            : `${this.API}/transactionFilter/${encodedUserId}/true/${order}`;
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`Could not load transactions (${response.status}).`);
        }

        const transactions: unknown = await response.json();
        if (!Array.isArray(transactions)) {
            throw new Error('The transaction API returned an invalid response.');
        }

        const normalizedFilter = filter.toLowerCase();
        const filteredTransactions = (transactions as Transaction[]).filter(
            (transaction) =>
                normalizedFilter === 'all' ||
                transaction.transaction_type.toLowerCase() === normalizedFilter,
        );

        return this.sortTransactions(filteredTransactions, order);
    }

    private sortTransactions(transactions: Transaction[], order: TransactionOrder): Transaction[] {
        return [...transactions].sort((first, second) => {
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
            }
        });
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

}
