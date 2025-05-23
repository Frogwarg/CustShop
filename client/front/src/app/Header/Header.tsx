'use client'
import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';

import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import authService from '../services/authService';

import "./header.css";

const Header = () => {
    const { isAuthenticated, hasRole, logout } = useAuth();
    const router = useRouter();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };
    const logoutNew = () => {
        logout();
        router.push('/');
        setIsMenuOpen(false);
    }
    const handleProtectedLinkClick = async (href: string) => {
        const isValid = await authService.validateToken();
        if (isValid) {
            router.push(href);
        } else {
            logout();
            router.push('/login');
        }
        setIsMenuOpen(false);
    };
    return (
        <header className="header">
            <div className="header__logo">
                <Link href="/">
                    <Image src="/logo.svg" alt="logo" width={77} height={27} className="header__logo-image"/>
                    <span className="header__logo-text">CustShop</span>
                </Link>
            </div>
            <nav className="header__nav">
                <button className="header__burger" onClick={toggleMenu}>
                    <span className={isMenuOpen ? "header__burger-line header__burger-line--open" : "header__burger-line"}></span>
                    <span className={isMenuOpen ? "header__burger-line header__burger-line--open" : "header__burger-line"}></span>
                    <span className={isMenuOpen ? "header__burger-line header__burger-line--open" : "header__burger-line"}></span>
                </button>
                <div className={isMenuOpen ? "header__modal-menu header__modal-menu--open" : "header__modal-menu"}>
                    <ul className="header__ul header__ul--modal">
                        <li>
                            <Link href="/" className="header__link" onClick={() => setIsMenuOpen(false)}>Главная</Link>
                        </li>
                        <li>
                            <Link href="/constructor" className="header__link" onClick={() => setIsMenuOpen(false)}>Конструктор</Link>
                        </li>
                        <li>
                            <Link href="/catalog" className="header__link" onClick={() => setIsMenuOpen(false)}>Каталог</Link>
                        </li>
                        <li>
                            <Link href="/contacts" className="header__link" onClick={() => setIsMenuOpen(false)}>Контакты</Link>
                        </li>
                        {isAuthenticated ? (
                            <>
                                {hasRole('Admin') && (
                                    <li>
                                        <Link 
                                            href="/admin"
                                            className="header__link"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                handleProtectedLinkClick('/admin');
                                            }}>
                                            Админ панель
                                        </Link>
                                    </li>
                                )}
                                {hasRole('Moderator') && (
                                    <li>
                                        <Link 
                                            href="/moderation"
                                            className="header__link"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                handleProtectedLinkClick('/moderation');
                                            }}>
                                            Модерация
                                        </Link>
                                    </li>
                                )}
                                <li>
                                    <Link 
                                        href="/profile"
                                        className="header__link"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            handleProtectedLinkClick('/profile');
                                        }}>
                                        Профиль
                                    </Link>
                                </li>
                                <li>
                                    <button
                                        onClick={logoutNew}
                                        className="header__link header__logout"
                                    >Выйти
                                    </button>
                                </li>
                            </>
                        ) : (
                            <>
                                <li>
                                    <Link href="/login" className="header__link" onClick={() => setIsMenuOpen(false)}>
                                        Войти
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/register" className="header__link" onClick={() => setIsMenuOpen(false)}>
                                        Регистрация
                                    </Link>
                                </li>
                            </>
                        )}
                        <li>
                            <Link href="/cart" className="header__link" onClick={() => setIsMenuOpen(false)}>
                                Корзина
                            </Link>
                        </li>
                    </ul>
                </div>
                <div className="menu">
                    <ul className="header__ul">
                        <li>
                            <Link href="/" className="header__link">Главная</Link>
                        </li>
                        <li>
                            <Link href="/constructor" className="header__link">Конструктор</Link>
                        </li>
                        <li>
                            <Link href="/catalog" className="header__link">Каталог</Link>
                        </li>
                        <li>
                            <Link href="/contacts" className="header__link">Контакты</Link>
                        </li>
                        {isAuthenticated ? (
                            <>
                                {hasRole('Admin') && (
                                    <li>
                                        <Link 
                                            href="/admin"
                                            className="header__link"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                handleProtectedLinkClick('/admin');
                                            }}>
                                            Админ панель
                                        </Link>
                                    </li>
                                )}
                                {hasRole('Moderator') && (
                                    <li>
                                        <Link 
                                            href="/moderation"
                                            className="header__link"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                handleProtectedLinkClick('/moderation');
                                            }}>
                                            Модерация
                                        </Link>
                                    </li>
                                )}
                                <li>
                                    <Link 
                                        href="/profile"
                                        className="header__link"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            handleProtectedLinkClick('/profile');
                                        }}>
                                        Профиль
                                    </Link>
                                </li>
                                <li>
                                    <button
                                        onClick={logoutNew}
                                        className="header__link header__logout"
                                    >Выйти
                                    </button>
                                </li>
                            </>
                        ) : (
                            <>
                                <li>
                                    <Link href="/login" className="header__link">
                                        Войти
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/register" className="header__link">
                                        Регистрация
                                    </Link>
                                </li>
                            </>
                        )}
                        <li>
                            <Link href="/cart" className="header__link">
                                Корзина
                            </Link>
                        </li>
                    </ul>
                </div>
            </nav>
        </header>
    );
};

export default Header;