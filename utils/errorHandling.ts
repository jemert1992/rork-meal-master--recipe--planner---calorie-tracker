import { Alert } from 'react-native';

export interface AppError {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
}

export class ErrorHandler {
  private static errors: AppError[] = [];

  static logError(error: AppError) {
    this.errors.push(error);
    console.error('App Error:', error);
    
    // In production, you might want to send this to a crash reporting service
    // like Sentry, Bugsnag, or Firebase Crashlytics
  }

  static createError(code: string, message: string, details?: any): AppError {
    return {
      code,
      message,
      details,
      timestamp: new Date(),
    };
  }

  static handleNetworkError(error: any) {
    const appError = this.createError(
      'NETWORK_ERROR',
      'Looks like you\'re offline! Please check your internet connection and try again.',
      error
    );
    this.logError(appError);
    this.showUserFriendlyError(appError);
  }

  static handleRecipeLoadError(error: any) {
    const appError = this.createError(
      'RECIPE_LOAD_ERROR',
      'We couldn\'t load your recipes right now. Don\'t worry, your data is safe! Try refreshing or check back in a moment.',
      error
    );
    this.logError(appError);
    this.showUserFriendlyError(appError);
  }

  static handleMealPlanError(error: any) {
    const appError = this.createError(
      'MEAL_PLAN_ERROR',
      'We had trouble creating your meal plan. Try adjusting your preferences or selecting different recipes.',
      error
    );
    this.logError(appError);
    this.showUserFriendlyError(appError);
  }

  static handleStorageError(error: any) {
    const appError = this.createError(
      'STORAGE_ERROR',
      'We couldn\'t save your changes. Please make sure you have enough storage space and try again.',
      error
    );
    this.logError(appError);
    this.showUserFriendlyError(appError);
  }

  static handleValidationError(field: string, message: string) {
    const appError = this.createError(
      'VALIDATION_ERROR',
      `${field}: ${message}`,
      { field }
    );
    this.logError(appError);
    this.showUserFriendlyError(appError);
  }

  private static showUserFriendlyError(error: AppError) {
    Alert.alert(
      'Something went wrong',
      error.message,
      [
        { text: 'Got it', style: 'default' },
        { 
          text: 'Get help', 
          style: 'cancel',
          onPress: () => this.reportIssue(error)
        }
      ]
    );
  }

  private static reportIssue(error: AppError) {
    // In a real app, this would send the error to your support system
    console.log('Reporting issue:', error);
    Alert.alert(
      'Thanks for letting us know!',
      'We\'ve received your report and will work on fixing this. In the meantime, try restarting the app or check our help section.',
      [{ text: 'OK' }]
    );
  }

  static getRecentErrors(limit = 10): AppError[] {
    return this.errors.slice(-limit);
  }

  static clearErrors() {
    this.errors = [];
  }
}

export const withErrorBoundary = <T extends (...args: any[]) => any>(
  fn: T,
  errorHandler?: (error: any) => void
): T => {
  return ((...args: Parameters<T>) => {
    try {
      const result = fn(...args);
      
      // Handle promises
      if (result && typeof result.catch === 'function') {
        return result.catch((error: any) => {
          if (errorHandler) {
            errorHandler(error);
          } else {
            ErrorHandler.logError(
              ErrorHandler.createError('ASYNC_ERROR', 'An async operation failed', error)
            );
          }
          throw error;
        });
      }
      
      return result;
    } catch (error) {
      if (errorHandler) {
        errorHandler(error);
      } else {
        ErrorHandler.logError(
          ErrorHandler.createError('SYNC_ERROR', 'A synchronous operation failed', error)
        );
      }
      throw error;
    }
  }) as T;
};