import { TestBed } from '@angular/core/testing';
import type { ComponentFixture } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { TransactionsPage } from './transactions.page';

describe('TransactionsPage', () => {
  let component: TransactionsPage;
  let fixture: ComponentFixture<TransactionsPage>;

  beforeEach(() => {
    localStorage.removeItem('finance-user');
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [],
      }),
    );
    fixture = TestBed.createComponent(TransactionsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    localStorage.removeItem('finance-user');
    vi.unstubAllGlobals();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('requests the selected ordering and preserves the active type filter', async () => {
    const transactions = [
      {
        transaction_type: 'Expense',
        amount: 40,
        description: 'Groceries',
        transaction_date: '2026-01-02',
        notes: null,
      },
      {
        transaction_type: 'Income',
        amount: 500,
        description: 'Salary',
        transaction_date: '2026-01-01',
        notes: null,
      },
    ];
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify(transactions), { status: 200 }));
    component.userID = '42';
    component.activeFilter = 'expenseBtn';

    await component.orderTransactions('highest');

    expect(fetchMock).toHaveBeenCalledWith(
      'http://127.0.0.1:8000/transactionFilter/42/true/highest',
    );
    expect(component.transaction).toEqual([transactions[0]]);
  });
});
