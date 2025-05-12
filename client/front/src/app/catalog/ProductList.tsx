import Image from 'next/image';
import Link from 'next/link';
interface Product {
    id: string;
    name: string;
    description: string;
    price: number;
    discountedPrice?: number;
    previewUrl: string;
    tags?: string;
    productType: string;
}

const ProductList: React.FC<{ products: Product[] }> = ({ products }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {products.map((product) => (
        <Link href={`/catalog/${product.id}`} key={product.id}>
          <div className="border rounded-lg p-4 hover:shadow-lg transition">
            <Image
              width={300}
              height={300}
              src={product.previewUrl}
              alt={product.name}
              className="w-full h-48 object-cover rounded-md mb-4"
            />
            <h2 className="text-lg font-semibold">{product.name}</h2>
            <p className="text-gray-600">{product.productType}</p>
            <p className="text-gray-500 text-sm">{product.tags}</p>
            <p className="text-lg font-bold">
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
          </div>
        </Link>
      ))}
    </div>
  );
};

export default ProductList;