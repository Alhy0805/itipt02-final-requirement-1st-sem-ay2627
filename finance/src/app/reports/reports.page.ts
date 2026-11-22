import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { IonButton, IonContent, IonIcon } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { downloadOutline, documentTextOutline } from 'ionicons/icons';
import { firstValueFrom } from 'rxjs';
import { Workbook } from 'exceljs';
import { MainService } from '../services/main-service';
import type { GoalContribution, SavingGoal } from '../services/main-service';

type ExcelCell = string | number | boolean | Date | null;

interface ReportAccount {
  account_id: number;
  account_name: string;
  balance: number | string;
  account_types?: Array<{ type_name?: string }>;
}

interface ReportCategory {
  category_id: number;
  category_name: string;
  category_type?: string;
  icon?: string;
  color?: string;
}

interface ReportBill {
  bill_id: number;
  bill_name: string;
  amount: number | string;
  due_date: string;
  status: string;
}

interface ReportBudget {
  budget_id: number;
  category_id: number;
  budget_name: string;
  budget_amount: number | string;
  start_date: string;
  end_date: string;
  created_at?: string;
}

interface ReportTransaction {
  transaction_id: number;
  account_id: number;
  category_id: number | null;
  transaction_type: string;
  amount: number | string;
  description: string;
  transaction_date: string;
}

interface ReportRecurringTransaction {
  recurring_id: number;
  account_id: number;
  category_id: number | null;
  transaction_type: string;
  description: string;
  amount: number | string;
  frequency: string;
  start_date: string;
  next_due_date: string;
  is_active: boolean | number;
}

interface ReportResources {
  full_name?: string;
  accounts: ReportAccount[];
  categories: ReportCategory[];
  bills: ReportBill[];
  budgets: ReportBudget[];
  transactions: ReportTransaction[];
  savings_goals: SavingGoal[];
  goal_contributions: GoalContribution[];
  recurring_transactions: ReportRecurringTransaction[];
}

@Component({
  selector: 'app-reports',
  templateUrl: './reports.page.html',
  styleUrls: ['./reports.page.scss'],
  imports: [CommonModule, IonButton, IonContent, IonIcon],
})
export class ReportsPage {
  private readonly mainService = inject(MainService);
  isGenerating = false;
  errorMessage = '';
  successMessage = '';

  constructor() {
    addIcons({ downloadOutline, documentTextOutline });
  }

  async generateReport(): Promise<void> {
    if (this.isGenerating) return;

    this.isGenerating = true;
    this.errorMessage = '';
    this.successMessage = '';

    try {
      const userId = this.mainService.getUserId();
      if (!Number.isSafeInteger(userId) || userId <= 0) {
        throw new Error('Sign in before generating a financial report.');
      }

      const response = await firstValueFrom(this.mainService.getResources(userId));
      const resources = this.readResources(response);
      const workbook = this.createWorkbook(resources);
      const buffer = await workbook.xlsx.writeBuffer();
      const downloadUrl = URL.createObjectURL(
        new Blob([buffer], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        }),
      );
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `financial-report-${this.getLocalDate()}.xlsx`;
      document.body.append(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
      this.successMessage = 'Your Excel report has been generated.';
    } catch (error) {
      console.error('Unable to generate financial report:', error);
      this.errorMessage = error instanceof Error ? error.message : 'Unable to generate the financial report.';
    } finally {
      this.isGenerating = false;
    }
  }

  private readResources(value: unknown): ReportResources {
    if (typeof value !== 'object' || value === null) {
      throw new Error('The financial data response was not in the expected format.');
    }

    const data = value as Record<string, unknown>;
    const readArray = <T>(key: string): T[] => {
      const rows = data[key];
      if (!Array.isArray(rows)) {
        throw new Error(`The financial data response is missing ${key}.`);
      }
      return rows as T[];
    };

    const fullName = data['full_name'];
    return {
      full_name: typeof fullName === 'string' ? fullName : undefined,
      accounts: readArray<ReportAccount>('accounts'),
      categories: readArray<ReportCategory>('categories'),
      bills: readArray<ReportBill>('bills'),
      budgets: readArray<ReportBudget>('budgets'),
      transactions: readArray<ReportTransaction>('transactions'),
      savings_goals: readArray<SavingGoal>('savings_goals'),
      goal_contributions: readArray<GoalContribution>('goal_contributions'),
      recurring_transactions: readArray<ReportRecurringTransaction>('recurring_transactions'),
    };
  }

  private createWorkbook(resources: ReportResources): Workbook {
    const workbook = new Workbook();
    workbook.creator = 'Finance Tracker';
    workbook.subject = 'Personal financial data export';
    workbook.created = new Date();

    const income = resources.transactions
      .filter((transaction) => transaction.transaction_type.toLowerCase() === 'income')
      .reduce((total, transaction) => total + Number(transaction.amount), 0);
    const expenses = resources.transactions
      .filter((transaction) => transaction.transaction_type.toLowerCase() === 'expense')
      .reduce((total, transaction) => total + Number(transaction.amount), 0);
    const totalBalance = resources.accounts.reduce((total, account) => total + Number(account.balance), 0);
    const categoryNames = new Map(
      resources.categories.map((category) => [category.category_id, category.category_name]),
    );
    const accountNames = new Map(resources.accounts.map((account) => [account.account_id, account.account_name]));
    const goalNames = new Map(resources.savings_goals.map((goal) => [goal.goal_id, goal.goal_name]));

    this.addSheet(
      workbook,
      'Summary',
      ['Metric', 'Value'],
      [
        ['Report owner', resources.full_name ?? ''],
        ['Generated at', new Date()],
        ['Account balance total', totalBalance],
        ['Income total', income],
        ['Expense total', expenses],
        ['Transaction count', resources.transactions.length],
        ['Account count', resources.accounts.length],
        ['Budget count', resources.budgets.length],
        ['Saving goal count', resources.savings_goals.length],
        ['Goal contribution count', resources.goal_contributions.length],
      ],
      [2],
    );

    this.addSheet(
      workbook,
      'Transactions',
      ['ID', 'Date', 'Type', 'Amount', 'Description', 'Account', 'Category'],
      resources.transactions.map((transaction) => [
        transaction.transaction_id,
        transaction.transaction_date,
        transaction.transaction_type,
        Number(transaction.amount),
        transaction.description,
        accountNames.get(transaction.account_id) ?? transaction.account_id,
        transaction.category_id === null ? '' : (categoryNames.get(transaction.category_id) ?? transaction.category_id),
      ]),
      [4],
    );
    this.addSheet(
      workbook,
      'Accounts',
      ['ID', 'Account', 'Balance', 'Account types'],
      resources.accounts.map((account) => [
        account.account_id,
        account.account_name,
        Number(account.balance),
        (account.account_types ?? [])
          .map((accountType) => accountType.type_name)
          .filter((name): name is string => Boolean(name))
          .join(', '),
      ]),
      [3],
    );
    this.addSheet(
      workbook,
      'Budgets',
      ['ID', 'Budget', 'Category', 'Amount', 'Start date', 'End date'],
      resources.budgets.map((budget) => [
        budget.budget_id,
        budget.budget_name,
        categoryNames.get(budget.category_id) ?? budget.category_id,
        Number(budget.budget_amount),
        budget.start_date,
        budget.end_date,
      ]),
      [4],
    );
    this.addSheet(
      workbook,
      'Saving Goals',
      ['ID', 'Goal', 'Target amount', 'Target date', 'Status'],
      resources.savings_goals.map((goal) => [
        goal.goal_id,
        goal.goal_name,
        Number(goal.target_amount),
        goal.target_date ?? '',
        goal.status ?? '',
      ]),
      [3],
    );
    this.addSheet(
      workbook,
      'Goal Contributions',
      ['ID', 'Goal', 'Amount', 'Date', 'Notes'],
      resources.goal_contributions.map((contribution) => [
        contribution.contribution_id ?? '',
        contribution.goal_name ?? goalNames.get(contribution.goal_id) ?? '',
        Number(contribution.amount),
        contribution.contribution_date ?? '',
        contribution.notes ?? '',
      ]),
      [3],
    );
    this.addSheet(
      workbook,
      'Bills',
      ['ID', 'Bill', 'Amount', 'Due date', 'Status'],
      resources.bills.map((bill) => [bill.bill_id, bill.bill_name, Number(bill.amount), bill.due_date, bill.status]),
      [3],
    );
    this.addSheet(
      workbook,
      'Categories',
      ['ID', 'Category', 'Type', 'Icon', 'Color'],
      resources.categories.map((category) => [
        category.category_id,
        category.category_name,
        category.category_type ?? '',
        category.icon ?? '',
        category.color ?? '',
      ]),
    );
    this.addSheet(
      workbook,
      'Recurring Transactions',
      ['ID', 'Type', 'Description', 'Amount', 'Frequency', 'Start date', 'Next due date', 'Active'],
      resources.recurring_transactions.map((transaction) => [
        transaction.recurring_id,
        transaction.transaction_type,
        transaction.description,
        Number(transaction.amount),
        transaction.frequency,
        transaction.start_date,
        transaction.next_due_date,
        Boolean(transaction.is_active) ? 'Yes' : 'No',
      ]),
      [4],
    );

    return workbook;
  }

  private addSheet(
    workbook: Workbook,
    name: string,
    headers: string[],
    rows: ExcelCell[][],
    currencyColumns: number[] = [],
  ): void {
    const worksheet = workbook.addWorksheet(name);
    worksheet.addRow(headers);
    worksheet.addRows(rows);
    worksheet.views = [{ state: 'frozen', ySplit: 1 }];
    worksheet.autoFilter = {
      from: 'A1',
      to: `${worksheet.getColumn(headers.length).letter}${worksheet.rowCount}`,
    };
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF2563EB' },
    };
    headers.forEach((header, index) => {
      worksheet.getColumn(index + 1).width = Math.min(Math.max(header.length + 3, 14), 36);
    });
    currencyColumns.forEach((column) => {
      worksheet.getColumn(column).numFmt = '"₱"#,##0.00;[Red]-"₱"#,##0.00';
    });
  }

  private getLocalDate(): string {
    const today = new Date();
    return [
      today.getFullYear(),
      String(today.getMonth() + 1).padStart(2, '0'),
      String(today.getDate()).padStart(2, '0'),
    ].join('-');
  }
}
