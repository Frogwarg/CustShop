import Image from 'next/image';
import "@/app/constructor/productModal.css";

const ProductModal = ({ isOpen, onClose, onSelectProduct }: { 
    isOpen: boolean; 
    onClose: () => void; 
    onSelectProduct: (product: string, type: string) => void;
}) => {
    if (!isOpen) return null;

    const categories = ['Категория 1', 'Категория 2', 'Категория 3']; // Пример категорий
    const products = [
        { id: 'shirt', type: '3D', name: 'Майка', image: '/products/shirt-mask.png' },
        { id: 'mug', type: 'regular', name: 'Кружка', image: '/products/mug-mask.png' },
        { id: 'pillow', type: 'regular', name: 'Подушка', image: '/products/pillow-mask.png' },
    ];

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