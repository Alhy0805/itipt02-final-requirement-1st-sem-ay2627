import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AccountsAndWalletsPage } from './accounts-and-wallets.page';

describe('AccountsAndWalletsPage', () => {
  let component: AccountsAndWalletsPage;
  let fixture: ComponentFixture<AccountsAndWalletsPage>;
  const accounts = [
    {
      account_id: 8,
      user_id: 42,
      account_name: 'Daily Wallet',
      account_type_ids: [3],
      account_types: [{ account_type_id: 3, type_name: 'E-Wallet' }],
      balance: '125.00',
    },
    {
      account_id: 9,
      user_id: 42,
      account_name: 'Savings',
      account_type_ids: [2],
      account_types: [{ account_type_id: 2, type_name: 'Bank' }],
      balance: '500.00',
    },
  ];
  const accountTypes = [
    { account_type_id: 1, type_name: 'Cash' },
    { account_type_id: 2, type_name: 'Bank' },
    { account_type_id: 3, type_name: 'E-Wallet' },
  ];

  beforeEach(() => {
    localStorage.setItem('finance-user', JSON.stringify({ user_id: 42 }));
    localStorage.setItem('finance-resources', JSON.stringify({ categories: [] }));
    vi.stubGlobal(
      'fetch',
      vi.fn((input: RequestInfo | URL) =>
        Promise.resolve(
          new Response(JSON.stringify(String(input).endsWith('/account-types') ? accountTypes : accounts), {
            status: 200,
          }),
        ),
      ),
    );
    fixture = TestBed.createComponent(AccountsAndWalletsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    localStorage.removeItem('finance-user');
    localStorage.removeItem('finance-resources');
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('loads accounts and calculates the total balance', async () => {
    await component.loadAccounts();

    expect(fetch).toHaveBeenCalledWith('http://127.0.0.1:8000/account-types');
    expect(fetch).toHaveBeenCalledWith('http://127.0.0.1:8000/accounts/42');
    expect(component.accounts).toHaveLength(2);
    expect(component.accountTypes).toEqual(accountTypes);
    expect(component.totalBalance).toBe(625);
    const cachedAccounts = JSON.parse(localStorage.getItem('finance-resources') ?? '{}').accounts;
    expect(cachedAccounts).toHaveLength(2);
    expect(cachedAccounts[0].balance).toBe('125.00');
  });

  it('updates account details through the owned account endpoint', async () => {
    const updatedAccount = {
      ...accounts[0],
      account_name: 'Main eWallet',
      balance: '150.00',
    };
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify(accountTypes), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify(accounts), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify(updatedAccount), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    await component.loadAccounts();

    component.startEditing(component.accounts[0]);
    component.accountForm.account_name = ' Main eWallet ';
    component.accountForm.balance = 150;
    await component.saveAccount();

    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      'http://127.0.0.1:8000/accounts/42/8',
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({
          account_name: 'Main eWallet',
          account_type_ids: [3],
          balance: 150,
        }),
      }),
    );
    expect(component.accounts[0]).toEqual(updatedAccount);
    expect(component.successMessage).toBe('Main eWallet was updated.');
    expect(component.editingAccountId).toBeNull();
  });

  it('creates an account and caches the returned account', async () => {
    const newAccount = {
      account_id: 10,
      user_id: 42,
      account_name: 'Travel Fund',
      account_type_ids: [1, 2],
      account_types: [
        { account_type_id: 1, type_name: 'Cash' },
        { account_type_id: 2, type_name: 'Bank' },
      ],
      balance: '250.50',
    };
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify(accountTypes), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify(accounts), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify(newAccount), { status: 201 }));
    vi.stubGlobal('fetch', fetchMock);
    await component.loadAccounts();

    component.searchTerm = 'Savings';
    component.newAccountForm = {
      account_name: ' Travel Fund ',
      account_type_ids: [1, 2],
      balance: 250.5,
    };
    component.showCreateAccount = true;
    await component.createAccount();

    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      'http://127.0.0.1:8000/accounts/42',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          account_name: 'Travel Fund',
          account_type_ids: [1, 2],
          balance: 250.5,
        }),
      }),
    );
    expect(component.accounts).toHaveLength(3);
    expect(component.accounts[2]).toEqual(newAccount);
    expect(component.searchTerm).toBe('');
    expect(component.showCreateAccount).toBe(false);
    expect(component.successMessage).toBe('Travel Fund was added.');
    expect(component.errorMessage).toBe('');
    expect(JSON.parse(localStorage.getItem('finance-resources') ?? '{}').accounts).toHaveLength(3);
  });

  it('validates account names before creating an account', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    component.userId = 42;
    component.newAccountForm = {
      account_name: '  ',
      account_type_ids: [],
      balance: 0,
    };

    await component.createAccount();

    expect(fetchMock).not.toHaveBeenCalled();
    expect(component.errorMessage).toBe('Enter a name for this account.');
  });

  it('uses the saved balance without adding transaction totals', () => {
    component.accounts = [
      {
        ...accounts[0],
        balance: '125.00',
      },
    ];

    expect(component.getCurrentBalance(component.accounts[0])).toBe(125);
    expect(component.totalBalance).toBe(125);
  });

  it('filters accounts by account name', () => {
    component.accounts = [...accounts];
    component.searchTerm = 'savings';

    expect(component.filteredAccounts).toHaveLength(1);
    expect(component.filteredAccounts[0].account_name).toBe('Savings');
  });
});
