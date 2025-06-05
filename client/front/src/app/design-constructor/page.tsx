import { Suspense } from 'react';
import ClientConstructor from './ClientConstructor';
import styles from './constructor.module.css';

export const metadata = {
  title: 'Design Constructor',
  description: 'Create your custom design',
};

export default function DesignProduct() {
  return (
    <Suspense fallback={<div className={styles.loading}>Загрузка...</div>}>
      <ClientConstructor />
    </Suspense>
  );
}

export const dynamic = 'force-dynamic';