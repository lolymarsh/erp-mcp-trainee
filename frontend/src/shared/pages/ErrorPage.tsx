import { Box, Typography, Button } from '@mui/material';
import { Link } from 'react-router-dom';

export function ErrorPage() {
  return (
    <Box sx={{ textAlign: 'center', py: 8 }}>
      <Typography variant="h1" color="text.secondary" sx={{ fontWeight: 'bold' }}>500</Typography>
      <Typography variant="h5" sx={{ mb: 2 }}>เกิดข้อผิดพลาด กรุณาลองใหม่</Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        ระบบเกิดข้อผิดพลาดที่ไม่คาดคิด กรุณาลองอีกครั้งในภายหลัง
      </Typography>
      <Button variant="contained" component={Link} to="/">
        กลับหน้าแรก
      </Button>
    </Box>
  );
}
