'use client'
import { useState, useEffect } from 'react';
// import Link from 'next/link';
import styles from './styles.module.css';

export default function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Проверяем, есть ли в localStorage ключ 'cookieConsent'
    const consent = localStorage.getItem('cookieConsent');
    if (!consent) {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    // Сохраняем согласие в localStorage и скрываем уведомление
    localStorage.setItem('cookieConsent', 'accepted');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  // . Продолжая использовать сайт, вы соглашаетесь с нашей <Link href="/privacy-policy" className={styles.link}>политикой конфиденциальности</Link>.
  return (
    <div className={styles.cookieBanner}>
      <div className={styles.content}>
        <p>
          Мы используем cookies для улучшения работы сайта и персонализации
        </p>
        <button onClick={handleAccept} className={styles.acceptButton}>
          Окей
        </button>
      </div>
    </div>
  );
}