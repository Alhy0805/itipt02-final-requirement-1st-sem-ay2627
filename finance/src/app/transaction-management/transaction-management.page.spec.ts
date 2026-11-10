import { TestBed } from '@angular/core/testing';
import type { ComponentFixture } from '@angular/core/testing';

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
});
