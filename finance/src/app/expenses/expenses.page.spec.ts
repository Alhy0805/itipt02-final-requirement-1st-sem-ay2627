import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ExpensesPage } from './expenses.page';

describe('ExpensesPage', () => {
  let component: ExpensesPage;
  let fixture: ComponentFixture<ExpensesPage>;

  beforeEach(() => {
    localStorage.setItem('finance-user', JSON.stringify({ user_id: 42 }));
    localStorage.setItem(
      'finance-resources',
      JSON.stringify({
        accounts: [{ account_id: 7, account_name: 'Cash' }],
        categories: [],
        transactions: [],
      }),
    );
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify([]), { status: 200 })));
    fixture = TestBed.createComponent(ExpensesPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    localStorage.removeItem('finance-user');
    localStorage.removeItem('finance-resources');
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('loads expense entries for the signed-in user', async () => {
    const expenses = [
      {
        transaction_id: 1,
        transaction_type: 'Expense' as const,
        account_id: 7,
        category_id: 2,
        amount: 125,
        description: 'Groceries',
        transaction_date: '2026-11-08',
        notes: null,
      },
    ];
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify(expenses), { status: 200 }));
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify([
          { category_id: 1, category_name: 'Salary', category_type: 'Income', user_id: null },
          { category_id: 2, category_name: 'Food', category_type: 'Expense', user_id: null },
          { category_id: 6, category_name: 'Transportation', category_type: 'Expense', user_id: 42 },
        ]),
        { status: 200 },
      ),
    );

    await component.loadExpenses();

    expect(fetchMock).toHaveBeenNthCalledWith(2, 'http://127.0.0.1:8000/categories/42');
    expect(component.expenses).toEqual(expenses);
    expect(component.totalExpenses).toBe(125);
    expect(component.getCategoryName(2)).toBe('Food');
    expect(component.categories.map((category) => category.category_name)).toEqual(['Food', 'Transportation']);
  });

  it('adds an expense through the backend and updates cached transactions', async () => {
    const savedExpense = {
      transaction_id: 2,
      transaction_type: 'Expense' as const,
      account_id: 7,
      category_id: 3,
      amount: 85,
      description: 'Lunch',
      transaction_date: '2026-11-08',
      notes: null,
    };
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify(savedExpense), { status: 201 }));
    component.userId = 42;
    component.newExpense = {
      account_id: 7,
      category_id: 3,
      amount: 85,
      description: ' Lunch ',
      transaction_date: '2026-11-08',
      notes: '',
    };

    await component.saveExpense();

    expect(fetchMock).toHaveBeenLastCalledWith(
      'http://127.0.0.1:8000/addexpense/42',
      expect.objectContaining({ method: 'POST' }),
    );
    expect(component.expenses).toContainEqual(savedExpense);
    expect(JSON.parse(localStorage.getItem('finance-resources') ?? '{}').transactions).toContainEqual(savedExpense);
    expect(component.showForm).toBe(false);
  });

  it('deletes an expense and updates cached transactions', async () => {
    const expense = {
      transaction_id: 4,
      transaction_type: 'Expense' as const,
      account_id: 7,
      category_id: 3,
      amount: 45,
      description: 'Coffee',
      transaction_date: '2026-11-08',
      notes: null,
    };
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }));
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    component.userId = 42;
    component.expenses = [expense];

    await component.deleteExpense(expense);

    expect(fetchMock).toHaveBeenLastCalledWith('http://127.0.0.1:8000/expense/42/4', { method: 'DELETE' });
    expect(component.expenses).toEqual([]);
    expect(JSON.parse(localStorage.getItem('finance-resources') ?? '{}').transactions).toEqual([]);
  });
});
