import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  TrendingUp,
  Wrench,
  AlertTriangle,
  DollarSign,
} from 'lucide-react';
import type { DashboardSummary } from './model';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Skeleton } from '../../components/ui/skeleton';
import { Badge } from '../../components/ui/badge';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../../components/ui/table';

interface DashboardViewProps {
  summary: DashboardSummary | null;
  loading: boolean;
  error: string | null;
}

function formatCurrency(value: string | number): string {
  const num = typeof value === 'string' ? parseFloat(value) || 0 : value;
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    minimumFractionDigits: 2,
  }).format(num);
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('th-TH').format(value);
}

export function DashboardView({
  summary,
  loading,
  error,
}: DashboardViewProps): React.ReactElement {
  const navigate = useNavigate();

  if (loading && !summary) {
    return (
      <div className="space-y-6" role="progressbar">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="p-6 space-y-2">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-1/3" />
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="p-6">
            <Skeleton className="h-6 w-1/3 mb-4" />
            <Skeleton className="h-[300px] w-full" />
          </Card>
          <Card className="p-6">
            <Skeleton className="h-6 w-1/3 mb-4" />
            <Skeleton className="h-[300px] w-full" />
          </Card>
        </div>
        <Card className="p-6">
          <Skeleton className="h-6 w-1/4 mb-4" />
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        </Card>
      </div>
    );
  }

  if (error && !summary) {
    return (
      <div
        role="alert"
        className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
      >
        {error}
      </div>
    );
  }

  if (!summary) {
    return (
      <p className="text-neutral-500 dark:text-neutral-400">
        ไม่มีข้อมูล
      </p>
    );
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300"
        >
          {error}
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today Sales */}
        <Card
          className="p-5 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => navigate('/sales/invoices')}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
              ยอดขายวันนี้
            </span>
            <DollarSign className="size-4 text-neutral-400" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold">
              {formatCurrency(summary.todaySales.amount)}
            </div>
            <p className="text-xs text-neutral-500 mt-1">
              {formatNumber(summary.todaySales.count)} รายการ
            </p>
          </div>
        </Card>

        {/* Today Jobs */}
        <Card
          className="p-5 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => navigate('/jobs')}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
              คิวงานวันนี้
            </span>
            <Wrench className="size-4 text-neutral-400" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold">
              {formatNumber(summary.todayJobs.total)}
            </div>
            <div className="flex items-center gap-2 mt-1 text-xs">
              <span className="text-emerald-600 font-medium">เสร็จ {summary.todayJobs.completed}</span>
              <span className="text-blue-600 font-medium">กำลังทำ {summary.todayJobs.inProgress}</span>
              <span className="text-amber-600 font-medium">รอ {summary.todayJobs.queued}</span>
            </div>
          </div>
        </Card>

        {/* Low Stock Warning */}
        <Card
          className={`p-5 cursor-pointer hover:shadow-md transition-shadow ${
            summary.lowStockProducts.length > 0
              ? 'border-amber-300 bg-amber-50/50 dark:bg-amber-950/20'
              : ''
          }`}
          onClick={() => navigate('/inventory')}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
              สต็อกใกล้หมด
            </span>
            <AlertTriangle className={`size-4 ${summary.lowStockProducts.length > 0 ? 'text-amber-600' : 'text-neutral-400'}`} />
          </div>
          <div className="mt-2">
            <div className={`text-2xl font-bold ${summary.lowStockProducts.length > 0 ? 'text-amber-600' : ''}`}>
              {summary.lowStockProducts.length}
            </div>
            <p className="text-xs text-neutral-500 mt-1">รายการ</p>
          </div>
        </Card>

        {/* Monthly Revenue */}
        <Card
          className="p-5 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => navigate('/sales/invoices')}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
              รายได้เดือนนี้
            </span>
            <TrendingUp className="size-4 text-neutral-400" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold">
              {formatCurrency(
                summary.monthlySales.length > 0
                  ? summary.monthlySales[summary.monthlySales.length - 1].amount
                  : '0.00'
              )}
            </div>
            <p className="text-xs text-neutral-500 mt-1">สรุปยอดประจำเดือน</p>
          </div>
        </Card>
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <CardHeader className="p-0 pb-4">
            <CardTitle className="text-base font-semibold">ยอดขายรายเดือน</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#888888" opacity={0.2} />
                  <XAxis dataKey="month" fontSize={12} stroke="#888888" />
                  <YAxis
                    tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}K`}
                    fontSize={12}
                    stroke="#888888"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(23, 23, 23, 0.95)',
                      borderColor: '#404040',
                      borderRadius: '8px',
                      color: '#f5f5f5',
                      fontSize: '12px',
                    }}
                    formatter={(value) => formatCurrency(String(value))}
                  />
                  <Bar dataKey="amount" fill="#0284c7" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="p-6">
          <CardHeader className="p-0 pb-4">
            <CardTitle className="text-base font-semibold">Top 5 ช่าง</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topTechChartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#888888" opacity={0.2} />
                  <XAxis type="number" fontSize={12} stroke="#888888" />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={90}
                    fontSize={12}
                    stroke="#888888"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(23, 23, 23, 0.95)',
                      borderColor: '#404040',
                      borderRadius: '8px',
                      color: '#f5f5f5',
                      fontSize: '12px',
                    }}
                    formatter={(value) => formatNumber(Number(value))}
                  />
                  <Bar dataKey="jobCount" fill="#16a34a" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Table */}
      {summary.lowStockProducts.length > 0 && (
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">
              สินค้าที่สต็อกต่ำกว่าเกณฑ์
            </h2>
            <Badge variant="destructive">
              {summary.lowStockProducts.length} รายการ
            </Badge>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>สินค้า</TableHead>
                <TableHead className="text-right w-32">คงเหลือ</TableHead>
                <TableHead className="text-right w-32">ขั้นต่ำ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {summary.lowStockProducts.map((p) => (
                <TableRow
                  key={p.id}
                  className="bg-amber-50/50 hover:bg-amber-100/50 dark:bg-amber-950/20 dark:hover:bg-amber-950/40 cursor-pointer"
                  onClick={() => navigate('/inventory')}
                >
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell className="text-right font-semibold text-red-600 dark:text-red-400">
                    {p.current}
                  </TableCell>
                  <TableCell className="text-right text-neutral-500">
                    {p.min}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
