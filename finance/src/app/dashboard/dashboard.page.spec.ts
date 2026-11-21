import { TestBed } from '@angular/core/testing';
import type { ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { DashboardPage } from './dashboard.page';

describe('DashboardPage', () => {
  let component: DashboardPage;
  let fixture: ComponentFixture<DashboardPage>;

  beforeEach(() => {
    localStorage.setItem('finance-user', JSON.stringify({ user_id: 42 }));
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    vi.stubGlobal(
      'fetch',
      vi.fn((input: RequestInfo | URL) => {
        const url = String(input);
        const now = new Date();
        const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        const monthEnd = [
          now.getFullYear(),
          String(now.getMonth() + 1).padStart(2, '0'),
          String(lastDay).padStart(2, '0'),
        ].join('-');
        const response = url.endsWith('/Income')
          ? [{ amount: '300.00' }]
          : url.endsWith('/Expense')
            ? [{ amount: '25.00' }]
            : url.endsWith('/accounts/42')
              ? [{ balance: '100.00' }, { balance: '400.00' }]
              : url.endsWith('/transactionFilter/42')
                ? [
                    {
                      transaction_id: 1,
                      category_id: 1,
                      transaction_type: 'Expense',
                      amount: '30.00',
                      description: 'Food',
                      transaction_date: monthStart,
                    },
                    {
                      transaction_id: 2,
                      category_id: 2,
                      transaction_type: 'Expense',
                      amount: '80.00',
                      description: 'Bills',
                      transaction_date: monthStart,
                    },
                    {
                      transaction_id: 3,
                      category_id: 4,
                      transaction_type: 'Expense',
                      amount: '500.00',
                      description: 'Travel',
                      transaction_date: monthStart,
                    },
                  ]
                : url.endsWith('/budget/42')
                  ? [
                      {
                        budget_id: 1,
                        category_id: 1,
                        budget_name: 'Food',
                        budget_amount: '100.00',
                        start_date: monthStart,
                        end_date: monthEnd,
                      },
                      {
                        budget_id: 2,
                        category_id: 2,
                        budget_name: 'Bills',
                        budget_amount: '200.00',
                        start_date: monthStart,
                        end_date: monthEnd,
                      },
                      {
                        budget_id: 3,
                        category_id: 3,
                        budget_name: 'Transport',
                        budget_amount: '300.00',
                        start_date: monthStart,
                        end_date: monthEnd,
                      },
                      {
                        budget_id: 4,
                        category_id: 4,
                        budget_name: 'Travel',
                        budget_amount: '400.00',
                        start_date: monthStart,
                        end_date: monthEnd,
                      },
                    ]
                  : [];
        return Promise.resolve(new Response(JSON.stringify(response), { status: 200 }));
      }),
    );
    fixture = TestBed.createComponent(DashboardPage);
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

  it('uses the current account total without subtracting expenses again', async () => {
    await component.ionViewWillEnter();

    expect(component.income).toBe(300);
    expect(component.expenses).toBe(25);
    expect(component.balance).toBe(500);
  });

  it('calculates remaining budget from all current-month budgets and matching expenses', async () => {
    await component.ionViewWillEnter();
    fixture.detectChanges();

    expect(component.monthlyBudgets).toHaveLength(3);
    expect(component.remainingBudget).toBe(390);
    expect(fixture.nativeElement.textContent).toContain('390.00');
    expect(fixture.nativeElement.textContent).not.toContain('8,450.00');
  });
});
