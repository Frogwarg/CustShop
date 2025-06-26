'use client';
import { useState, useEffect } from 'react';
import ProductList from './ProductList';
import Pagination from './Pagination';
import Filters from './Filters';
import useDebounce from '../utils/useDebounce';
import styles from './styles.module.css';

const CatalogPage = () => {
  const [catalog, setCatalog] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(9);
  const [filters, setFilters] = useState({
    search: '',
    productType: ''
  });
  const [tags, setTags] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const debouncedSearch = useDebounce(filters.search, 500);

  const fetchTags = async () => {
    try {
      const response = await fetch('/api/catalog/tags');
      const data = await response.json();
      const sortedTags = (data.tags || []).sort((a: string, b: string) =>
        a.toLowerCase().localeCompare(b.toLowerCase())
      );
      setTags(sortedTags);
    } catch (error) {
      console.error('Ошибка при загрузке тегов:', error);
    }
  };

  const fetchCatalog = async () => {
    try {
      const query = new URLSearchParams({
        page: currentPage.toString(),
        pageSize: pageSize.toString(),
        ...(selectedTags.length > 0 && { tags: selectedTags.join(',') }),
        ...(filters.productType && { productType: filters.productType }),
        ...(debouncedSearch && { search: debouncedSearch })
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
    fetchTags();
  }, []);

  useEffect(() => {
    fetchCatalog();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, selectedTags, filters.productType, debouncedSearch]);

  interface FiltersType {
    search: string;
    productType: string;
  }

  const handleFilterChange = (newFilters: FiltersType): void => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const handleTagChange = (tag: string, checked: boolean) => {
    setSelectedTags(prev =>
      checked ? [...prev, tag] : prev.filter(t => t !== tag)
    );
    setCurrentPage(1);
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.heading}>Каталог</h1>
      <Filters onFilterChange={handleFilterChange} />
      <div className={styles.content}>
        <div className={styles.sidebar}>
          <h2 className={styles.gridTitle}>Теги</h2>
          <div className={styles.tagList}>
            {tags.map(tag => (
              <label key={tag} className={styles.tagItem}>
                <input
                  type="checkbox"
                  className={styles.checkbox}
                  checked={selectedTags.includes(tag)}
                  onChange={e => handleTagChange(tag, e.target.checked)}
                />
                {tag}
              </label>
            ))}
          </div>
        </div>
        <div className={styles.productList}>
          <ProductList products={catalog} />
          {catalog.length === 0 && (
            <div className={styles.noProducts}>
              <p>Товары не найдены</p>
            </div>
          )}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>
    </div>
  );
};

export default CatalogPage;