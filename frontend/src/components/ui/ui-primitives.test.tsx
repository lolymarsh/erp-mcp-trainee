import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Label } from './label';
import { Select } from './select';
import { Textarea } from './textarea';
import { Button } from './button';
import { Input } from './input';
import { Card, CardHeader, CardTitle, CardContent } from './card';
import { Badge } from './badge';
import { Skeleton } from './skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './table';

describe('UI Primitives', () => {
  describe('Label', () => {
    it('renders label with text and htmlFor association', () => {
      render(
        <div>
          <Label htmlFor="test-input">Test Label</Label>
          <Input id="test-input" placeholder="type here" />
        </div>
      );
      expect(screen.getByText('Test Label')).toBeInTheDocument();
      expect(screen.getByLabelText('Test Label')).toBeInTheDocument();
    });
  });

  describe('Select', () => {
    it('renders native accessible select with options', () => {
      render(
        <Select data-testid="test-select" defaultValue="opt2">
          <option value="opt1">Option 1</option>
          <option value="opt2">Option 2</option>
        </Select>
      );
      const select = screen.getByTestId('test-select') as HTMLSelectElement;
      expect(select).toBeInTheDocument();
      expect(select.value).toBe('opt2');
    });
  });

  describe('Textarea', () => {
    it('renders textarea with placeholder and allows typing', () => {
      render(<Textarea placeholder="Enter description..." />);
      expect(screen.getByPlaceholderText('Enter description...')).toBeInTheDocument();
    });
  });

  describe('Button, Input, Card, Badge, Skeleton, Table', () => {
    it('renders Button correctly', () => {
      render(<Button variant="destructive">Delete</Button>);
      expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
    });

    it('renders Card components correctly', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Card Title</CardTitle>
          </CardHeader>
          <CardContent>Card Body</CardContent>
        </Card>
      );
      expect(screen.getByText('Card Title')).toBeInTheDocument();
      expect(screen.getByText('Card Body')).toBeInTheDocument();
    });

    it('renders Badge with variants', () => {
      render(<Badge variant="secondary">Active</Badge>);
      expect(screen.getByText('Active')).toBeInTheDocument();
    });

    it('renders Skeleton', () => {
      const { container } = render(<Skeleton className="h-4 w-20" />);
      expect(container.firstChild).toHaveClass('animate-pulse');
    });

    it('renders Table correctly', () => {
      render(
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Header</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>Cell Data</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );
      expect(screen.getByText('Header')).toBeInTheDocument();
      expect(screen.getByText('Cell Data')).toBeInTheDocument();
    });
  });
});
