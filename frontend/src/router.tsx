import { createBrowserRouter } from 'react-router-dom';
import { Layout } from './shared/components/Layout';
import { LoginPage } from './modules/auth/view';
import { DashboardPage } from './modules/dashboard/view';
import { CustomerListView } from './modules/customer/view';
import { useCustomerList } from './modules/customer/controller';
import { useNavigate } from 'react-router-dom';

function CustomerListRoute() {
  const navigate = useNavigate();
  const { customers, loading, error, pagination, setPage, setSearch } =
    useCustomerList();

  return (
    <CustomerListView
      customers={customers}
      loading={loading}
      error={error}
      pagination={pagination}
      onSearch={setSearch}
      onPageChange={setPage}
      onSelectCustomer={(customer) => {
        navigate(`/customers/${customer.id}`);
      }}
    />
  );
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'customers', element: <CustomerListRoute /> },
    ],
  },
]);
