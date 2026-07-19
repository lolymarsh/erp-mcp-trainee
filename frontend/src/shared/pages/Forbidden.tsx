import { Box, Typography, Button } from '@mui/material';
import { Link } from 'react-router-dom';

export function ForbiddenPage() {
  return (
    <Box sx={{ textAlign: 'center', py: 8 }}>
      <Typography variant="h1" color="text.secondary" sx={{ fontWeight: 'bold' }}>403</Typography>
      <Typography variant="h5" sx={{ mb: 2 }}>คุณไม่มีสิทธิ์เข้าถึงหน้านี้</Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        กรุณาติดต่อผู้ดูแลระบบหากคุณคิดว่าควรมีสิทธิ์เข้าถึง
      </Typography>
      <Button variant="contained" component={Link} to="/">
        กลับหน้าแรก
      </Button>
    </Box>
  );
}
