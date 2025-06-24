'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import DesignModeration from './DesignModeration';
import OrderModeration from './OrderModeration';
import styles from './styles.module.css';

const ModerationPage = () => {
  const { hasRole } = useAuth();
  const [activeTab, setActiveTab] = useState<'designs' | 'orders'>('designs');
  const [isModerator, setIsModerator] = useState<boolean | null>(null);

  useEffect(() => {
    const checkModerator = async () => {
      const moderator = hasRole('Moderator');
      setIsModerator(moderator);
    };
    checkModerator();
  }, [hasRole]);

  if (isModerator === null) return <p className={styles.loading}>Загрузка...</p>;
  if (!isModerator) return <p className={styles.error}>Доступ запрещён.</p>;

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Модерация</h1>
      <div className={styles.tabs}>
        <button
          onClick={() => setActiveTab('designs')}
          className={activeTab === 'designs' ? styles.activeTab : ''}
        >
          Дизайны
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={activeTab === 'orders' ? styles.activeTab : ''}
        >
          Заказы
        </button>
      </div>
      {activeTab === 'designs' && <DesignModeration />}
      {activeTab === 'orders' && <OrderModeration />}
    </div>
  );
};

export default ModerationPage;