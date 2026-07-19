import { Box, Typography, Button } from '@mui/material';
import { Link } from 'react-router-dom';

export function NetworkErrorPage() {
  return (
    <Box sx={{ textAlign: 'center', py: 8 }}>
      <Typography variant="h1" color="text.secondary" sx={{ fontWeight: 'bold' }}>เชื่อมต่อไม่ได้</Typography>
      <Typography variant="h5" sx={{ mb: 2 }}>ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้</Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ตของคุณและลองอีกครั้ง
      </Typography>
      <Button variant="contained" component={Link} to="/">
        กลับหน้าแรก
      </Button>
    </Box>
  );
}
