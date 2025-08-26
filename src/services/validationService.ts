import * as React from "react";

export interface ValidationRule<T = any> {
  name: string;
  validate: (value: T) => boolean | Promise<boolean>;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  info: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
  code?: string;
}

export class ValidationService {
  private rules: Map<string, ValidationRule[]> = new Map();

  // Register validation rules for specific fields
  addRule(field: string, rule: ValidationRule): void {
    if (!this.rules.has(field)) {
      this.rules.set(field, []);
    }
    this.rules.get(field)!.push(rule);
  }

  // Validate a single field
  async validateField(field: string, value: any): Promise<ValidationResult> {
    const fieldRules = this.rules.get(field) || [];
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];
    const info: ValidationError[] = [];

    for (const rule of fieldRules) {
      try {
        const isValid = await rule.validate(value);
        if (!isValid) {
          const error: ValidationError = {
            field,
            message: rule.message,
            severity: rule.severity,
            code: rule.name
          };

          switch (rule.severity) {
            case 'error':
              errors.push(error);
              break;
            case 'warning':
              warnings.push(error);
              break;
            case 'info':
              info.push(error);
              break;
          }
        }
      } catch (error) {
        errors.push({
          field,
          message: `Validation rule "${rule.name}" failed: ${error}`,
          severity: 'error',
          code: 'VALIDATION_ERROR'
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      info
    };
  }

  // Validate multiple fields
  async validateObject(obj: Record<string, any>): Promise<ValidationResult> {
    const allResults = await Promise.all(
      Object.entries(obj).map(([field, value]) => 
        this.validateField(field, value)
      )
    );

    const combined = allResults.reduce(
      (acc, result) => ({
        isValid: acc.isValid && result.isValid,
        errors: [...acc.errors, ...result.errors],
        warnings: [...acc.warnings, ...result.warnings],
        info: [...acc.info, ...result.info]
      }),
      { isValid: true, errors: [], warnings: [], info: [] } as ValidationResult
    );

    return combined;
  }

  // Clear all rules
  clearRules(): void {
    this.rules.clear();
  }

  // Remove rules for a specific field
  clearFieldRules(field: string): void {
    this.rules.delete(field);
  }
}

// Pre-defined validation rules
export const CommonValidationRules = {
  figmaUrl: {
    required: {
      name: 'required',
      validate: (value: string) => !!value && value.trim().length > 0,
      message: 'Figma URL megadása kötelező',
      severity: 'error' as const
    },
    format: {
      name: 'figma-url-format',
      validate: (value: string) => {
        if (!value) return true; // Skip if empty (handled by required rule)
        return /^(https?:\/\/)?(www\.)?figma\.com\/(file|design|proto)\/[A-Za-z0-9\-_]+/i.test(value.trim());
      },
      message: 'Érvényes Figma URL szükséges (file vagy design link)',
      severity: 'error' as const
    },
    accessibility: {
      name: 'figma-url-accessibility',
      validate: (value: string) => {
        if (!value) return true;
        // Check if URL contains node-id for specific element selection
        return !value.includes('node-id=') || value.includes('node-id=');
      },
      message: 'Specifikus node kiválasztása esetén ellenőrizd a hozzáférési jogokat',
      severity: 'warning' as const
    }
  },

  figmaToken: {
    required: {
      name: 'required',
      validate: (value: string) => !!value && value.trim().length > 0,
      message: 'Figma API token megadása kötelező',
      severity: 'error' as const
    },
    format: {
      name: 'figma-token-format',
      validate: (value: string) => {
        if (!value) return true;
        return /^figd_[A-Za-z0-9]{20,}$/.test(value.trim());
      },
      message: 'Érvényes Figma API token formátum szükséges (figd_...)',
      severity: 'error' as const
    },
    security: {
      name: 'token-security',
      validate: (value: string) => {
        if (!value) return true;
        // Check for common security issues
        return !value.includes(' ') && value.length >= 20;
      },
      message: 'API token biztonsági ellenőrzése sikertelen',
      severity: 'warning' as const
    }
  },

  conversionConfig: {
    framework: {
      name: 'framework-validation',
      validate: (value: string) => {
        const validFrameworks = ['html', 'react', 'vue', 'angular'];
        return validFrameworks.includes(value);
      },
      message: 'Érvényes framework kiválasztása szükséges',
      severity: 'error' as const
    },
    cssFramework: {
      name: 'css-framework-validation',
      validate: (value: string) => {
        const validCssFrameworks = ['tailwind', 'bootstrap', 'custom', 'none'];
        return validCssFrameworks.includes(value);
      },
      message: 'Érvényes CSS framework kiválasztása szükséges',
      severity: 'error' as const
    }
  },

  customCode: {
    jsx: {
      name: 'jsx-syntax',
      validate: (value: string) => {
        if (!value) return true;
        // Basic JSX syntax validation
        try {
          // Check for balanced brackets and basic JSX patterns
          const openBrackets = (value.match(/\{/g) || []).length;
          const closeBrackets = (value.match(/\}/g) || []).length;
          const openTags = (value.match(/</g) || []).length;
          const closeTags = (value.match(/>/g) || []).length;
          
          return openBrackets === closeBrackets && openTags === closeTags;
        } catch {
          return false;
        }
      },
      message: 'JSX szintaxis hiba: ellenőrizd a zárójeleket és tag-eket',
      severity: 'warning' as const
    },
    css: {
      name: 'css-syntax',
      validate: (value: string) => {
        if (!value) return true;
        // Basic CSS syntax validation
        try {
          const openBraces = (value.match(/\{/g) || []).length;
          const closeBraces = (value.match(/\}/g) || []).length;
          return openBraces === closeBraces;
        } catch {
          return false;
        }
      },
      message: 'CSS szintaxis hiba: ellenőrizd a kapcsos zárójeleket',
      severity: 'warning' as const
    }
  }
};

// Factory function to create a pre-configured validation service
export function createFigmaValidationService(): ValidationService {
  const service = new ValidationService();

  // Register Figma URL rules
  service.addRule('figmaUrl', CommonValidationRules.figmaUrl.required);
  service.addRule('figmaUrl', CommonValidationRules.figmaUrl.format);
  service.addRule('figmaUrl', CommonValidationRules.figmaUrl.accessibility);

  // Register Figma token rules
  service.addRule('figmaToken', CommonValidationRules.figmaToken.required);
  service.addRule('figmaToken', CommonValidationRules.figmaToken.format);
  service.addRule('figmaToken', CommonValidationRules.figmaToken.security);

  // Register config rules
  service.addRule('framework', CommonValidationRules.conversionConfig.framework);
  service.addRule('cssFramework', CommonValidationRules.conversionConfig.cssFramework);

  // Register custom code rules
  service.addRule('customJsx', CommonValidationRules.customCode.jsx);
  service.addRule('customCss', CommonValidationRules.customCode.css);

  return service;
}

// Async validation helper for React Hook Form
export async function validateAsync<T>(
  service: ValidationService,
  field: string,
  value: T
): Promise<string | true> {
  const result = await service.validateField(field, value);
  
  if (result.errors.length > 0) {
    return result.errors[0].message;
  }
  
  return true;
}

// Real-time validation hook
export function useValidation(service: ValidationService) {
  const [validationResults, setValidationResults] = React.useState<Map<string, ValidationResult>>(new Map());

  const validateField = React.useCallback(async (field: string, value: any) => {
    const result = await service.validateField(field, value);
    setValidationResults(prev => new Map(prev).set(field, result));
    return result;
  }, [service]);

  const validateObject = React.useCallback(async (obj: Record<string, any>) => {
    const result = await service.validateObject(obj);
    return result;
  }, [service]);

  const getFieldResult = React.useCallback((field: string): ValidationResult | undefined => {
    return validationResults.get(field);
  }, [validationResults]);

  const clearValidation = React.useCallback((field?: string) => {
    if (field) {
      setValidationResults(prev => {
        const newMap = new Map(prev);
        newMap.delete(field);
        return newMap;
      });
    } else {
      setValidationResults(new Map());
    }
  }, []);

  return {
    validateField,
    validateObject,
    getFieldResult,
    clearValidation,
    validationResults: Array.from(validationResults.entries())
  };
}