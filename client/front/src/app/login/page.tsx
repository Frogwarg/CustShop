'use client'
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import Link from 'next/link';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      router.push('/'); // Редирект на главную после успешного входа
    } catch {
      setError('Неверный email или пароль');
    } 
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-md w-full space-y-8">
        <h2 className="text-center text-3xl font-bold">Вход в систему</h2>
        {error && <div className="text-red-500 text-center">{error}</div>}
        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              required
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Пароль"
              required
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
          <div>
            <button
              type="submit"
              className="w-full py-2 px-4 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              Войти
            </button>
          </div>
          <div className="text-center mt-4">
          <Link href="/register" className="text-blue-600 hover:text-blue-500">
            Нет аккаунта? Зарегистрируйтесь
          </Link>
        </div>
        </form>
      </div>
    </div>
  );
}