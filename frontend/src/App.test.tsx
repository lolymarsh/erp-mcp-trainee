import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';

const mockRouterProvider = vi.fn();

vi.mock('react-router-dom', () => ({
  RouterProvider: (props: Record<string, unknown>) => {
    mockRouterProvider(props);
    return <div>Router Provider</div>;
  },
  createBrowserRouter: vi.fn(() => ({ routes: [] })),
}));

vi.mock('@mui/material/styles', () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  createTheme: vi.fn(() => ({})),
}));

vi.mock('./router', () => ({
  router: { routes: [] },
}));

describe('App', () => {
  it('renders RouterProvider with theme', () => {
    render(<App />);

    expect(screen.getByText('Router Provider')).toBeInTheDocument();
    expect(mockRouterProvider).toHaveBeenCalledOnce();
  });

  it('passes router to RouterProvider', () => {
    render(<App />);

    const props = mockRouterProvider.mock.calls[0][0];
    expect(props.router).toBeDefined();
    expect(props.router.routes).toEqual([]);
  });
});
