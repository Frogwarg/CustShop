'use client'
import Link from 'next/link';
import Image from 'next/image';

import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/navigation';

import "./header.css";

const Header = () => {
    const { isAuthenticated, hasRole, logout } = useAuth();
    const router = useRouter();
    const logoutNew = () => {
        logout();
        router.push('/');
    }
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
                        {isAuthenticated ? (
                            <>
                            {/* Показываем кнопку админки только админам */}
                            {hasRole('Admin') && (
                                <Link href="/adminpanel">
                                <span className="hover:text-gray-300">Админ панель</span>
                                </Link>
                            )}
                            <button
                                onClick={logoutNew}
                                className="hover:text-gray-300"
                            >
                                Выйти
                            </button>
                            </>
                        ) : (
                            <>
                            <Link href="/login">
                                <span className="hover:text-gray-300">Войти</span>
                            </Link>
                            <Link href="/register">
                                <span className="hover:text-gray-300">Регистрация</span>
                            </Link>
                            </>
                        )}
                        <li>
                            <Link href="/cart">
                                <span className="hover:text-gray-300">Корзина</span>
                            </Link>
                        </li>
                    </ul>
                </div>
            </nav>
        </header>
    );
};

export default Header;