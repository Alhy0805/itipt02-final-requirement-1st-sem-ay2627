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
    loadComponent: () => import('./finance/finance.page').then((m) => m.FinancePage),
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./dashboard/dashboard.page').then((m) => m.DashboardPage),
      },
      {
        path: 'transaction-management',
        loadComponent: () =>
          import('./transaction-management/transaction-management.page').then((m) => m.TransactionManagementPage),
      },
      {
        path: 'accounts-and-wallets',
        loadComponent: () =>
          import('./accounts-and-wallets/accounts-and-wallets.page').then((m) => m.AccountsAndWalletsPage),
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
        path: 'account',
        loadComponent: () => import('./account/account.page').then((m) => m.AccountPage),
      },
      {
        path: 'settings',
        redirectTo: 'account',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: 'signup',
    loadComponent: () => import('./signup/signup.page').then((m) => m.SignupPage),
  },
  {
    path: 'service-test',
    loadComponent: () => import('./service-test/service-test.page').then((m) => m.ServiceTestPage),
  },
];
