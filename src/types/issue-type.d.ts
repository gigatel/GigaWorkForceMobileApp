// Issue Category and Type definitions
export interface IssueCategory {
  id: string;
  name: string;
}

export interface IssueType {
  id: string;
  name: string;
  categoryId: string;
}

export interface IssueTypesResponse {
  status: string;
  success: boolean;
  data: IssueCategory[];
  message?: string;
}

export interface IssueWorkTypesResponse {
  status: string;
  success: boolean;
  data: IssueType[];
  message?: string;
}

// Parsed issue categories with their mapped types
export interface ParsedIssueCategories {
  chamber: string;
  enclosure: string;
  tiffin: string;
}

// Hook return type
export interface UseIssueCategoriesReturn {
  // Categories
  categories: ParsedIssueCategories;
  categoriesLoading: boolean;
  categoriesError: string | null;

  // Specific types for selected category
  specificTypes: IssueType[];
  typesLoading: boolean;
  typesError: string | null;

  // Actions
  loadSpecificTypes: (categoryId: string) => Promise<void>;
  refreshCategories: () => Promise<void>;

  // State
  selectedCategory: string;
  setSelectedCategory: (categoryId: string) => void;
}

// Follow-up submission payload with issue types
export interface FollowUpWithIssuePayload {
  assignTaskId: string;
  chamberId: string;
  chamberIdStr: string;
  chamberName: string;
  remark: string;

  // Issue-specific fields
  isIssueFound: boolean;
  issueCategory?: string;
  issueId?: string;

  // Images
  image?: {
    imageData: string;
    imageExtention: string;
  };
  complaintFollowImage?: Array<{
    imageUrl: string;
    imageExtention: string;
  }>;

  // Location
  lat?: string;
  lng?: string;
  gpsLocation?: string;
  address?: string;

  // Metadata
  empId: string;
  companyCode: string;
}

// ========================================
// FOLLOW-UP PAYLOAD TYPES
// ========================================

// Image format for follow-ups
export interface FollowUpImage {
  imageData: string;
  imageExtention: string;
}

export interface ComplaintFollowImage {
  imageUrl: string;
  imageExtention: string;
}

// GPS Location type
export interface GPSLocation {
  lat: number;
  lng: number;
}

// Chamber selection data
export interface SelectedChamber {
  id: string;
  name: string;
  address: string;
  latitude?: number;
  longitude?: number;
}

// ========================================
// PAYLOAD 1: Simple Follow-Up (Issue Found = FALSE)
// ========================================
export interface AddFollowUpPayload {
  complaintId: number;
  chamberId: number;
  chamberIdStr: string;
  chamberName: string;
  address: string;
  remark: string;
  empId: number;
  lat: string;
  lng: string;
  image: FollowUpImage | null;
}

// ========================================
// PAYLOAD 2: Complaint Follow-Up with Issues (Issue Found = TRUE)
// ========================================
export interface AddComplaintFollowUpPayload {
  complaintId: number;
  chamberIdStr: string;
  isIssueFound: boolean;
  issueCategory?: number;
  issueId?: number;
  complaintFollowImage: ComplaintFollowImage[];
  lat: string;
  lng: string;
  gpsLocation: string;
  remark: string;
  employeeId: number;
  companyCode: string;
  createdOn: string;
  isOffline: boolean;
}

// ========================================
// INPUT TYPES FOR SERVICE METHODS
// ========================================

// Input for addFollowUp method (Issue Found = FALSE)
export interface AddFollowUpInput {
  ticketId: string;
  chamberId: string;
  remark: string;
  images: string[];
  gpsLocation?: GPSLocation;
  selectedChamber?: SelectedChamber;
}

// Input for addComplaintFollowUp method (Issue Found = TRUE)
export interface AddComplaintFollowUpInput {
  complaintId: string;
  chamberIdStr: string;
  isIssueFound: boolean;
  issueCategory?: string;
  issueId?: string;
  complaintFollowImage: ComplaintFollowImage[];
  remark: string;
  lat?: string;
  lng?: string;
  gpsLocation?: string;
  empId?: string;
  companyCode?: string;
}

// ========================================
// RESPONSE TYPES
// ========================================

export interface FollowUpSubmissionResponse {
  success: boolean;
  message: string;
  data?: any;
}

// ========================================
// UTILITY TYPES
// ========================================

// Union type for all follow-up submission methods
export type FollowUpSubmissionMethod = 'simple' | 'with-issues';

// Configuration for follow-up form
export interface FollowUpFormConfig {
  requireIssueSelection: boolean;
  allowMultipleImages: boolean;
  requireGPSLocation: boolean;
  maxImageSize: number;
  supportedImageFormats: string[];
}

// Form validation state
export interface FollowUpFormValidation {
  isValid: boolean;
  errors: {
    chamber?: string;
    remarks?: string;
    images?: string;
    issueCategory?: string;
    issueType?: string;
    general?: string;
  };
}

// ========================================
// LEGACY TYPE (kept for backward compatibility)
// ========================================
export interface FollowUpWithIssuePayload extends AddComplaintFollowUpInput {
  // Legacy fields - kept for backward compatibility
  assignTaskId?: string;
  chamberId?: string;
  chamberName?: string;
  image?: FollowUpImage;
  address?: string;
}

export interface GeoLocation {
  lat: number;
  lng: number;
}

export interface BasicFollowUpPayload {
  assignTaskId: string;
  empId: string;
  chamberId: string;
  chamberIdStr: string;
  chamberName: string;
  remark: string;
  lat: string;
  lng: string;
  address: string;
  image: {
    imageExtention: string;
    imageData: string; // base64 encoded
  };
}

export interface FollowUpWithIssuePayload {
  complaintId: string;
  companyCode: string;
  empId: string;
  issueCategory: string;
  issueFound: boolean;
  issueId: string;
  remark: string;
  chamberId: string;
  chamberIdStr: string;
  lat: string;
  lng: string;
  gpsLocation: string;
  complaintFollowImage: Array<{
    imageUrl: string; // base64 encoded
    imageExtention: string;
  }>;
}

export interface ApiResponse {
  success: boolean;
  status: string;
  message: string;
  data?: any;
}

export interface NearestChambersRequest {
  authentication_token: string;
  lat: string;
  lng: string;
  range: string;
}

export interface IssueCategory {
  id: string;
  name: string;
}

export interface WorkType {
  id: string;
  name: string;
}
