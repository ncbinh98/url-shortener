import { BadRequestException, Injectable } from '@nestjs/common';
import { createHash } from 'crypto';
import { BASE62_ALPHABET } from '../constants/common.constant';
export interface Pagination {
  items: any[];
  page: number;
  limit: number;
  total: number;
}
@Injectable()
export class UtilsService {
  constructor() {}

  private isTrackingParam(param: string): boolean {
    const trackingParams = [
      'utm_source',
      'utm_medium',
      'utm_campaign',
      'utm_term',
      'utm_content',
      'fbclid',
      'gclid',
    ];

    return trackingParams.includes(param.toLowerCase());
  }
  private normalizeQueryParams(params: URLSearchParams): string {
    const entries = Array.from(params.entries())
      // Optional: remove tracking params
      .filter(([key]) => !this.isTrackingParam(key))
      // Sort for deterministic order
      .sort(([a], [b]) => a.localeCompare(b));

    if (entries.length === 0) {
      return '';
    }

    const normalized = new URLSearchParams();
    for (const [key, value] of entries) {
      normalized.append(key, value);
    }

    return `?${normalized.toString()}`;
  }
  private normalizePath(pathname: string): string {
    if (!pathname || pathname === '/') {
      return '/';
    }

    // Remove trailing slash
    return pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
  }
  canonicalizeUrl(input: string): string {
    try {
      const trimmed = input.trim();

      // Ensure URL has a protocol
      const withProtocol = trimmed.match(/^https?:\/\//i)
        ? trimmed
        : `https://${trimmed}`;
      const url = new URL(withProtocol);
      // 1. Normalize protocol
      url.protocol = 'https:';

      // 2. Normalize hostname
      url.hostname = url.hostname.toLowerCase();

      // 3. Remove default ports
      if (
        (url.protocol === 'https:' && url.port === '443') ||
        (url.protocol === 'http:' && url.port === '80')
      ) {
        url.port = '';
      }

      // 4. Normalize pathname
      url.pathname = this.normalizePath(url.pathname);

      // 5. Normalize query params
      url.search = this.normalizeQueryParams(url.searchParams);

      // 6. Remove hash (usually not meaningful for servers)
      url.hash = '';

      return url.toString();
    } catch (error) {
      throw new BadRequestException('Invalid URL');
    }
  }

  hashCanonicalUrl(canonicalUrl: string, length = 16): string {
    const fullHash = createHash('sha256').update(canonicalUrl).digest('hex');

    return fullHash.slice(0, length);
  }

  encodeHexToBase62(hex: string, length = 8): string {
    let value = BigInt(`0x${hex}`);
    const base = BigInt(62);

    if (value === BigInt(0)) {
      return BASE62_ALPHABET[0];
    }

    let result = '';
    while (value > 0) {
      const remainder = value % base;
      result = BASE62_ALPHABET[Number(remainder)] + result;
      value = value / base;
    }

    return result.slice(0, length);
  }

  formatPagination(pagination: Pagination) {
    return {
      items: pagination.items,
      page: pagination.page,
      limit: pagination.limit,
      total: pagination.total,
    };
  }
}
