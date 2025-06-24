import Link from "next/link";
import "./footer.css";

const Footer = () => {
  return (
    <footer className="footer">
        <div className="footer__container">
            <div className="footer__column">
                <h3 className="footer__title">Навигация</h3>
                <ul className="footer__ul">
                    <li>
                        <Link href="/" className="footer__link">Главная</Link>
                    </li>
                    <li>
                        <Link href="/design-constructor" className="footer__link">Конструктор</Link>
                    </li>
                    <li>
                        <Link href="/catalog" className="footer__link">Каталог</Link>
                    </li>
                    <li>
                        <Link href="/contacts" className="footer__link">Контакты</Link>
                    </li>
                </ul>
            </div>
            <div className="footer__column">
                <h3 className="footer__title">Контакты</h3>
                <ul className="footer__ul">
                    <li>
                        <span className="footer__text">ул. Ларионова, д. 123</span>
                    </li>
                    <li>
                        <span className="footer__text">г. Тирасполь, 3300</span>
                    </li>
                    <li>
                        <span className="footer__text">
                            E-mail: <Link href="mailto:andronatii@outlook.com" className="footer__link">andronatii@outlook.com</Link>
                        </span>
                    </li>
                    <li>
                        <span className="footer__text">
                            Tel: <Link href="tel:+37377564312" className="footer__link">+373 (775) 6-43-12</Link>
                        </span>
                    </li>
                </ul>
            </div>
        </div>
    </footer>
  );
};

export default Footer;