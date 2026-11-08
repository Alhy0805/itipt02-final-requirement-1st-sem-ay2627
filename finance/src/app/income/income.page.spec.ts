import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { IncomePage } from './income.page';

describe('IncomePage', () => {
  let component: IncomePage;
  let fixture: ComponentFixture<IncomePage>;

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
    fixture = TestBed.createComponent(IncomePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    localStorage.removeItem('finance-user');
    localStorage.removeItem('finance-resources');
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('creates and loads income entries for the signed-in user', async () => {
    const incomes = [
      {
        transaction_id: 1,
        transaction_type: 'Income' as const,
        account_id: 7,
        category_id: 1,
        amount: 1250,
        description: 'Payday',
        transaction_date: '2026-11-08',
        notes: null,
      },
    ];
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify(incomes), { status: 200 }));
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify([
          { category_id: 1, category_name: 'Salary', category_type: 'Income', user_id: null },
          { category_id: 8, category_name: 'Freelance', category_type: 'Income', user_id: 42 },
          { category_id: 2, category_name: 'Food', category_type: 'Expense', user_id: null },
        ]),
        { status: 200 },
      ),
    );

    await component.loadIncomes();

    expect(fetchMock).toHaveBeenNthCalledWith(2, 'http://127.0.0.1:8000/categories/42');
    expect(component.incomes).toEqual(incomes);
    expect(component.totalIncome).toBe(1250);
    expect(component.getCategoryName(1)).toBe('Salary');
    expect(component.categories.map((category) => category.category_name)).toEqual(['Salary', 'Freelance']);
  });

  it('adds income through the backend and updates the cached transactions', async () => {
    const savedIncome = {
      transaction_id: 2,
      transaction_type: 'Income' as const,
      account_id: 7,
      category_id: 3,
      amount: 950,
      description: 'Freelance work',
      transaction_date: '2026-11-08',
      notes: null,
    };
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify(savedIncome), { status: 201 }));
    component.userId = 42;
    component.newIncome = {
      account_id: 7,
      category_id: 3,
      amount: 950,
      description: ' Freelance work ',
      transaction_date: '2026-11-08',
      notes: '',
    };

    await component.saveIncome();

    expect(fetchMock).toHaveBeenLastCalledWith(
      'http://127.0.0.1:8000/addincome/42',
      expect.objectContaining({ method: 'POST' }),
    );
    expect(component.incomes).toContainEqual(savedIncome);
    expect(JSON.parse(localStorage.getItem('finance-resources') ?? '{}').transactions).toContainEqual(savedIncome);
    expect(component.showForm).toBe(false);
  });

  it('deletes an income entry and updates the cached transactions', async () => {
    const income = {
      transaction_id: 4,
      transaction_type: 'Income' as const,
      account_id: 7,
      category_id: 3,
      amount: 500,
      description: 'Gift',
      transaction_date: '2026-11-08',
      notes: null,
    };
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }));
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    component.userId = 42;
    component.incomes = [income];

    await component.deleteIncome(income);

    expect(fetchMock).toHaveBeenLastCalledWith('http://127.0.0.1:8000/income/42/4', { method: 'DELETE' });
    expect(component.incomes).toEqual([]);
    expect(JSON.parse(localStorage.getItem('finance-resources') ?? '{}').transactions).toEqual([]);
  });
});
