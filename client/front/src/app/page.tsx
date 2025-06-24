import Link from 'next/link';
import Image from 'next/image';
import styles from './main/styles.module.css';
import { Lobster } from 'next/font/google';

const lobster = Lobster({ subsets: ['latin'], weight: '400' });

import Features from './main/features';
import Reviews from './main/reviews';
import FAQ from './main/faq';
// import About from './main/about';

export default function HomePage() {
  return (
    <main className={styles.container}>
      {/* Геройский баннер */}
      <section className={styles.hero}>
        <div className={styles.heroImageWrapper}>
          <Image
            className={styles.heroImage}
            src="/hero-image.jpg"
            alt="Custom Product"
            width={1200}
            height={400}
            priority={true}
          />
          <div className={`${styles.heroOverlayText} ${lobster.className}`} >CustShop</div>
        </div>
        <h1 className={styles.title}>Создайте товар с собственным дизайном</h1>
        <p className={styles.subtitle}>
          Онлайн-магазин, где каждый может стать дизайнером: создавайте, редактируйте, заказывайте — всё в одном месте.
        </p>
        <Link href="/design-constructor" className={styles.primaryButton}>Создать сейчас</Link>
      </section>

      {/* Преимущества */}
      <Features />

      {/* Популярные товары */}
      {/* <section className={styles.popular}>
        <h2>Популярные товары</h2>
        <div className={styles.productGrid}>
          {/* Карточки товаров
        </div>
      </section> */}

      {/* Отзывы */}
      <Reviews />

      {/* О платформе */}
      {/* <About /> */}

      {/* Часто задаваемые вопросы */}
      <FAQ />

      {/* Регистрация */}
      <section className={styles.cta}>
        <h2>Готовы начать?</h2>
        <p>Перейдите в каталог или запустите конструктор — ваш дизайн начинается с одного клика.</p>
        <div className={styles.buttons}>
          <Link href="/catalog"><button className={styles.primaryButton}>Открыть каталог</button></Link>
          <Link href="/design-constructor"><button className={styles.secondaryButton}>Открыть конструктор</button></Link>
        </div>
      </section>
    </main>
  );
}