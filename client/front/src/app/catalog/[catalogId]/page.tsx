'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';

const ProductPage = () => {
  const params = useParams(); // Получаем динамические параметры
  const catalogId = params?.catalogId as string;
  interface Product {
    id: string;
    designId: string;
    name: string;
    description: string;
    previewUrl: string;
    designData: string;
    productType: string;
    price: number;
    discountedPrice?: number;
    sizes: string[];
    tags: string;
    authorName: string;
    materials: string[];
    additionalInfo?: string;
  }

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const router = useRouter();

  useEffect(() => {
    if (catalogId) {
      const fetchProduct = async () => {
        try {
          const response = await fetch(`/api/catalog/${catalogId}`);
          const data = await response.json();
          console.log('Fetched product:', data);
          setProduct(data);
          setSelectedSize(data.sizes[0] || '');
          setLoading(false);
        } catch (error) {
          console.error('Ошибка при загрузке товара:', error);
          setLoading(false);
        }
      };
      fetchProduct();
    }
  }, [catalogId]);

  const handleAddToCart = async () => {
    try {
      if (!product) {
        alert('Ошибка: Товар не найден.');
        return;
      }
      const response = await fetch('/api/cart/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          design: {
            id: product.id,
            name: product.name,
            description: product.description,
            previewUrl: product.previewUrl,
            designData: product.designData,
            designHash: `${product.id}-${selectedSize}`,
            productType: product.productType
          },
          quantity,
          price: product.discountedPrice || product.price
        })
      });
      if (response.ok) {
        alert('Товар добавлен в корзину!');
      } else {
        alert('Ошибка при добавлении в корзину.');
      }
    } catch (error) {
      console.error('Ошибка:', error);
      alert('Ошибка при добавлении в корзину.');
    }
  };

  const handleOpenConstructor = () => {
    // Перенаправляем в конструктор с catalogId
    if (!product) {
        alert('Ошибка: Товар не найден.');
        return;
    }
    router.push(`/constructor?designId=${product.designId}`);
  };


  if (loading) return <div>Загрузка...</div>;
  if (!product) return <div>Товар не найден.</div>;

  return (
    <div className="container mx-auto p-4">
      <div className="flex flex-col md:flex-row gap-8">
        <div className="md:w-1/2">
          <Image
            width={300}
            height={300}
            src={product.previewUrl}
            alt={product.name}
            className="w-full h-auto rounded-md"
          />
        </div>
        <div className="md:w-1/2">
          <h1 className="text-3xl font-bold mb-4">{product.name}</h1>
          <p className="text-gray-600 mb-4">{product.description}</p>
          <p className="text-lg font-bold mb-4">
            {product.discountedPrice ? (
              <>
                <span className="line-through text-gray-500 mr-2">
                  {product.price} ₽
                </span>
                <span>{product.discountedPrice} ₽</span>
              </>
            ) : (
              `${product.price} ₽`
            )}
          </p>
          <p className="text-gray-500 mb-2">Теги: {product.tags}</p>
          <p className="text-gray-500 mb-2">Автор: {product.authorName}</p>
          <p className="text-gray-500 mb-2">Тип продукта: {product.productType}</p>
          <div className="mb-4">
            <label htmlFor="size" className="block text-sm font-medium">
              Размер
            </label>
            <select
              id="size"
              value={selectedSize}
              onChange={(e) => setSelectedSize(e.target.value)}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
            >
              {product.sizes.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
          <div className="mb-4">
            <label htmlFor="material" className="block text-sm font-medium">
              Материал
            </label>
            <p>{product.materials.join(', ')}</p>
          </div>
          <div className="mb-4">
            <label htmlFor="quantity" className="block text-sm font-medium">
              Количество
            </label>
            <input
              type="number"
              id="quantity"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              min="1"
              className="mt-1 block w-24 border-gray-300 rounded-md shadow-sm"
            />
          </div>
          <p className="text-gray-500 mb-4">{product.additionalInfo}</p>
          <button
            onClick={handleAddToCart}
            className="bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-600"
          >
            Добавить в корзину
          </button>
          <button
              onClick={handleOpenConstructor}
              className="bg-green-500 text-white px-6 py-2 rounded-md hover:bg-green-600"
            >
              Шаблон в конструкторе
            </button>
        </div>
      </div>
    </div>
  );
};

export default ProductPage;