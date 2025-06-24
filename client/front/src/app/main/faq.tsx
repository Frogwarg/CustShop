'use client';
import styles from './styles.module.css';
import { SetStateAction, useState } from 'react';

const data = [
  { q: 'Нужно ли регистрироваться для создания дизайна?', a: 'Нет, потому что основные функции магазина, такие как каталог, конструктор, корзина и оформление заказа не требуют авторизации пользователя. Однако регистрация позволяет сохранять дизайны, заказы и управлять адресами.', icon: '👤' },
  { q: 'Могу ли я изменить заказ после оформления?', a: 'Вы можете связаться с модератором через контактную форму — мы постараемся помочь.', icon: '📦' },
  { q: 'Мой дизайн будет виден другим?', a: 'Нет, пока вы сами не решите опубликовать его для каталога.', icon: '👁️' },
  { q: 'Сколько времени сохраняются мои дизайны?', a: 'Сохранённые дизайны хранятся неограниченное время в вашем профиле.', icon: '💾' },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (index: SetStateAction<number | null>) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className={styles.wrapper}>
      <h2 className={styles.FAQtitle}>Часто задаваемые вопросы</h2>
      <div className={styles.faq}>
        {data.map((item, index) => {
          const isOpen = openIndex === index;

          return (
            <div key={index} className={styles.item}>
              <button
                className={styles.question}
                onClick={() => toggle(index)}
                aria-expanded={isOpen}
              >
                <span className={styles.iconLeft}>{item.icon}</span>
                <span className={styles.questionText}>{item.q}</span>
                <span className={`${styles.iconRight} ${isOpen ? styles.iconOpen : ''}`}>▼</span>
              </button>

              <div
                className={`${styles.answerWrapper} ${isOpen ? styles.answerOpen : ''}`}
              >
                <div className={styles.answerInner}>{item.a}</div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}