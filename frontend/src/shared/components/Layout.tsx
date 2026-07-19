import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Box,
  CssBaseline,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Button,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import InventoryIcon from '@mui/icons-material/Inventory';
import ReceiptIcon from '@mui/icons-material/Receipt';
import BuildIcon from '@mui/icons-material/Build';
import ChatIcon from '@mui/icons-material/Chat';
import LoginIcon from '@mui/icons-material/Login';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import { useAuthStore } from '../../stores/authStore';

const drawerWidth = 240;

export function Layout(): React.ReactElement {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <Typography variant="h6" noWrap sx={{ flexGrow: 1 }}>
            Versus ERP
          </Typography>
          {isAuthenticated ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="body2">{user?.displayName}</Typography>
              <Button color="inherit" onClick={handleLogout} size="small">
                Logout
              </Button>
            </Box>
          ) : (
            <Button color="inherit" onClick={() => navigate('/login')} startIcon={<LoginIcon />}>
              Login
            </Button>
          )}
        </Toolbar>
      </AppBar>
      {isAuthenticated && (
        <Drawer
          variant="permanent"
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            '& .MuiDrawer-paper': { width: drawerWidth, boxSizing: 'border-box' },
          }}
        >
          <Toolbar />
          <List>
            {[
              { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
              { text: 'ลูกค้า', icon: <PeopleIcon />, path: '/customers' },
              { text: 'สินค้า', icon: <InventoryIcon />, path: '/inventory' },
              { text: 'ใบแจ้งหนี้', icon: <ReceiptIcon />, path: '/sales/invoices' },
              { text: 'งานติดตั้ง', icon: <BuildIcon />, path: '/jobs' },
              { text: 'AI Chat', icon: <ChatIcon />, path: '/chat' },
              ...(user?.role === 'ADMIN'
                ? [{ text: 'จัดการผู้ใช้งาน', icon: <AdminPanelSettingsIcon />, path: '/admin/users' }]
                : []),
            ].map((item) => (
              <ListItem key={item.text} disablePadding>
                <ListItemButton
                  selected={location.pathname === item.path}
                  onClick={() => navigate(item.path)}
                >
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.text} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Drawer>
      )}
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
}
