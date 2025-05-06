"use client";

import { useEffect, useState } from "react";
import authService from "./../services/authService";
import Image from 'next/image';

interface Product {
    id: string;
    name: string;
    description: string;
    price: number;
    discountedPrice?: number;
    previewUrl: string;
    tags?: string;
}

const ProductList = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTag, setSelectedTag] = useState("");

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const data = await authService.axiosWithRefresh<Product[]>('get', '/Catalog');
                setProducts(data);
            } catch (error) {
                console.error("Ошибка:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();
    }, []);

    const filteredProducts = selectedTag
        ? products.filter((p) => p.tags?.split(",").includes(selectedTag))
        : products;

    if (loading) return <p>Загрузка...</p>;
    if (filteredProducts.length === 0) return <p>Товаров нет.</p>;

    return (
        <div>
            <h1>Каталог</h1>
            <select onChange={(e) => setSelectedTag(e.target.value)}>
                <option value="">Все теги</option>
                {Array.from(new Set(products.flatMap((p) => p.tags?.split(",")))).map((tag) => (
                    <option key={tag} value={tag}>{tag}</option>
                ))}
            </select>
            {filteredProducts.map((product) => (
                <div key={product.id} style={{ border: "1px solid #ccc", margin: "10px", padding: "10px" }}>
                    <h2>{product.name}</h2>
                    <p>{product.description}</p>
                    <p>Цена: ${product.discountedPrice || product.price}</p>
                    <div style={{ position: 'relative', width: '200px', height: '200px' }}>
                        <Image 
                            src={product.previewUrl} 
                            alt={product.name} 
                            fill
                            style={{ objectFit: 'contain' }}
                        />
                    </div>
                    <button onClick={() => alert(`Добавить ${product.name} в корзину`)}>В корзину</button>
                </div>
            ))}
        </div>
    );
};

export default ProductList;