'use client';
import { useState, useEffect } from 'react';
import ProductList from './ProductList';
import Pagination from './Pagination';
import Filters from './Filters';

const CatalogPage = () => {
  const [catalog, setCatalog] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [filters, setFilters] = useState({
    tags: '',
    productType: ''
  });

  const fetchCatalog = async () => {
    try {
      const query = new URLSearchParams({
        page: currentPage.toString(),
        pageSize: pageSize.toString(),
        ...(filters.tags && { tags: filters.tags }),
        ...(filters.productType && { productType: filters.productType })
      }).toString();

      const response = await fetch(`/api/catalog?${query}`);
      const data = await response.json();
      setCatalog(data.items);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error('Ошибка при загрузке каталога:', error);
    }
  };

  useEffect(() => {
    fetchCatalog();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, filters]);
  interface FiltersType {
    tags: string;
    productType: string;
  }

  const handleFilterChange = (newFilters: FiltersType): void => {
    setFilters(newFilters);
    setCurrentPage(1); // Сбрасываем на первую страницу при изменении фильтров
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Каталог</h1>
      <Filters onFilterChange={handleFilterChange} />
      <ProductList products={catalog} />
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
    </div>
  );
};

export default CatalogPage;