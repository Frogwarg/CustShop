import Link from 'next/link';
import Image from 'next/image';
import "./header.css";

const Header = () => {
  return (
    <header>
        <div className="header__logo">
            <Link href="/">
                <Image src="/logo.svg" alt="logo" width={77} height={27}/>
                <span>CustShop</span>
            </Link>
        </div>
            <nav>
                <div className="menu">
                    <ul className='header__ul'>
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
                        {/* <li>*/}
                            {/* вход в аккаунт */}
                        {/*</li>*/}
                        {/*<li>*/}
                            {/* корзина */}
                        {/*</li> */}
                    </ul>
                </div>
            </nav>
        </header>
  );
};

export default Header;