'use client';
import Image from 'next/image';
import Link from 'next/link';
import styles from './styles.module.css';

interface ProductCardProps {
  id: string;
  designId: string;
  name: string;
  description: string;
  price: number;
  previewUrl: string;
  discountedPrice?: number | null;
  productType: string;
  tags: string[];
}

const productTypes = [
    { value: 'shirt', label: 'Футболка' },
    { value: 'Mug', label: 'Кружка' },
    { value: 'Pillow', label: 'Подушка' },
  ];

const ProductCard: React.FC<ProductCardProps> = ({
  id,
  name,
  description,
  price,
  previewUrl,
  discountedPrice,
  productType,
  tags,
}) => {
  return (
    <Link href={`/catalog/${id}`} className={styles.productCard}>
      <Image
        src={previewUrl}
        alt={name}
        width={200}
        height={200}
        className={styles.productImage}
      />
      <h3 className={styles.productTitle}>{name}</h3>
      <p className={styles.productDescription}>{description}</p>
      <p className={styles.productType}>Продукт: {productTypes.find((type) => type.value.toLowerCase() === productType.toLowerCase())?.label || productType}</p>
      <div className={styles.tagsContainer}>
        {tags.map((tag) => (
          <span key={tag} className={styles.tag}>{tag}</span>
        ))}
      </div>
      <div className={styles.priceContainer}>
        {discountedPrice ? (
          <>
            <span className={styles.discountedPrice}>{discountedPrice} ₽</span>
            <span className={styles.originalPrice}>{price} ₽</span>
          </>
        ) : (
          <span className={styles.price}>Цена: {price} ₽</span>
        )}
      </div>
    </Link>
  );
};

export default ProductCard;