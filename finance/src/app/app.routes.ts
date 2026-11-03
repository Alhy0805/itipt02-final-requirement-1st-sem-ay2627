import type { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'home',
    loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
  },
  {
    path: 'login',
    loadComponent: () => import('./login/login.page').then((m) => m.LoginPage),
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'finance',
    loadComponent: () => import('./dashboard/financetracker.page').then((m) => m.FinanceTrackerPage),
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./dashboard/dashboard.page').then((m) => m.DashboardPage),
      },
      {
        path: 'transactions',
        loadComponent: () => import('./transactions/transactions.page').then((m) => m.TransactionsPage),
      },
      {
        path: 'income',
        loadComponent: () => import('./income/income.page').then((m) => m.IncomePage),
      },
      {
        path: 'expenses',
        loadComponent: () => import('./expenses/expenses.page').then((m) => m.ExpensesPage),
      },
      {
        path: 'accounts-and-wallets',
        loadComponent: () =>
          import('./accounts-and-wallets/accounts-and-wallets.page').then((m) => m.AccountsAndWalletsPage),
      },
      {
        path: 'categories',
        loadComponent: () => import('./categories/categories.page').then((m) => m.CategoriesPage),
      },
      {
        path: 'reports-and-analytics',
        loadComponent: () =>
          import('./reports-and-analytics/reports-and-analytics.page').then((m) => m.ReportsAndAnalyticsPage),
      },
      {
        path: 'budgets',
        loadComponent: () => import('./budgets/budgets.page').then((m) => m.BudgetsPage),
      },
      {
        path: 'saving-goals',
        loadComponent: () => import('./saving-goals/saving-goals.page').then((m) => m.SavingGoalsPage),
      },
      {
        path: 'recurring-transactions',
        loadComponent: () =>
          import('./recurring-transactions/recurring-transactions.page').then((m) => m.RecurringTransactionsPage),
      },
      {
        path: 'notification',
        loadComponent: () => import('./notification/notification.page').then((m) => m.NotificationPage),
      },
      {
        path: 'settings',
        loadComponent: () => import('./settings/settings.page').then((m) => m.SettingsPage),
      },
    ],
  },
];
