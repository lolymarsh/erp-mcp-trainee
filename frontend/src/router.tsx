import { createBrowserRouter } from 'react-router-dom';
import { Layout } from './shared/components/Layout';
import { LoginPage } from './modules/auth/view';
import { DashboardView } from './modules/dashboard/view';
import { useDashboard } from './modules/dashboard/controller';
import { CustomerListView } from './modules/customer/view';
import { useCustomerList } from './modules/customer/controller';
import { InventoryListView } from './modules/inventory/view';
import { useInventoryList } from './modules/inventory/controller';
import { InvoiceListView, InvoiceCreateView } from './modules/invoice/view';
import { useInvoiceList, useInvoiceCreate } from './modules/invoice/controller';
import { JobQueueView } from './modules/job/view';
import { useJobQueue, useStatusUpdate } from './modules/job/controller';
import { ChatPanel } from './modules/chat/view';
import { useNavigate } from 'react-router-dom';
import { useState, useCallback } from 'react';

function DashboardRoute() {
  const { summary, loading, error } = useDashboard();
  return (
    <DashboardView
      summary={summary}
      loading={loading}
      error={error}
    />
  );
}

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

function InventoryListRoute() {
  const navigate = useNavigate();
  const { products, loading, error, pagination, setPage, setSearch } =
    useInventoryList();

  return (
    <InventoryListView
      products={products}
      loading={loading}
      error={error}
      pagination={pagination}
      onSearch={setSearch}
      onPageChange={setPage}
      onSelectProduct={(product) => {
        navigate(`/inventory/${product.id}`);
      }}
    />
  );
}

function InvoiceListRoute() {
  const { invoices, loading, error, pagination, setPage, refetch } =
    useInvoiceList();
  const createCtl = useInvoiceCreate();
  const [createOpen, setCreateOpen] = useState(false);

  const handleCreateSuccess = async () => {
    setCreateOpen(false);
    createCtl.reset();
    refetch();
  };

  return (
    <>
      <InvoiceListView
        invoices={invoices}
        loading={loading}
        error={error}
        pagination={pagination}
        onPageChange={setPage}
        onCreateClick={() => setCreateOpen(true)}
      />
      <InvoiceCreateView
        open={createOpen}
        onClose={() => {
          setCreateOpen(false);
          createCtl.reset();
        }}
        customers={createCtl.customers}
        products={createCtl.products}
        items={createCtl.items}
        selectedCustomerId={createCtl.selectedCustomerId}
        selectedPaymentMethod={createCtl.selectedPaymentMethod}
        discount={createCtl.discount}
        grandTotal={createCtl.grandTotal}
        submitting={createCtl.submitting}
        error={createCtl.error}
        onCustomerChange={createCtl.setSelectedCustomerId}
        onPaymentMethodChange={createCtl.setSelectedPaymentMethod}
        onDiscountChange={createCtl.setDiscount}
        onAddItem={createCtl.addItem}
        onRemoveItem={createCtl.removeItem}
        onUpdateItemQuantity={createCtl.updateItemQuantity}
        onSubmit={async () => {
          const result = await createCtl.submit();
          if (result) {
            handleCreateSuccess();
          }
        }}
        onLoadLookups={createCtl.loadLookups}
      />
    </>
  );
}

function JobListRoute() {
  const { jobs, loading, error, pagination, setPage, setStatusFilter, refetch, statusFilter } =
    useJobQueue();
  const statusUpdate = useStatusUpdate(() => refetch());

  const handleStatusChange = useCallback(
    (jobId: string, newStatus: string, version: number) => {
      void statusUpdate.updateStatus(jobId, newStatus, version);
    },
    [statusUpdate],
  );

  return (
    <JobQueueView
      jobs={jobs}
      loading={loading}
      error={error}
      pagination={pagination}
      statusFilter={statusFilter}
      onPageChange={setPage}
      onStatusFilterChange={setStatusFilter}
      onStatusChange={handleStatusChange}
      statusChangeError={statusUpdate.error}
      onClearStatusError={statusUpdate.resetError}
    />
  );
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <DashboardRoute /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'customers', element: <CustomerListRoute /> },
      { path: 'inventory', element: <InventoryListRoute /> },
      { path: 'sales/invoices', element: <InvoiceListRoute /> },
      { path: 'jobs', element: <JobListRoute /> },
      { path: 'chat', element: <ChatPanel /> },
    ],
  },
]);
