import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/button';

export function NetworkErrorPage() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <h1 className="text-4xl font-bold tracking-tight text-neutral-400 dark:text-neutral-600 mb-2">
        เชื่อมต่อไม่ได้
      </h1>
      <h2 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-50 mb-2">
        ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้
      </h2>
      <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6 max-w-md">
        กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ตของคุณและลองอีกครั้ง
      </p>
      <Button asChild>
        <Link to="/">กลับหน้าแรก</Link>
      </Button>
    </div>
  );
}
