import { TestBed } from '@angular/core/testing';
import type { ComponentFixture } from '@angular/core/testing';
import { of } from 'rxjs';
import { vi } from 'vitest';

import { MainService } from '../services/main-service';

import { TransactionManagementPage } from './transaction-management.page';


describe('TransactionManagementPage', () => {
  let component: TransactionManagementPage;
  let fixture: ComponentFixture<TransactionManagementPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(TransactionManagementPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('updates an income transaction through the income endpoint', () => {
    const service = TestBed.inject(MainService);
    const updateIncome = vi.spyOn(service, 'updateIncome').mockReturnValue(of({}));
    vi.spyOn(service, 'getResources').mockReturnValue(of({}));
    vi.spyOn(component, 'loadTransactions').mockResolvedValue();
    component.userID = 42;
    component.beginEdit({
      transaction_id: 13,
      account_id: 8,
      category_id: 4,
      amount: '100.00',
      transaction_type: 'Income',
      description: 'Salary',
      transaction_date: '2026-11-01',
      notes: null,
    });
    component.formDescription = 'Updated salary';
    component.formAmount = 125;

    component.enterTransaction();

    expect(updateIncome).toHaveBeenCalledWith(42, 13, {
      account_id: 8,
      category_id: 4,
      amount: 125,
      description: 'Updated salary',
      transaction_date: '2026-11-01',
      notes: null,
    });
    expect(component.editingTransactionId).toBeNull();
    expect(component.formDescription).toBe('');
  });

  it('updates an expense transaction through the expense endpoint', () => {
    const service = TestBed.inject(MainService);
    const updateExpense = vi.spyOn(service, 'updateExpense').mockReturnValue(of({}));
    vi.spyOn(service, 'getResources').mockReturnValue(of({}));
    vi.spyOn(component, 'loadTransactions').mockResolvedValue();
    component.userID = 42;
    component.beginEdit({
      transaction_id: 14,
      account_id: 9,
      category_id: 6,
      amount: 25,
      transaction_type: 'Expense',
      description: 'Lunch',
      transaction_date: '2026-11-02',
      notes: 'Work',
    });
    component.formAmount = 30;

    component.enterTransaction();

    expect(updateExpense).toHaveBeenCalledWith(42, 14, {
      account_id: 9,
      category_id: 6,
      amount: 30,
      description: 'Lunch',
      transaction_date: '2026-11-02',
      notes: 'Work',
    });
    expect(component.editingTransactionId).toBeNull();
  });

  it('cancels editing and discards the unsaved transaction changes', () => {
    expect(fixture.nativeElement.textContent).toContain('Submit');
    expect(fixture.nativeElement.textContent).not.toContain('Cancel');
    component.beginEdit({
      transaction_id: 13,
      account_id: 8,
      category_id: 4,
      amount: 100,
      transaction_type: 'Income',
      description: 'Salary',
      transaction_date: '2026-11-01',
      notes: 'Monthly',
    });
    component.formDescription = 'Unsaved change';
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Update');
    expect(fixture.nativeElement.textContent).toContain('Cancel');

    fixture.nativeElement.querySelector('.cancel-edit-button').click();
    fixture.detectChanges();

    expect(component.editingTransactionId).toBeNull();
    expect(component.formDescription).toBe('');
    expect(component.selectedAccountId).toBeNull();
    expect(component.selectedCategoryId).toBeNull();
    expect(component.formAmount).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Submit');
    expect(fixture.nativeElement.textContent).not.toContain('Cancel');
  });
});
