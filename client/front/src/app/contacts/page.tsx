'use client'
import { useState } from 'react';
import { toast } from 'sonner';
import authService from '../services/authService';
import styles from './styles.module.css';
import Image from 'next/image';
import Link from 'next/link';

interface FormData {
  name: string;
  email: string;
  message: string;
}

const ContactPage = () => {
  const [formData, setFormData] = useState<FormData>({ name: '', email: '', message: '' });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await authService.axiosWithRefresh('post', '/contact', JSON.stringify(formData));
      toast.success('Сообщение успешно отправлено!');
      setFormData({ name: '', email: '', message: '' });
    } catch (error) {
      console.error('Ошибка:', error);
      toast.error('Ошибка при отправке сообщения. Попробуйте позже.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Свяжитесь с нами</h1>
      <p className={styles.description}>
        Мы всегда рады ответить на ваши вопросы! Заполните форму ниже или используйте наши контакты.
      </p>
      <div className={styles.content}>
        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label htmlFor="name" className={styles.label}>Имя</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Ваше имя"
              required
              className={styles.input}
              disabled={submitting}
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="email" className={styles.label}>Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Ваш email"
              required
              className={styles.input}
              disabled={submitting}
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="message" className={styles.label}>Сообщение</label>
            <textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleChange}
              placeholder="Ваше сообщение"
              required
              className={styles.textarea}
              disabled={submitting}
            />
          </div>
          <button type="submit" className={styles.submitButton} disabled={submitting}>
            {submitting ? 'Отправка...' : 'Отправить'}
          </button>
        </form>
        <div className={styles.contactInfo}>
          <h2 className={styles.contactTitle}>Наши контакты</h2>
          <ul className={styles.contactList}>
            <li className={styles.contactItem}>
              <Image src="/icons/email.svg" alt="Email" width={24} height={24} />
              <a href="mailto:andronatii11@gmail.com" className={styles.contactLink}>andronatii11@gmail.com</a>
            </li>
            <li className={styles.contactItem}>
              <Image src="/icons/phone.svg" alt="Phone" width={24} height={24} />
              <a href="tel:+37377564312" className={styles.contactLink}>+373 (775) 6-43-12</a>
            </li>
            <li className={styles.contactItem}>
              <Image src="/icons/address.svg" alt="Address" width={24} height={24} />
              <span>ул. Примерная, 123, Город, Страна</span>
            </li>
          </ul>
          <div className={styles.socialLinks}>
            <Link href="https://vk.com/frogwarg" className={styles.socialLink}>
              <Image src="/icons/vk.svg" alt="VK" width={32} height={32} />
            </Link>
            <Link href="https://t.me/frogwarg" className={styles.socialLink}>
              <Image src="/icons/telegram.svg" alt="Telegram" width={32} height={32} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;