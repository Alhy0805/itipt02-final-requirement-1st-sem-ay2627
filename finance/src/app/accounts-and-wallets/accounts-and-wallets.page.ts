import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonButton, IonContent, IonIcon } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  addOutline,
  businessOutline,
  cashOutline,
  closeOutline,
  createOutline,
  refreshOutline,
  saveOutline,
  searchOutline,
  walletOutline,
} from 'ionicons/icons';

interface AccountType {
  account_type_id: number;
  type_name: string;
}

interface Account {
  account_id: number;
  user_id: number;
  account_name: string;
  account_type_ids: number[];
  account_types: AccountType[];
  balance: number | string;
  created_at?: string;
}

interface CachedResources {
  accounts?: Account[];
  [key: string]: unknown;
}

interface AccountForm {
  account_name: string;
  account_type_ids: number[];
  balance: number | null;
}

@Component({
  selector: 'app-accounts-and-wallets',
  templateUrl: './accounts-and-wallets.page.html',
  styleUrls: ['./accounts-and-wallets.page.scss'],
  imports: [IonButton, IonContent, IonIcon, CommonModule, FormsModule],
})
export class AccountsAndWalletsPage {
  private readonly changeDetector = inject(ChangeDetectorRef);
  readonly api = 'http://127.0.0.1:8000';

  accountTypes: AccountType[] = [];
  accounts: Account[] = [];
  searchTerm = '';
  editingAccountId: number | null = null;
  accountForm: AccountForm = this.emptyForm();
  newAccountForm: AccountForm = this.emptyForm();
  userId: number | null = null;
  showCreateAccount = false;
  errorMessage = '';
  successMessage = '';
  isLoading = true;
  isSaving = false;
  isCreatingAccount = false;

  constructor() {
    addIcons({
      addOutline,
      businessOutline,
      cashOutline,
      closeOutline,
      createOutline,
      refreshOutline,
      saveOutline,
      searchOutline,
      walletOutline,
    });
  }

  ionViewWillEnter(): void {
    void this.loadAccounts();
  }

  get filteredAccounts(): Account[] {
    const term = this.searchTerm.trim().toLowerCase();
    return this.accounts.filter(
      (account) =>
        !term ||
        account.account_name.toLowerCase().includes(term) ||
        account.account_types.some((type) => type.type_name.toLowerCase().includes(term)),
    );
  }

  get totalBalance(): number {
    return this.accounts.reduce((total, account) => total + this.getCurrentBalance(account), 0);
  }

  hasWalletType(types: AccountType[]): boolean {
    return types.some((type) => type.type_name === 'E-Wallet');
  }

  getCurrentBalance(account: Account): number {
    return Number(account.balance) || 0;
  }

  getAccountIcon(types: AccountType[]): string {
    if (types.some((type) => type.type_name === 'Bank')) return 'business-outline';
    if (types.some((type) => type.type_name === 'Cash')) return 'cash-outline';
    return 'wallet-outline';
  }

  getAccountTypeLabel(types: AccountType[]): string {
    return types.map((type) => type.type_name).join(', ');
  }

  async loadAccounts(): Promise<void> {
    this.isLoading = true;
    this.errorMessage = '';

    try {
      const savedUser = localStorage.getItem('finance-user');
      if (!savedUser) throw new Error('Please sign in again to view your accounts.');

      const user = JSON.parse(savedUser) as { user_id?: number };
      const userId = Number(user.user_id);
      if (!Number.isInteger(userId) || userId <= 0) {
        throw new Error('Your saved user session is invalid. Please sign in again.');
      }
      this.userId = userId;

      const [typesResponse, accountsResponse] = await Promise.all([
        fetch(`${this.api}/account-types`),
        fetch(`${this.api}/accounts/${userId}`),
      ]);
      if (!typesResponse.ok) throw new Error(await this.getResponseError(typesResponse));
      if (!accountsResponse.ok) throw new Error(await this.getResponseError(accountsResponse));

      this.accountTypes = (await typesResponse.json()) as AccountType[];
      this.accounts = (await accountsResponse.json()) as Account[];
      this.updateCachedAccounts();
    } catch (error) {
      console.error('Unable to load accounts:', error);
      this.errorMessage = error instanceof Error ? error.message : 'Unable to load accounts.';
    } finally {
      this.isLoading = false;
      this.changeDetector.detectChanges();
    }
  }

  openCreateAccount(): void {
    this.errorMessage = '';
    this.successMessage = '';
    this.newAccountForm = this.emptyForm();
    this.showCreateAccount = true;
  }

  cancelCreateAccount(): void {
    this.showCreateAccount = false;
    this.newAccountForm = this.emptyForm();
    this.errorMessage = '';
  }

  async createAccount(): Promise<void> {
    if (this.isCreatingAccount || this.userId === null) return;

    const accountName = this.newAccountForm.account_name.trim();
    const balance = Number(this.newAccountForm.balance);
    const validationError = this.getAccountFormError(this.newAccountForm, accountName, balance);
    if (validationError) {
      this.errorMessage = validationError;
      return;
    }

    this.isCreatingAccount = true;
    this.errorMessage = '';
    this.successMessage = '';
    try {
      const response = await fetch(`${this.api}/accounts/${this.userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          account_name: accountName,
          account_type_ids: this.newAccountForm.account_type_ids,
          balance,
        }),
      });
      if (!response.ok) throw new Error(await this.getResponseError(response));

      const createdAccount = (await response.json()) as Account;
      this.accounts = [...this.accounts, createdAccount];
      this.updateCachedAccounts();
      this.searchTerm = '';
      this.showCreateAccount = false;
      this.newAccountForm = this.emptyForm();
      this.successMessage = `${createdAccount.account_name} was added.`;
    } catch (error) {
      console.error('Unable to create account:', error);
      this.errorMessage = error instanceof Error ? error.message : 'Unable to create account.';
    } finally {
      this.isCreatingAccount = false;
      this.changeDetector.detectChanges();
    }
  }

  startEditing(account: Account): void {
    this.errorMessage = '';
    this.successMessage = '';
    this.editingAccountId = account.account_id;
    this.accountForm = {
      account_name: account.account_name,
      account_type_ids: [...account.account_type_ids],
      balance: Number(account.balance),
    };
  }

  cancelEditing(): void {
    this.editingAccountId = null;
    this.accountForm = this.emptyForm();
    this.errorMessage = '';
  }

  async saveAccount(): Promise<void> {
    if (this.isSaving || this.editingAccountId === null || this.userId === null) return;

    const accountName = this.accountForm.account_name.trim();
    const balance = Number(this.accountForm.balance);
    const validationError = this.getAccountFormError(this.accountForm, accountName, balance);
    if (validationError) {
      this.errorMessage = validationError;
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';
    this.successMessage = '';
    try {
      const response = await fetch(`${this.api}/accounts/${this.userId}/${this.editingAccountId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          account_name: accountName,
          account_type_ids: this.accountForm.account_type_ids,
          balance,
        }),
      });
      if (!response.ok) throw new Error(await this.getResponseError(response));

      const updatedAccount = (await response.json()) as Account;
      this.accounts = this.accounts.map((account) =>
        account.account_id === updatedAccount.account_id ? updatedAccount : account,
      );
      this.updateCachedAccounts();
      this.editingAccountId = null;
      this.accountForm = this.emptyForm();
      this.successMessage = `${updatedAccount.account_name} was updated.`;
    } catch (error) {
      console.error('Unable to update account:', error);
      this.errorMessage = error instanceof Error ? error.message : 'Unable to update account.';
    } finally {
      this.isSaving = false;
      this.changeDetector.detectChanges();
    }
  }

  private updateCachedAccounts(): void {
    const savedResources = localStorage.getItem('finance-resources');
    if (!savedResources) return;

    const resources = JSON.parse(savedResources) as CachedResources;
    localStorage.setItem('finance-resources', JSON.stringify({ ...resources, accounts: this.accounts }));
  }

  private async getResponseError(response: Response): Promise<string> {
    try {
      const result: unknown = await response.json();
      if (typeof result === 'object' && result !== null && 'detail' in result && typeof result.detail === 'string') {
        return result.detail;
      }
    } catch (error) {
      if (!(error instanceof SyntaxError)) throw error;
    }
    return `Request failed (${response.status}).`;
  }

  private emptyForm(): AccountForm {
    return { account_name: '', account_type_ids: [], balance: 0 };
  }

  private getAccountFormError(form: AccountForm, accountName: string, balance: number): string | null {
    if (!accountName) return 'Enter a name for this account.';
    if (accountName.length > 100) return 'Account names must be 100 characters or fewer.';
    if (form.account_type_ids.length === 0) return 'Select at least one account type.';
    if (!Number.isFinite(balance) || Math.abs(balance) >= 10_000_000_000) {
      return 'Enter a valid balance with up to 10 digits before the decimal.';
    }
    if (Math.round(balance * 100) !== balance * 100) return 'Balance can have up to 2 decimal places.';
    return null;
  }
}
