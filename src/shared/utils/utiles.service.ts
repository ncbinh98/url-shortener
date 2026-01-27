import { Injectable } from '@nestjs/common';
export interface Pagination {
  items: any[];
  page: number;
  limit: number;
  total: number;
}
@Injectable()
export class UtilsService {
  constructor() {}

  formatPagination(pagination: Pagination) {
    return {
      items: pagination.items,
      page: pagination.page,
      limit: pagination.limit,
      total: pagination.total,
    };
  }
}
