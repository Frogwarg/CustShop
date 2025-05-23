'use client'
import { useState, FormEvent, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import authService from '../services/authService';
import styles from './styles.module.css';

interface ValidationErrors {
  password?: string;
  confirmPassword?: string;
}

function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [serverError, setServerError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  const token = searchParams.get('token') || '';

  useEffect(() => {
    if (!email || !token) {
      setServerError('Недействительная ссылка для сброса пароля.');
    }
  }, [email, token]);

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    if (!password) {
      newErrors.password = 'Пароль обязателен';
    } else if (password.length < 6) {
      newErrors.password = 'Пароль должен быть не менее 6 символов';
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Пароли не совпадают';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrors({});
    setSuccess('');
    setSubmitting(true);

    if (!validateForm()) {
      setSubmitting(false);
      return;
    }

    try {
      await authService.axiosWithRefresh('post', '/auth/reset-password', JSON.stringify({
        email,
        token,
        newPassword: password
      }));
      setSuccess('Пароль успешно изменен. Вы можете войти с новым паролем.');
      setPassword('');
      setConfirmPassword('');
      setTimeout(() => router.push('/login'), 3000);
    } catch (error) {
      console.error('Ошибка:', error);
      setServerError('Произошла ошибка при сбросе пароля. Попробуйте снова или запросите новое письмо.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.formWrapper}>
        <h2 className={styles.title}>Установить новый пароль</h2>
        {serverError && <div className={styles.error}>{serverError}</div>}
        {success && <div className={styles.success}>{success}</div>}
        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.inputGroup}>
            <div className={styles.passwordWrapper}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Новый пароль"
                required
                className={styles.input}
                disabled={submitting}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={styles.togglePassword}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
            {errors.password && <p className={styles.error}>{errors.password}</p>}
          </div>
          <div className={styles.inputGroup}>
            <div className={styles.passwordWrapper}>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Подтвердите пароль"
                required
                className={styles.input}
                disabled={submitting}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className={styles.togglePassword}
              >
                {showConfirmPassword ? '🙈' : '👁️'}
              </button>
            </div>
            {errors.confirmPassword && <p className={styles.error}>{errors.confirmPassword}</p>}
          </div>
          <button
            type="submit"
            disabled={submitting || !email || !token}
            className={styles.submitButton}
          >
            {submitting ? 'Сохранение...' : 'Сохранить новый пароль'}
          </button>
        </form>
        <div className={styles.loginLink}>
          <Link href="/login">Вернуться к входу</Link>
        </div>
      </div>
    </div>
  );
}

export default function ResetPass() {
    return (
        <Suspense fallback={<p>Загрузка...</p>}>
          <ResetPassword />
        </Suspense>
      );
}