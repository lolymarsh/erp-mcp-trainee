import { createBrowserRouter, Navigate } from 'react-router-dom';
import { Layout } from './shared/components/Layout';
import { LoginPage } from './modules/auth/view';
import { DashboardPage } from './modules/dashboard/view';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'login', element: <LoginPage /> },
    ],
  },
]);
