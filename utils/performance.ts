import { InteractionManager } from 'react-native';

export const PerformanceUtils = {
  // Defer expensive operations until after interactions
  runAfterInteractions: (callback: () => void) => {
    InteractionManager.runAfterInteractions(callback);
  },

  // Debounce function for search inputs
  debounce: <T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): ((...args: Parameters<T>) => void) => {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  },

  // Throttle function for scroll events
  throttle: <T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): ((...args: Parameters<T>) => void) => {
    let inThrottle: boolean;
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  },

  // Memoization helper for expensive calculations
  memoize: <T extends (...args: any[]) => any>(fn: T): T => {
    const cache = new Map();
    return ((...args: Parameters<T>) => {
      const key = JSON.stringify(args);
      if (cache.has(key)) {
        return cache.get(key);
      }
      const result = fn(...args);
      cache.set(key, result);
      return result;
    }) as T;
  },

  // Batch state updates
  batchUpdates: (updates: (() => void)[]) => {
    InteractionManager.runAfterInteractions(() => {
      updates.forEach(update => update());
    });
  },

  // Image loading optimization
  getOptimizedImageUri: (uri: string, width: number, height: number) => {
    // Add image optimization parameters if using a CDN
    if (uri.includes('unsplash.com')) {
      return `${uri}&w=${width}&h=${height}&fit=crop&auto=format&q=80`;
    }
    return uri;
  },

  // Memory management for large lists
  getItemLayout: (itemHeight: number) => (data: any, index: number) => ({
    length: itemHeight,
    offset: itemHeight * index,
    index,
  }),

  // Lazy loading helper
  createLazyComponent: <T>(importFunc: () => Promise<{ default: T }>) => {
    let component: T | null = null;
    let promise: Promise<T> | null = null;

    return () => {
      if (component) return Promise.resolve(component);
      if (promise) return promise;

      promise = importFunc().then(module => {
        component = module.default;
        return component;
      });

      return promise;
    };
  },
};

export const ImageOptimization = {
  // Preload critical images
  preloadImages: (uris: string[]) => {
    uris.forEach(uri => {
      const image = new Image();
      image.src = uri;
    });
  },

  // Get placeholder image while loading
  getPlaceholderUri: (width: number, height: number, color = 'f0f0f0') => {
    return `https://via.placeholder.com/${width}x${height}/${color}/${color}`;
  },

  // Progressive image loading
  createProgressiveImageSource: (uri: string, width: number, height: number) => {
    const lowQuality = PerformanceUtils.getOptimizedImageUri(uri, Math.floor(width / 4), Math.floor(height / 4));
    const highQuality = PerformanceUtils.getOptimizedImageUri(uri, width, height);
    
    return {
      lowQuality,
      highQuality,
    };
  },
};