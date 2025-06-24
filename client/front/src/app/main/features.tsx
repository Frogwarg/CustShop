import styles from './styles.module.css';
import Image from 'next/image';

export default function Features() {
    const features = [
        {
            icon: "/icon-custom.svg",
            title: "Интуитивный конструктор",
            text: "Добавляйте изображения, текст, применяйте фильтры, настраивайте внешний вид товара прямо в браузере.",
        },
        {
            icon: "/icon-delivery.svg",
            title: "Быстрая доставка",
            text: "Мы доставим ваш заказ в кратчайшие сроки",
        },
        {
            icon: "/icon-catalog.svg",
            title: "Каталог готовых дизайнов",
            text: "Просматривайте созданные дизайны других пользователей и делитесь своими — через модерацию они попадают в каталог.",
        },
        {
            icon: "/icon-gear.svg",
            title: "Управление заказами и профилем",
            text: "Храните историю дизайнов и заказов, добавляйте адреса, следите за статусом оформления.",
        },
    ];
    return (
        <section className={styles.features}>
            {features.map((item, index) => (
            <div key={index} className={styles.card}>
                <div className={styles.cardInner}>
                    <div className={styles.cardFront}>
                        <Image src={item.icon} alt={item.title} width={50} height={50} />
                        <h3>{item.title}</h3>
                    </div>
                    <div className={styles.cardBack}>
                        <p>{item.text}</p>
                    </div>
                </div>
            </div>
            ))}
        </section>
    )
}