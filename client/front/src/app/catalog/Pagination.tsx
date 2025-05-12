import React from 'react';

const Pagination = ({ currentPage, totalPages, onPageChange }: {currentPage:number, totalPages: number, onPageChange: (page: number) => void}) => {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className="flex justify-center mt-6">
      <nav className="inline-flex rounded-md shadow">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-2 border rounded-l-md bg-white disabled:opacity-50"
        >
          Назад
        </button>
        {pages.map((page) => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`px-3 py-2 border ${page === currentPage ? 'bg-blue-500 text-white' : 'bg-white'}`}
          >
            {page}
          </button>
        ))}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3 py-2 border rounded-r-md bg-white disabled:opacity-50"
        >
          Вперед
        </button>
      </nav>
    </div>
  );
};

export default Pagination;