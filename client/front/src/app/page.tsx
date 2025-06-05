import Link from 'next/link';
import Image from 'next/image';
import Reviews from './main/reviews';
import styles from './main/styles.module.css';

export default function HomePage() {
  return (
    <main>
      {/* Геройский баннер */}
      <section className={styles.hero}>
        {/* <Image src="/hero-image.jpg" alt="Custom Product" width={1200} height={400} /> */}
        <h1>Создай свой стиль с CustShop!</h1>
        <p>Используй наш конструктор для создания уникальных вещей</p>
        <Link href="/design-constructor" className={styles.btnPrimary}>Создать сейчас</Link>
      </section>

      {/* Преимущества */}
      <section className={styles.features}>
        <div className={styles.feature}>
          <Image src="/icon-custom.svg" alt="Custom" width={50} height={50} />
          <h3>Индивидуальный дизайн</h3>
          <p>Создайте уникальный продукт с помощью нашего конструктора</p>
        </div>
        <div className={styles.feature}>
          <Image src="/icon-delivery.svg" alt="Delivery" width={50} height={50} />
          <h3>Быстрая доставка</h3>
          <p>Мы доставим ваш заказ в кратчайшие сроки</p>
        </div>
      </section>

      {/* Популярные товары */}
      {/* <section className={styles.popular}>
        <h2>Популярные товары</h2>
        <div className={styles.productGrid}>
          {/* Карточки товаров
        </div>
      </section> */}

      {/* Конструктор */}
      {/* <section className={styles.constructorSection}>
        <h2>Создай свой уникальный товар</h2>
        <Link href="/design-constructor" className={styles.btnPrimary}>Попробовать сейчас</Link>
      </section> */}

      {/* Отзывы */}
      <Reviews />

      {/* Регистрация */}
      <section className={styles.signup}>
        <h2>Присоединяйся к CustShop</h2>
        <Link href="/register" className={styles.btnPrimary}>Создать аккаунт</Link>
      </section>
    </main>
  );
}