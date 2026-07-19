import { Box, Typography, Button } from '@mui/material';
import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <Box sx={{ textAlign: 'center', py: 8 }}>
      <Typography variant="h1" color="text.secondary" sx={{ fontWeight: 'bold' }}>404</Typography>
      <Typography variant="h5" sx={{ mb: 2 }}>ไม่พบหน้าที่คุณต้องการ</Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        หน้าที่คุณกำลังมองหาอาจถูกลบหรือไม่มีอยู่ในระบบ
      </Typography>
      <Button variant="contained" component={Link} to="/">
        กลับหน้าแรก
      </Button>
    </Box>
  );
}
