import * as yup from 'yup';

/**
 * Yup validation schema for CloseTicketScreen form
 *
 * This schema validates the form data with the following rules:
 * - selectedRfoId: Required - must select a closure reason
 * - closureRemarks: Required, min 10 characters, max 500 characters
 *
 * Usage:
 * ```typescript
 * import { validateCloseTicketForm, CloseTicketFormData } from '@schemas';
 *
 * const formData: CloseTicketFormData = {
 *   selectedRfoId: 'rfo123',
 *   closureRemarks: 'Detailed closure remarks here...'
 * };
 *
 * const result = await validateCloseTicketForm(formData);
 * if (!result.isValid) {
 *   console.log('Validation errors:', result.errors);
 * }
 * ```
 */

// Define the RFO option interface for validation
export interface RFOOption {
  id: string;
  name: string;
  description?: string;
}

// Define the form data interface
export interface CloseTicketFormData {
  selectedRfoId: string;
  closureRemarks: string;
}

// Main validation schema
export const closeTicketSchema = yup.object().shape({
  selectedRfoId: yup
    .string()
    .required('Please select a closure reason')
    .min(1, 'Please select a valid closure reason'),

  closureRemarks: yup
    .string()
    .required('Please enter closure remarks')
    .trim()
    .min(10, 'Remarks should be at least 10 characters')
    .max(500, 'Remarks cannot exceed 500 characters'),
});

// Validation function with custom error messages
export const validateCloseTicketForm = async (
  data: CloseTicketFormData,
): Promise<{isValid: boolean; errors: Record<string, string>}> => {
  try {
    await closeTicketSchema.validate(data, {abortEarly: false});
    return {isValid: true, errors: {}};
  } catch (validationError: any) {
    const errors: Record<string, string> = {};

    if (validationError.inner) {
      validationError.inner.forEach((error: any) => {
        if (error.path) {
          errors[error.path] = error.message;
        }
      });
    } else if (validationError.path) {
      errors[validationError.path] = validationError.message;
    }

    return {isValid: false, errors};
  }
};

// Export types for use in components
export type {RFOOption};
