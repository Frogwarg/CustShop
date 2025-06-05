'use client';
import React, { useState, useEffect } from 'react';
import styles from './styles.module.css';

const reviews = [
  {
    id: 1,
    name: 'Анна К.',
    text: 'Создать свою футболку было так просто! Конструктор интуитивный, а качество печати превзошло ожидания. Уже заказала вторую!',
  },
  {
    id: 2,
    name: 'Игорь С.',
    text: 'Очень удобный сайт, быстро разобрался с конструктором. Доставка заняла всего 3 дня. Рекомендую всем, кто любит уникальные вещи!',
  },
  {
    id: 3,
    name: 'Екатерина М.',
    text: 'Заказала худи с собственным дизайном для подарка — именинник в восторге! Спасибо за качество и поддержку.',
  },
  {
    id: 4,
    name: 'Дмитрий П.',
    text: 'Отличный сервис! Понравилось, что можно сохранить дизайн и вернуться к нему. Цены адекватные, доставка быстрая.',
  },
  {
    id: 5,
    name: 'Ольга В.',
    text: 'Создание своего дизайна заняло 5 минут, а результат — просто огонь! Теперь хочу попробовать аксессуары.',
  },
  {
    id: 6,
    name: 'Максим Л.',
    text: 'CustShop — находка для тех, кто хочет выделиться. Конструктор удобный, а поддержка отвечает моментально.',
  },
];

export default function Reviews() {
    const [currentIndex, setCurrentIndex] = useState(0);
    
      useEffect(() => {
        const interval = setInterval(() => {
          setCurrentIndex((prev) => (prev + 1) % reviews.length);
        }, 5000);
        return () => clearInterval(interval);
      }, []);
    
      const getVisibleReviews = () => {
        const visible = [];
        for (let i = 0; i < 3; i++) {
          visible.push(reviews[(currentIndex + i) % reviews.length]);
        }
        return visible;
      };
    return (
        <section className={styles.reviewsSection}>
          <h2 className={styles.reviewsTitle}>Что говорят наши клиенты</h2>
          <div className={styles.reviewsSlider}>
            {getVisibleReviews().map((review) => (
              <div key={review.id} className={styles.reviewCard}>
                <p className={styles.reviewText}>{review.text}</p>
                <div className={styles.reviewAuthor}>
                  <span className={styles.reviewName}>{review.name}</span>
                </div>
              </div>
            ))}
          </div>
      </section>
    )
}