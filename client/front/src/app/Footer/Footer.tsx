import Link from "next/link";
import "./footer.css";

const Footer = () => {
  return (
    <footer>
        <div className="footer__container">
            <div className="footer__column">
                <ul className="footer__ul">
                    <li>
                        <Link href="/">Главная</Link>
                    </li>
                    <li>
                        <Link href="/constructor">Конструктор</Link>
                    </li>
                    <li>
                        <Link href="/catalog">Каталог</Link>
                    </li>
                    <li>
                        <Link href="/contacts">Контакты</Link>
                    </li>
                </ul>
            </div>
            <div className="column">
                <ul className="footer__ul">
                    <li>
                        <span>*Адрес*</span>
                    </li>
                    <li>
                        <span>*продолжение адреса*</span>
                    </li>
                    <li>
                        <span> E-mail: <Link type="e-mail" href="mailto:andronatii@outlook.com">andronatii@outlook.com</Link></span>
                    </li>
                    <li>
                        <span> Tel: <Link href="trl:+37377564312">+373 (775) 6-43-12</Link></span>
                    </li>
                </ul>
            </div>
        </div>
    </footer>
  );
};

export default Footer;