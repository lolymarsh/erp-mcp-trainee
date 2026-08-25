import { RouterProvider } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { router } from './router';
import { Toaster } from './components/ui/sonner';

const theme = createTheme({
  palette: {
    primary: { main: '#1976d2' },
    secondary: { main: '#dc004e' },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <RouterProvider router={router} />
      <Toaster position="top-right" richColors />
    </ThemeProvider>
  );
}

export default App;

