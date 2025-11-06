import * as yup from 'yup';

/**
 * Yup validation schema for StartTicketScreen form
 *
 * This schema validates the form data with conditional validation logic:
 * - selectedChamber: Required
 * - issueFound: Required boolean
 * - issueType: Required when issueFound is true
 * - selectedType: Required when issueFound is true AND issueType is selected
 * - remarks: Optional, max 500 characters
 * - selectedImages: Required array, min 1 image, max 10 images
 *
 * Usage:
 * ```typescript
 * import { validateStartTicketForm, StartTicketFormData } from '@schemas';
 *
 * const formData: StartTicketFormData = {
 *   selectedChamber: chamber,
 *   issueFound: true,
 *   issueType: 1,
 *   selectedType: { label: 'Type A', value: 1 },
 *   remarks: 'Some remarks',
 *   selectedImages: ['image1', 'image2'] // At least one image required
 * };
 *
 * const result = await validateStartTicketForm(formData);
 * if (!result.isValid) {
 *   console.log('Validation errors:', result.errors);
 * }
 * ```
 */

// Define the Chamber interface for validation
interface Chamber {
  id: number;
  chamberId: string;
  chamberName: string;
  status: number;
  updatedOn: string;
  chamberLat: string;
  chamberLong: string;
  chamberIdStr: string;
  chamberAddress: string;
  taskName: string;
  distance: number;
}

// Define the SelectedType interface for validation
interface SelectedType {
  label: string;
  value: number;
}

// Define the form data interface
export interface StartTicketFormData {
  selectedChamber: Chamber;
  issueFound: boolean;
  issueType: number;
  selectedType: SelectedType;
  remarks: string;
  selectedImages: string[];
}

// Define the validation interface (non-nullable for Yup)
interface ValidationData {
  selectedChamber: Chamber;
  issueFound: boolean;
  issueType: number;
  selectedType: SelectedType;
  remarks: string;
  selectedImages: string[];
}

// Custom validation method for chamber
const chamberSchema = yup.object().shape({
  id: yup.number().required(),
  chamberId: yup.string().required(),
  chamberName: yup.string().required(),
  status: yup.number().optional(),
  updatedOn: yup.string().optional(),
  chamberLat: yup.string().required(),
  chamberLong: yup.string().required(),
  chamberIdStr: yup.string().optional(),
  chamberAddress: yup.string().optional(),
  taskName: yup.string().optional(),
  distance: yup.number().required(),
});

// Custom validation method for selectedType
const selectedTypeSchema = yup.object().shape({
  label: yup.string().required(),
  value: yup.number().required(),
});

// Main validation schema
export const startTicketSchema = yup.object().shape({
  selectedChamber: chamberSchema.required('Please select a chamber'),

  issueFound: yup
    .boolean()
    .required('Please select whether an issue was found'),

  issueType: yup.number().when('issueFound', {
    is: true,
    then: schema => schema.required('Please select the issue type'),
    otherwise: schema => schema.nullable(),
  }),

  selectedType: yup.mixed().when(['issueFound', 'issueType'], {
    is: (issueFound: boolean, issueType: number) =>
      issueFound === true && issueType !== null && issueType !== undefined,
    then: schema =>
      selectedTypeSchema.required('Please select the specific type'),
    otherwise: schema => schema.nullable(),
  }),

  remarks: yup.string().trim().max(500, 'Remarks cannot exceed 500 characters'),

  selectedImages: yup
    .array()
    .of(yup.string())
    .min(1, 'At least one image is required')
    .max(10, 'Maximum 10 images allowed'),
});

// Validation function with custom error messages
export const validateStartTicketForm = async (
  data: StartTicketFormData,
): Promise<{isValid: boolean; errors: Record<string, string>}> => {
  try {
    await startTicketSchema.validate(data, {abortEarly: false});
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
export type {Chamber, SelectedType};
