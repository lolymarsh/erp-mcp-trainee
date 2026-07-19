import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Alert,
  Skeleton,
} from '@mui/material';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { DashboardSummary, LowStockProduct } from './model';

interface DashboardViewProps {
  summary: DashboardSummary | null;
  loading: boolean;
  error: string | null;
}

function formatCurrency(value: string): string {
  const num = parseFloat(value);
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    minimumFractionDigits: 2,
  }).format(num);
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('th-TH').format(value);
}

const lowStockColumns: GridColDef<LowStockProduct>[] = [
  { field: 'name', headerName: 'สินค้า', flex: 1, minWidth: 200 },
  { field: 'current', headerName: 'คงเหลือ', width: 120, type: 'number' },
  { field: 'min', headerName: 'ขั้นต่ำ', width: 120, type: 'number' },
];

export function DashboardView({
  summary,
  loading,
  error,
}: DashboardViewProps): React.ReactElement {
  const navigate = useNavigate();

  if (loading && !summary) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>Dashboard</Typography>
        <Grid container spacing={3}>
          {Array.from({ length: 4 }).map((_, i) => (
            <Grid key={i} size={{ xs: 12, sm: 6, md: 3 }}>
              <Card>
                <CardContent>
                  <Skeleton variant="text" width="60%" height={20} />
                  <Skeleton variant="text" width="40%" height={36} sx={{ mt: 1 }} />
                  <Skeleton variant="text" width="30%" height={16} sx={{ mt: 0.5 }} />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      <Grid container spacing={3} sx={{ mt: 1 }}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent>
                <Skeleton variant="text" width="40%" height={24} />
                <Skeleton variant="rectangular" height={300} sx={{ mt: 2, borderRadius: 1 }} />
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent>
                <Skeleton variant="text" width="40%" height={24} />
                <Skeleton variant="rectangular" height={300} sx={{ mt: 2, borderRadius: 1 }} />
              </CardContent>
            </Card>
          </Grid>
        </Grid>
        <Box sx={{ mt: 3 }}>
          <Card>
            <CardContent>
              <Skeleton variant="text" width="40%" height={24} />
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} variant="text" height={40} sx={{ mt: 0.5 }} />
              ))}
            </CardContent>
          </Card>
        </Box>
      </Box>
    );
  }

  if (error && !summary) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (!summary) {
    return <Typography color="text.secondary">ไม่มีข้อมูล</Typography>;
  }

  const monthlyChartData = summary.monthlySales.map((item) => ({
    month: item.month.slice(5),
    amount: parseFloat(item.amount),
  }));

  const topTechChartData = summary.topTechnicians.map((item) => ({
    name: item.name,
    jobCount: item.jobCount,
  }));

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>

      {error && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card
            sx={{ cursor: 'pointer' }}
            onClick={() => navigate('/sales/invoices')}
          >
            <CardContent>
              <Typography color="text.secondary" gutterBottom variant="subtitle2">
                ยอดขายวันนี้
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                {formatCurrency(summary.todaySales.amount)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {formatNumber(summary.todaySales.count)} รายการ
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card
            sx={{ cursor: 'pointer' }}
            onClick={() => navigate('/jobs')}
          >
            <CardContent>
              <Typography color="text.secondary" gutterBottom variant="subtitle2">
                คิวงานวันนี้
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                {formatNumber(summary.todayJobs.total)}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                <Typography variant="caption" color="success.main">
                  เสร็จ {summary.todayJobs.completed}
                </Typography>
                <Typography variant="caption" color="info.main">
                  กำลังทำ {summary.todayJobs.inProgress}
                </Typography>
                <Typography variant="caption" color="warning.main">
                  รอ {summary.todayJobs.queued}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card
            sx={{
              cursor: 'pointer',
              bgcolor: summary.lowStockProducts.length > 0 ? '#fff3e0' : undefined,
            }}
            onClick={() => navigate('/inventory')}
          >
            <CardContent>
              <Typography color="text.secondary" gutterBottom variant="subtitle2">
                สต็อกใกล้หมด
              </Typography>
              <Typography
                variant="h5"
                sx={{ fontWeight: 'bold' }}
                color={summary.lowStockProducts.length > 0 ? 'error.main' : 'text.primary'}
              >
                {summary.lowStockProducts.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                รายการ
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card
            sx={{ cursor: 'pointer' }}
            onClick={() => navigate('/sales/invoices')}
          >
            <CardContent>
              <Typography color="text.secondary" gutterBottom variant="subtitle2">
                รายได้เดือนนี้
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                {formatCurrency(summary.monthlySales.length > 0
                  ? summary.monthlySales[summary.monthlySales.length - 1].amount
                  : '0.00')}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mt: 1 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                ยอดขายรายเดือน
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}K`} />
                  <Tooltip formatter={(value) => formatCurrency(String(value))} />
                  <Bar dataKey="amount" fill="#1976d2" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Top 5 ช่าง
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topTechChartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="name" width={100} />
                  <Tooltip formatter={(value) => formatNumber(Number(value))} />
                  <Bar dataKey="jobCount" fill="#2e7d32" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {summary.lowStockProducts.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                สินค้าที่สต็อกต่ำกว่าเกณฑ์
              </Typography>
              <DataGrid
                rows={summary.lowStockProducts}
                columns={lowStockColumns}
                getRowId={(row) => row.id}
                disableRowSelectionOnClick
                autoHeight
                pageSizeOptions={[5, 10]}
                initialState={{
                  pagination: { paginationModel: { pageSize: 5 } },
                }}
                sx={{
                  '& .MuiDataGrid-row': {
                    bgcolor: '#fff3e0',
                    '&:hover': { bgcolor: '#ffe0b2' },
                  },
                }}
              />
            </CardContent>
          </Card>
        </Box>
      )}
    </Box>
  );
}
