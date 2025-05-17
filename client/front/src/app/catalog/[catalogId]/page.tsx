'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import Image from 'next/image';
import styles from './styles.module.css';

const ProductPage = () => {
  const params = useParams();
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
        toast.error('Ошибка: Товар не найден.');
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
        toast.success('Товар добавлен в корзину!');
      } else {
        toast.error('Ошибка при добавлении в корзину.');
      }
    } catch (error) {
      console.error('Ошибка:', error);
      toast.error('Ошибка при добавлении в корзину.');
    }
  };

  const handleOpenConstructor = () => {
    if (!product) {
      alert('Ошибка: Товар не найден.');
      return;
    }
    router.push(`/constructor?designId=${product.designId}`);
  };

  if (loading) return <div className={styles.loading}>Загрузка...</div>;
  if (!product) return <div className={styles.error}>Товар не найден.</div>;

  return (
    <div className={styles.container}>
      <div className={styles.productWrapper}>
        <div className={styles.imageContainer}>
          <Image
            width={400}
            height={400}
            src={product.previewUrl}
            alt={product.name}
            className={styles.productImage}
          />
        </div>
        <div className={styles.detailsContainer}>
          <h1 className={styles.productTitle}>{product.name}</h1>
          <p className={styles.productDescription}>{product.description}</p>
          <div className={styles.priceContainer}>
            {product.discountedPrice ? (
              <>
                <span className={styles.originalPrice}>{product.price} ₽</span>
                <span className={styles.discountedPrice}>{product.discountedPrice} ₽</span>
              </>
            ) : (
              <span className={styles.price}>{product.price} ₽</span>
            )}
          </div>
          <p className={styles.productInfo}>Теги: {product.tags}</p>
          <p className={styles.productInfo}>Автор: {product.authorName}</p>
          <p className={styles.productInfo}>Тип продукта: {product.productType}</p>
          <div className={styles.inputGroup}>
            <label htmlFor="size" className={styles.label}>Размер</label>
            <select
              id="size"
              value={selectedSize}
              onChange={(e) => setSelectedSize(e.target.value)}
              className={styles.select}
            >
              {product.sizes.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.inputGroup}>
            <label htmlFor="material" className={styles.label}>Материал</label>
            <p className={styles.material}>{product.materials.join(', ')}</p>
          </div>
          <div className={styles.inputGroup}>
            <label htmlFor="quantity" className={styles.label}>Количество</label>
            <input
              type="number"
              id="quantity"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              min="1"
              className={styles.input}
            />
          </div>
          {product.additionalInfo && (
            <p className={styles.additionalInfo}>{product.additionalInfo}</p>
          )}
          <div className={styles.buttonGroup}>
            <button
              onClick={handleAddToCart}
              className={styles.addToCartButton}
            >
              Добавить в корзину
            </button>
            <button
              onClick={handleOpenConstructor}
              className={styles.constructorButton}
            >
              Шаблон в конструкторе
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductPage;