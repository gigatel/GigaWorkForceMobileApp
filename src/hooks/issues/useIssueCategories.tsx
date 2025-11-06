import {Common} from '@utils';
import {useCallback, useEffect, useState} from 'react';
import {ticketService} from '../../services';
import {
  IssueCategory,
  IssueType,
  ParsedIssueCategories,
  UseIssueCategoriesReturn,
} from '../../types/issue-type';

export const useIssueCategories = (): UseIssueCategoriesReturn => {
  // Categories state
  const [categories, setCategories] = useState<ParsedIssueCategories>({
    chamber: '',
    enclosure: '',
    tiffin: '',
  });
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);

  // Specific types state
  const [specificTypes, setSpecificTypes] = useState<IssueType[]>([]);
  const [typesLoading, setTypesLoading] = useState(false);
  const [typesError, setTypesError] = useState<string | null>(null);

  // Selected category
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  // Parse categories from API response (matching Android logic)
  const parseCategories = (
    rawCategories: IssueCategory[],
  ): ParsedIssueCategories => {
    const parsed: ParsedIssueCategories = {
      chamber: '',
      enclosure: '',
      tiffin: '',
    };

    rawCategories.forEach(category => {
      const name = category.name.toLowerCase();

      if (name.includes('chamber')) {
        parsed.chamber = category.id;
      } else if (name.includes('encl')) {
        parsed.enclosure = category.id;
      } else if (name.includes('tiffin')) {
        parsed.tiffin = category.id;
      }
    });

    Common.log('🏷️ Parsed Issue Categories:', parsed);
    return parsed;
  };

  // Load issue categories
  const loadCategories = useCallback(async () => {
    try {
      setCategoriesLoading(true);
      setCategoriesError(null);

      Common.log('🔄 Loading issue categories...');

      const response = await ticketService.getTypeDD();

      if (response.success && response.data) {
        const parsedCategories = parseCategories(response.data);
        setCategories(parsedCategories);

        Common.log('✅ Issue categories loaded:', parsedCategories);
      } else {
        throw new Error('Failed to load issue categories');
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to load issue categories';
      setCategoriesError(errorMessage);
      Common.error('❌ Load Categories Error:', error);
    } finally {
      setCategoriesLoading(false);
    }
  }, []);

  // Load specific types for a category
  const loadSpecificTypes = useCallback(async (categoryId: string) => {
    if (!categoryId) {
      setSpecificTypes([]);
      return;
    }

    try {
      setTypesLoading(true);
      setTypesError(null);

      Common.log('🔄 Loading specific types for category:', categoryId);
      console.log('categoryId', categoryId);
      const response = await ticketService.getTypeOfWorkDD(categoryId);

      if (response.success && response.data) {
        const typesWithCategory = response.data.map((type: any) => ({
          ...type,
          categoryId,
        }));

        setSpecificTypes(typesWithCategory);
        Common.log('✅ Specific types loaded:', typesWithCategory);
      } else {
        throw new Error('Failed to load specific issue types');
      }
    } catch (error: any) {
      const errorMessage =
        error.message || 'Failed to load specific issue types';
      setTypesError(errorMessage);
      Common.error('❌ Load Specific Types Error:', error);
      setSpecificTypes([]);
    } finally {
      setTypesLoading(false);
    }
  }, []);

  // Auto-load specific types when category changes
  useEffect(() => {
    if (selectedCategory) {
      loadSpecificTypes(selectedCategory);
    } else {
      setSpecificTypes([]);
    }
  }, [selectedCategory, loadSpecificTypes]);

  // Load categories on mount
  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  // Refresh categories
  const refreshCategories = useCallback(async () => {
    await loadCategories();
  }, [loadCategories]);

  // Custom category setter that also clears specific types
  const handleSetSelectedCategory = useCallback((categoryId: string) => {
    setSelectedCategory(categoryId);
    setTypesError(null);
  }, []);

  return {
    // Categories
    categories,
    categoriesLoading,
    categoriesError,

    // Specific types
    specificTypes,
    typesLoading,
    typesError,

    // Actions
    loadSpecificTypes,
    refreshCategories,

    // State
    selectedCategory,
    setSelectedCategory: handleSetSelectedCategory,
  };
};

// Utility hook to get category name by ID
export const useIssueCategoryName = (
  categories: ParsedIssueCategories,
  categoryId: string,
): string => {
  if (categoryId === categories.chamber) return 'Chamber';
  if (categoryId === categories.enclosure) return 'Enclosure';
  if (categoryId === categories.tiffin) return 'Tiffin';
  return 'Unknown';
};

// Utility hook to validate if issue selection is complete
export const useIssueValidation = (
  isIssueFound: boolean,
  selectedCategory: string,
  selectedIssue: string,
) => {
  return {
    isValid:
      !isIssueFound || (isIssueFound && selectedCategory && selectedIssue),
    errorMessage: (() => {
      if (!isIssueFound) return null;
      if (!selectedCategory) return 'Please select issue category';
      if (!selectedIssue) return 'Please select specific issue';
      return null;
    })(),
  };
};
