import { createBrowserRouter, useNavigate, useParams, Navigate } from 'react-router-dom';
import { NotFoundPage } from './shared/pages/NotFound';
import { useAuthStore } from './stores/authStore';
import { Layout } from './shared/components/Layout';
import { LoginPage } from './modules/auth/view';
import { DashboardView } from './modules/dashboard/view';
import { useDashboard } from './modules/dashboard/controller';
import {
  CustomerListView,
  CustomerDetailView,
  CustomerCreateDialog,
  CustomerEditDialog,
  DeleteConfirmDialog,
  VehicleCreateDialog,
  VehicleEditDialog,
  VehicleDeleteConfirmDialog,
} from './modules/customer/view';
import {
  useCustomerList,
  useCustomerDetail,
  useCustomerCreate,
  useCustomerUpdate,
  useCustomerDelete,
  useVehicleCreate,
  useVehicleUpdate,
  useVehicleDelete,
} from './modules/customer/controller';
import {
  InventoryListView,
  InventoryDetailView,
  ProductCreateDialog,
  ProductEditDialog,
  StockAdjustDialog,
  ProductDeleteConfirmDialog,
  CategoryManageView,
  CategoryCreateDialog,
  CategoryEditDialog,
  CategoryDeleteConfirmDialog,
} from './modules/inventory/view';
import {
  useInventoryList,
  useInventoryDetail,
  useProductCreate,
  useProductUpdate,
  useProductDelete,
  useStockAdjust,
  useCategoryList,
  useCategoryCreate,
  useCategoryUpdate,
  useCategoryDelete,
} from './modules/inventory/controller';
import { InvoiceListView, InvoiceCreateView, InvoiceDetailView, InvoicePaymentUpdateDialog } from './modules/invoice/view';
import { useInvoiceList, useInvoiceCreate, useInvoiceDetail, useInvoicePaymentUpdate } from './modules/invoice/controller';
import { JobQueueView, JobCreateDialog, JobDetailView } from './modules/job/view';
import { useJobQueue, useStatusUpdate, useJobCreate, useJobDetail } from './modules/job/controller';
import { ChatPanel } from './modules/chat/view';
import {
  UserListView,
  UserCreateDialog,
  UserEditDialog,
  UserDeleteConfirmDialog,
} from './modules/user/view';
import {
  useUserList,
  useUserCreate,
  useUserUpdate,
  useUserDelete,
  useUserToggleActive,
} from './modules/user/controller';
import { AuditLogDialog } from './shared/components/AuditLogDialog';
import { useState, useCallback } from 'react';
import type { CustomerWithVehicles } from './modules/customer/model';
import type { ProductWithMovements } from './modules/inventory/model';

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

function LoginGuard() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  return <LoginPage />;
}

function CustomerListRoute() {
  const navigate = useNavigate();
  const { customers, loading, error, pagination, setPage, setSearch, refetch } =
    useCustomerList();
  const createCtl = useCustomerCreate(refetch);

  return (
    <>
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
        onCreateClick={() => createCtl.setOpen(true)}
      />
      <CustomerCreateDialog
        open={createCtl.open}
        onClose={createCtl.handleClose}
        loading={createCtl.loading}
        error={createCtl.error}
        fieldErrors={createCtl.fieldErrors}
        onSubmit={createCtl.submit}
      />
    </>
  );
}

function CustomerDetailRoute() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { customer, loading, error, refetch } = useCustomerDetail(id!);
  const updateCtl = useCustomerUpdate(id!, refetch);
  const deleteCtl = useCustomerDelete(
    id!,
    () => navigate('/customers'),
    refetch,
  );
  const vehicleCreateCtl = useVehicleCreate(refetch);
  const vehicleUpdateCtl = useVehicleUpdate(refetch);
  const vehicleDeleteCtl = useVehicleDelete(refetch);
  const [historyOpen, setHistoryOpen] = useState(false);

  const handleEdit = useCallback(
    (c: CustomerWithVehicles) => updateCtl.openWithData(c),
    [updateCtl],
  );

  const handleDelete = useCallback(
    () => {
      deleteCtl.setOpen(true);
    },
    [deleteCtl],
  );

  return (
    <>
      <CustomerDetailView
        customer={customer}
        loading={loading}
        error={error}
        onBack={() => navigate('/customers')}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onHistory={() => setHistoryOpen(true)}
        onAddVehicle={() => vehicleCreateCtl.setOpen(true)}
        onEditVehicle={(v) => vehicleUpdateCtl.openWithData(v)}
        onDeleteVehicle={(v) => vehicleDeleteCtl.openWithData(v)}
      />
      <CustomerEditDialog
        open={updateCtl.open}
        onClose={updateCtl.handleClose}
        loading={updateCtl.loading}
        error={updateCtl.error}
        fieldErrors={updateCtl.fieldErrors}
        initialValues={updateCtl.initialValues}
        onSubmit={updateCtl.submit}
      />
      <DeleteConfirmDialog
        open={deleteCtl.open}
        customerName={customer ? `${customer.firstName} ${customer.lastName}` : ''}
        loading={deleteCtl.loading}
        error={deleteCtl.error}
        onCancel={deleteCtl.handleClose}
        onConfirm={() => {
          if (customer) {
            deleteCtl.submit(customer.version);
          }
        }}
      />
      <VehicleCreateDialog
        open={vehicleCreateCtl.open}
        onClose={vehicleCreateCtl.handleClose}
        loading={vehicleCreateCtl.loading}
        error={vehicleCreateCtl.error}
        customerId={id!}
        onSubmit={vehicleCreateCtl.submit}
      />
      <VehicleEditDialog
        open={vehicleUpdateCtl.open}
        onClose={vehicleUpdateCtl.handleClose}
        loading={vehicleUpdateCtl.loading}
        error={vehicleUpdateCtl.error}
        initialValues={vehicleUpdateCtl.initialValues}
        onSubmit={vehicleUpdateCtl.submit}
      />
      <VehicleDeleteConfirmDialog
        open={vehicleDeleteCtl.open}
        licensePlate={vehicleDeleteCtl.vehicleInfo?.licensePlate ?? ''}
        loading={vehicleDeleteCtl.loading}
        error={vehicleDeleteCtl.error}
        onCancel={vehicleDeleteCtl.handleClose}
        onConfirm={vehicleDeleteCtl.submit}
      />
      {id && (
        <AuditLogDialog
          open={historyOpen}
          onClose={() => setHistoryOpen(false)}
          tableName="customers"
          recordId={id}
          entityLabel={customer ? `${customer.firstName} ${customer.lastName}` : undefined}
        />
      )}
    </>
  );
}

function InventoryListRoute() {
  const navigate = useNavigate();
  const { products, loading, error, pagination, setPage, setSearch, refetch } =
    useInventoryList();
  const createCtl = useProductCreate(refetch);

  return (
    <>
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
        onCreateClick={() => createCtl.setOpen(true)}
        onManageCategoriesClick={() => navigate('/inventory/categories')}
      />
      <ProductCreateDialog
        open={createCtl.open}
        onClose={createCtl.handleClose}
        loading={createCtl.loading}
        error={createCtl.error}
        fieldErrors={createCtl.fieldErrors}
        onSubmit={createCtl.submit}
      />
    </>
  );
}

function InventoryCategoryRoute() {
  const navigate = useNavigate();
  const { categories, loading, error, pagination, setPage, setSearch, refetch } =
    useCategoryList();
  const createCtl = useCategoryCreate(refetch);
  const updateCtl = useCategoryUpdate(refetch);
  const deleteCtl = useCategoryDelete(refetch);
  const [historyCategory, setHistoryCategory] = useState<CategoryEntity | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);

  const handleHistoryClick = useCallback((cat: CategoryEntity) => {
    setHistoryCategory(cat);
    setHistoryOpen(true);
  }, []);

  return (
    <>
      <CategoryManageView
        categories={categories}
        loading={loading}
        error={error}
        pagination={pagination}
        onBack={() => navigate('/inventory')}
        onAddClick={() => createCtl.setOpen(true)}
        onEditClick={(cat) => updateCtl.openWithData(cat)}
        onDeleteClick={(cat) => deleteCtl.openWithData(cat)}
        onHistoryClick={handleHistoryClick}
        onSearch={setSearch}
        onPageChange={setPage}
      />
      <CategoryCreateDialog
        open={createCtl.open}
        onClose={createCtl.handleClose}
        loading={createCtl.loading}
        error={createCtl.error}
        fieldErrors={createCtl.fieldErrors}
        onSubmit={createCtl.submit}
      />
      <CategoryEditDialog
        open={updateCtl.open}
        onClose={updateCtl.handleClose}
        loading={updateCtl.loading}
        error={updateCtl.error}
        fieldErrors={updateCtl.fieldErrors}
        initialValues={updateCtl.initialValues}
        onSubmit={updateCtl.submit}
      />
      <CategoryDeleteConfirmDialog
        open={deleteCtl.open}
        categoryName={deleteCtl.categoryName}
        loading={deleteCtl.loading}
        error={deleteCtl.error}
        onCancel={deleteCtl.handleClose}
        onConfirm={deleteCtl.submit}
      />
      {historyCategory && (
        <AuditLogDialog
          open={historyOpen}
          onClose={() => setHistoryOpen(false)}
          tableName="categories"
          recordId={historyCategory.id}
          entityLabel={historyCategory.name}
        />
      )}
    </>
  );
}

function InventoryDetailRoute() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { product, loading, error, refetch } = useInventoryDetail(id!);
  const updateCtl = useProductUpdate(id!, refetch);
  const deleteCtl = useProductDelete(
    id!,
    () => navigate('/inventory'),
    refetch,
  );
  const stockAdjustCtl = useStockAdjust(id!, refetch);
  const [historyOpen, setHistoryOpen] = useState(false);

  const handleEdit = (p: ProductWithMovements) => updateCtl.openWithData(p);
  const handleDelete = () => deleteCtl.setOpen(true);
  const handleStockAdjust = () => stockAdjustCtl.setOpen(true);

  return (
    <>
      <InventoryDetailView
        product={product}
        loading={loading}
        error={error}
        onBack={() => navigate('/inventory')}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onStockAdjust={handleStockAdjust}
        onHistory={() => setHistoryOpen(true)}
      />
      <ProductEditDialog
        open={updateCtl.open}
        onClose={updateCtl.handleClose}
        loading={updateCtl.loading}
        error={updateCtl.error}
        fieldErrors={updateCtl.fieldErrors}
        initialValues={updateCtl.initialValues}
        onSubmit={updateCtl.submit}
      />
      <StockAdjustDialog
        open={stockAdjustCtl.open}
        onClose={stockAdjustCtl.handleClose}
        loading={stockAdjustCtl.loading}
        error={stockAdjustCtl.error}
        fieldErrors={stockAdjustCtl.fieldErrors}
        onSubmit={stockAdjustCtl.submit}
      />
      <ProductDeleteConfirmDialog
        open={deleteCtl.open}
        productName={product ? product.name : ''}
        loading={deleteCtl.loading}
        error={deleteCtl.error}
        onCancel={deleteCtl.handleClose}
        onConfirm={() => {
          if (product) {
            deleteCtl.submit(product.version);
          }
        }}
      />
      {id && (
        <AuditLogDialog
          open={historyOpen}
          onClose={() => setHistoryOpen(false)}
          tableName="products"
          recordId={id}
          entityLabel={product ? product.name : undefined}
        />
      )}
    </>
  );
}

function InvoiceListRoute() {
  const navigate = useNavigate();
  const { invoices, loading, error, pagination, setPage, refetch, setSearch, setStatusFilter, setPaymentMethodFilter, search, statusFilter, paymentMethodFilter } =
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
        onSelectInvoice={(inv) => navigate(`/sales/invoices/${inv.id}`)}
        onSearch={setSearch}
        onStatusFilterChange={setStatusFilter}
        onPaymentMethodFilterChange={setPaymentMethodFilter}
        statusFilter={statusFilter}
        paymentMethodFilter={paymentMethodFilter}
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
        customerLoading={createCtl.customerLoading}
        productLoading={createCtl.productLoading}
        onCustomerSearch={createCtl.handleCustomerSearch}
        onProductSearch={createCtl.handleProductSearch}
        onLoadMoreCustomers={createCtl.loadMoreCustomers}
        onLoadMoreProducts={createCtl.loadMoreProducts}
      />
    </>
  );
}

function JobListRoute() {
  const navigate = useNavigate();
  const { jobs, loading, error, pagination, setPage, setStatusFilter, setJobTypeFilter, setSearch, refetch, statusFilter, jobTypeFilter, search } =
    useJobQueue();
  const statusUpdate = useStatusUpdate(() => refetch());
  const createCtl = useJobCreate(() => refetch());

  const handleStatusChange = useCallback(
    (jobId: string, newStatus: string, version: number) => {
      void statusUpdate.updateStatus(jobId, newStatus, version);
    },
    [statusUpdate],
  );

  return (
    <>
      <JobQueueView
        jobs={jobs}
        loading={loading}
        error={error}
        pagination={pagination}
        statusFilter={statusFilter}
        jobTypeFilter={jobTypeFilter}
        onPageChange={setPage}
        onStatusFilterChange={setStatusFilter}
        onJobTypeFilterChange={setJobTypeFilter}
        onSearch={setSearch}
        search={search}
        onStatusChange={handleStatusChange}
        statusChangeError={statusUpdate.error}
        onClearStatusError={statusUpdate.resetError}
        onRowClick={(job) => navigate(`/jobs/${job.id}`)}
        onCreateClick={() => createCtl.setOpen(true)}
      />
      <JobCreateDialog
        open={createCtl.open}
        onClose={createCtl.handleClose}
        loading={createCtl.loading}
        error={createCtl.error}
        fieldErrors={createCtl.fieldErrors}
        customers={createCtl.customers}
        vehicles={createCtl.vehicles}
        customerId={createCtl.customerId}
        vehicleId={createCtl.vehicleId}
        jobType={createCtl.jobType}
        scheduledDate={createCtl.scheduledDate}
        technicianId={createCtl.technicianId}
        notes={createCtl.notes}
        onCustomerChange={createCtl.setCustomerId}
        onVehicleChange={createCtl.setVehicleId}
        onJobTypeChange={createCtl.setJobType}
        onScheduledDateChange={createCtl.setScheduledDate}
        onTechnicianChange={createCtl.setTechnicianId}
        onNotesChange={createCtl.setNotes}
        onCustomerSearch={createCtl.handleCustomerSearch}
        customerLoading={createCtl.customerLoading}
        onLoadMoreCustomers={createCtl.loadMoreCustomers}
        onSubmit={createCtl.submit}
      />
    </>
  );
}

function JobDetailRoute() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { job, loading, error, refetch } = useJobDetail(id!);
  const statusUpdate = useStatusUpdate(() => refetch());
  const [historyOpen, setHistoryOpen] = useState(false);

  const handleStatusChange = useCallback(
    (newStatus: string, version: number) => {
      void statusUpdate.updateStatus(id!, newStatus, version);
    },
    [statusUpdate, id],
  );

  return (
    <>
      <JobDetailView
        job={job}
        loading={loading}
        error={error}
        onBack={() => navigate('/jobs')}
        onStatusChange={handleStatusChange}
        onHistory={() => setHistoryOpen(true)}
      />
      {id && (
        <AuditLogDialog
          open={historyOpen}
          onClose={() => setHistoryOpen(false)}
          tableName="jobs"
          recordId={id}
        />
      )}
    </>
  );
}

function InvoiceDetailRoute() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { invoice, loading, error, refetch } = useInvoiceDetail(id!);
  const paymentCtl = useInvoicePaymentUpdate(() => refetch());
  const [historyOpen, setHistoryOpen] = useState(false);

  const handlePaymentUpdate = useCallback(async (data: { paymentStatus: string; paymentMethod: string | null; version: number }) => {
    await paymentCtl.submit(id!, data);
  }, [id, paymentCtl]);

  return (
    <>
      <InvoiceDetailView
        invoice={invoice}
        loading={loading}
        error={error}
        onBack={() => navigate('/sales/invoices')}
        onHistory={() => setHistoryOpen(true)}
        onUpdatePayment={() => paymentCtl.setOpen(true)}
      />
      <InvoicePaymentUpdateDialog
        open={paymentCtl.open}
        onClose={() => paymentCtl.setOpen(false)}
        invoice={invoice}
        submitting={paymentCtl.submitting}
        error={paymentCtl.error}
        onSubmit={handlePaymentUpdate}
      />
      {id && (
        <AuditLogDialog
          open={historyOpen}
          onClose={() => setHistoryOpen(false)}
          tableName="invoices"
          recordId={id}
        />
      )}
    </>
  );
}

function UserListRoute() {
  const { users, loading, error, pagination, setPage, setRoleFilter, roleFilter, refetch, setSearch, search } =
    useUserList();
  const createCtl = useUserCreate(refetch);
  const updateCtl = useUserUpdate(refetch);
  const deleteCtl = useUserDelete(refetch);
  const toggleCtl = useUserToggleActive(refetch);
  const [historyUser, setHistoryUser] = useState<UserEntity | null>(null);

  return (
    <>
        <UserListView
          users={users}
          loading={loading}
          error={error}
          pagination={pagination}
          roleFilter={roleFilter}
          onPageChange={setPage}
          onRoleFilterChange={setRoleFilter}
          onEdit={(user) => updateCtl.openWithData(user)}
          onDelete={(user) => deleteCtl.openWithData(user)}
          onToggleActive={(id) => toggleCtl.toggle(id)}
          onHistory={(user) => setHistoryUser(user)}
          onCreateClick={() => createCtl.setOpen(true)}
          onSearch={setSearch}
          search={search}
        />
      <UserCreateDialog
        open={createCtl.open}
        onClose={createCtl.handleClose}
        loading={createCtl.loading}
        error={createCtl.error}
        fieldErrors={createCtl.fieldErrors}
        onSubmit={createCtl.submit}
      />
      <UserEditDialog
        open={updateCtl.open}
        onClose={updateCtl.handleClose}
        loading={updateCtl.loading}
        error={updateCtl.error}
        fieldErrors={updateCtl.fieldErrors}
        initialValues={updateCtl.initialValues}
        onSubmit={updateCtl.submit}
      />
      <UserDeleteConfirmDialog
        open={deleteCtl.open}
        userName={deleteCtl.userName}
        loading={deleteCtl.loading}
        error={deleteCtl.error}
        onCancel={deleteCtl.handleClose}
        onConfirm={deleteCtl.submit}
      />
      {historyUser && (
        <AuditLogDialog
          open={!!historyUser}
          onClose={() => setHistoryUser(null)}
          tableName="users"
          recordId={historyUser.id}
          entityLabel={historyUser.displayName}
        />
      )}
    </>
  );
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <DashboardRoute /> },
      { path: 'login', element: <LoginGuard /> },
      { path: 'customers', element: <CustomerListRoute /> },
      { path: 'customers/:id', element: <CustomerDetailRoute /> },
      { path: 'inventory', element: <InventoryListRoute /> },
      { path: 'inventory/categories', element: <InventoryCategoryRoute /> },
      { path: 'inventory/:id', element: <InventoryDetailRoute /> },
      { path: 'sales/invoices', element: <InvoiceListRoute /> },
      { path: 'sales/invoices/:id', element: <InvoiceDetailRoute /> },
      { path: 'jobs', element: <JobListRoute /> },
      { path: 'jobs/:id', element: <JobDetailRoute /> },
      { path: 'chat', element: <ChatPanel /> },
      { path: 'admin/users', element: <UserListRoute /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
