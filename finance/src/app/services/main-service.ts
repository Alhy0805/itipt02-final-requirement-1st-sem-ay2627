
import { Injectable } from '@angular/core';

interface Transaction {
    amount: number | string;
}

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
}
