'use client';
import { useState } from 'react';
import styles from './styles.module.css';

const Filters = ({ onFilterChange }: { onFilterChange: (filters: { search: string; productType: string }) => void }) => {
  const [search, setSearch] = useState('');
  const [productType, setProductType] = useState('');
  const productTypes = [
    { value: 'shirt', label: 'Футболка' },
    { value: 'Mug', label: 'Кружка' },
    { value: 'Pillow', label: 'Подушка' },
  ];

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onFilterChange({ search, productType });
  };

  return (
    <form onSubmit={handleSubmit} className={styles.topPanel}>
      <div className={styles.formField}>
        <label htmlFor="search" className={styles.label}>Поиск по названию</label>
        <input
          type="text"
          id="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Введите название"
          className={styles.input}
        />
      </div>
      <div className={styles.formField}>
        <label htmlFor="productType" className={styles.label}>Тип продукта</label>
        <select
          id="productType"
          value={productType}
          onChange={(e) => setProductType(e.target.value)}
          className={styles.select}
        >
          <option value="">Все</option>
          {productTypes.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
      <button type="submit" className={styles.submitButton}>Применить</button>
    </form>
  );
};

export default Filters;