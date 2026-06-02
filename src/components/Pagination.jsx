const DOTS = "...";

function getVisiblePages(currentPage, totalPages) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages = [];

  const showLeftDots = currentPage > 4;
  const showRightDots = currentPage < totalPages - 3;

  pages.push(1);

  if (showLeftDots) {
    pages.push(DOTS);
  }

  const startPage = Math.max(2, currentPage - 1);
  const endPage = Math.min(totalPages - 1, currentPage + 1);

  for (let page = startPage; page <= endPage; page += 1) {
    pages.push(page);
  }

  if (showRightDots) {
    pages.push(DOTS);
  }

  pages.push(totalPages);

  return pages;
}

function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  const visiblePages = getVisiblePages(currentPage, totalPages);

  const goToPrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const goToNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  return (
    <nav className="pagination" aria-label="Paginación de movimientos">
      <button
        type="button"
        className="pagination-btn"
        onClick={goToPrevious}
        disabled={currentPage === 1}
      >
        Anterior
      </button>

      <div className="pagination-pages">
        {visiblePages.map((page, index) => {
          if (page === DOTS) {
            return (
              <span
                key={`dots-${index}`}
                className="pagination-dots"
                aria-hidden="true"
              >
                ...
              </span>
            );
          }

          return (
            <button
              type="button"
              key={page}
              className={`pagination-number ${
                page === currentPage ? "active" : ""
              }`}
              onClick={() => onPageChange(page)}
              aria-current={page === currentPage ? "page" : undefined}
            >
              {page}
            </button>
          );
        })}
      </div>

      <button
        type="button"
        className="pagination-btn"
        onClick={goToNext}
        disabled={currentPage === totalPages}
      >
        Siguiente
      </button>
    </nav>
  );
}

export default Pagination;