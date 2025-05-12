'use client';
import { useState } from 'react';

const Filters = ({ onFilterChange }: {onFilterChange: (filters: { tags: string; productType: string }) => void}) => {
  const [tags, setTags] = useState('');
  const [productType, setProductType] = useState('');

  const productTypes = ['shirt', 'Mug', 'Pillow'];

const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onFilterChange({ tags, productType });
};

  return (
    <form onSubmit={handleSubmit} className="mb-6 flex flex-col md:flex-row gap-4">
      <div className="flex-1">
        <label htmlFor="tags" className="block text-sm font-medium">
          Теги (через запятую)
        </label>
        <input
          type="text"
          id="tags"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
          placeholder="funny, custom"
        />
      </div>
      <div className="flex-1">
        <label htmlFor="productType" className="block text-sm font-medium">
          Тип продукта
        </label>
        <select
          id="productType"
          value={productType}
          onChange={(e) => setProductType(e.target.value)}
          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
        >
          <option value="">Все</option>
          {productTypes.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>
      <button
        type="submit"
        className="mt-6 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
      >
        Применить
      </button>
    </form>
  );
};

export default Filters;