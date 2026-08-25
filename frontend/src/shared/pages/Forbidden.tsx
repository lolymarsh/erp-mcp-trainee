import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/button';

export function ForbiddenPage() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <h1 className="text-6xl font-bold tracking-tight text-neutral-400 dark:text-neutral-600 mb-2">
        403
      </h1>
      <h2 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-50 mb-2">
        คุณไม่มีสิทธิ์เข้าถึงหน้านี้
      </h2>
      <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6 max-w-md">
        กรุณาติดต่อผู้ดูแลระบบหากคุณคิดว่าควรมีสิทธิ์เข้าถึง
      </p>
      <Button asChild>
        <Link to="/">กลับหน้าแรก</Link>
      </Button>
    </div>
  );
}
