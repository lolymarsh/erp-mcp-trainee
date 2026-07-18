import React from 'react';
import { Typography, Box } from '@mui/material';

export function DashboardPage(): React.ReactElement {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      <Typography variant="body1" color="text.secondary">
        ยินดีต้อนรับสู่ Versus ERP
      </Typography>
    </Box>
  );
}
