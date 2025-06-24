import styles from './styles.module.css';

export default function About() {
  return (
    <section className={styles.wrapper}>
      <div className={styles.content}>
        <h2 className={styles.aboutTitle}>О платформе</h2>
        <p className={styles.aboutText}>
          Мы создали этот сервис для тех, кто хочет больше, чем просто купить товар.  
          Здесь вы можете создать свой уникальный дизайн, не обладая специальными навыками.  
          Визуальный редактор, каталог и управление заказами — всё под рукой, в одном месте.  
          Просто, прозрачно, понятно.
        </p>
      </div>
    </section>
  );
}