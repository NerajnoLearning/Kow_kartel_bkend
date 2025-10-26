import { PAGINATION } from './constants';

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginationResult {
  skip: number;
  take: number;
  currentPage: number;
  itemsPerPage: number;
}

export interface PaginationMeta {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

export const getPaginationParams = (
  page?: number,
  limit?: number
): PaginationResult => {
  const currentPage = Math.max(page || PAGINATION.DEFAULT_PAGE, 1);
  const itemsPerPage = Math.min(
    Math.max(limit || PAGINATION.DEFAULT_LIMIT, 1),
    PAGINATION.MAX_LIMIT
  );

  const skip = (currentPage - 1) * itemsPerPage;
  const take = itemsPerPage;

  return {
    skip,
    take,
    currentPage,
    itemsPerPage,
  };
};

export const getPaginationMeta = (
  totalItems: number,
  currentPage: number,
  itemsPerPage: number
): PaginationMeta => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  return {
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
  };
};
