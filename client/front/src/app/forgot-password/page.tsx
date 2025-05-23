'use client'
import { useState, FormEvent } from 'react';
import Link from 'next/link';
import authService from '../services/authService';
import styles from './styles.module.css';
import axios from 'axios';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const validateEmail = (email: string): boolean => {
    return /\S+@\S+\.\S+/.test(email);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateEmail(email)) {
      setError('Введите корректный email');
      return;
    }

    setSubmitting(true);
    try {
      await authService.axiosWithRefresh('post', '/auth/forgot-password', JSON.stringify({ email }));
      setSuccess('Письмо с инструкцией по сбросу пароля отправлено на ваш email.');
      setEmail('');
    } catch (error){
      console.error('Ошибка:', error);
      let errorMessage = 'Произошла ошибка. Убедитесь, что email корректен, или попробуйте позже.';
      if (axios.isAxiosError(error) && error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.formWrapper}>
        <h2 className={styles.title}>Сброс пароля</h2>
        {error && <div className={styles.error}>{error}</div>}
        {success && <div className={styles.success}>{success}</div>}
        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.inputGroup}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Введите ваш email"
              required
              className={styles.input}
              disabled={submitting}
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className={styles.submitButton}
          >
            {submitting ? 'Отправка...' : 'Отправить письмо'}
          </button>
        </form>
        <div className={styles.loginLink}>
          <Link href="/login">Вернуться к входу</Link>
        </div>
      </div>
    </div>
  );
}