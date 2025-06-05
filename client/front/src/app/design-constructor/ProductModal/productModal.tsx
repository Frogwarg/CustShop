'use client';
import Image from 'next/image';
import "./productModal.css";

export interface Product {
    id: string;
    type: string;
    name: string;
    image: string;
    clipArea?: {
        x: number; // Координата X
        y: number; // Координата Y
        width: number; // Ширина
        height: number; // Высота
    };
}

export const categories = ['Категория 1', 'Категория 2', 'Категория 3']; // Пример категорий
export const products: Product[] = [
    { id: 'shirt', type: '3D', name: 'Майка', image: '/products/shirt-mask.png' },
    { id: 'mug', type: 'regular', name: 'Кружка', image: '/products/mug-mask.png', clipArea: { x: 0.121, y: 0.01, width: 0.759, height: 0.976 } },
    { id: 'pillow', type: 'regular', name: 'Подушка', image: '/products/pillow-mask.png', clipArea: { x: 0.165, y: 0.14, width: 0.7, height: 0.7 } },
    // { id: 'cap', type: 'regular', name: 'Кепка', image: '/products/cap-mask.png', clipArea: { x: 0, y: 0, width: 100, height: 100 } },
    // { id: 'bag', type: 'regular', name: 'Сумка', image: '/products/bag-mask.png', clipArea: { x: 0, y: 0, width: 100, height: 100 } },
    // { id: 'phone_case', type: 'regular', name: 'Чехол для телефона', image: '/products/phone-case-mask.png', clipArea: { x: 0, y: 0, width: 100, height: 100 } },
    // { id: 'hoodie', type: '3D', name: 'Худи', image: '/products/hoodie-mask.png' },
];

const ProductModal = ({ isOpen, onClose, onSelectProduct }: { 
    isOpen: boolean; 
    onClose: () => void; 
    onSelectProduct: (productId: string, productType: string) => void;
}) => {
    if (!isOpen) return null;

    return (
        <div className='constructor__product_modal'>
            <div className='constructor__product_modal-container'>
                <div className="constructor__product_modal-head">
                    <h2 className='constructor__product_modal-title'>Выберите товар</h2>
                    <button className='constructor__product_modal-closeBtn' onClick={onClose}>Закрыть</button>
                </div>
                {/* Список категорий */}
                <div style={{ marginBottom: '20px' }}>
                    {categories.map((category, index) => (
                        <button key={index} style={{ marginRight: '10px' }}>
                            {category}
                        </button>
                    ))}
                </div>
                
                {/* Список товаров */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                    {products.map((product) => (
                        <div key={product.id} style={{ cursor: 'pointer' }} onClick={() => onSelectProduct(product.id, product.type)}>
                            <Image src={product.image} alt={product.name} width={100} height={100} objectFit='cover'/>
                            <p>{product.name}</p>
                        </div>
                    ))}
                </div>
                
            </div>
        </div>
    );
};

export default ProductModal;