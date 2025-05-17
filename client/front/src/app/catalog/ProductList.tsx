'use client';
import ProductCard from './ProductCard';
import styles from './styles.module.css';

interface ProductListProps {
  products: Array<{
    id: string;
    designId: string;
    name: string;
    description: string;
    price: number;
    previewUrl: string;
    discountedPrice?: number | null;
    productType: string;
    tags: string[];
  }>;
}

const ProductList: React.FC<ProductListProps> = ({ products }) => {
  return (
    <div className={styles.productGrid}>
      {products.map((product) => (
        <ProductCard
          key={product.id}
          id={product.id}
          designId={product.designId}
          name={product.name}
          description={product.description}
          price={product.price}
          previewUrl={product.previewUrl}
          discountedPrice={product.discountedPrice}
          productType={product.productType}
          tags={product.tags}
        />
      ))}
    </div>
  );
};

export default ProductList;