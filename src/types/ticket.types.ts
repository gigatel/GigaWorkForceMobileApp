// src/types/ticket.types.ts
// src/types/ticket.types.ts - ENHANCED
export interface TicketAPIResponse {
  success: boolean;
  status: number;
  message: string;
  data: RawTicketData[];
}
export interface TicketDataGtpl {
  id: string;
  transactionNo: string;
  data: string;
  status: string;
  assignedTo: string;
  nmsType: string;
  popLocation: string;
  assignedByName: string;
  assignedOn: string;
  moduleName: string;
  ticketStartTime: string | null;
  ticketEndTime: string | null;
  statusUpdatedOn: string;
  statusUpdatedByName: string;
  createdByName: string;
  formId: string;
  lastUpdatedOn: string;
  lastUpdatedBy: string;
  isDeleted: boolean;
  isActive: boolean;
  createdBy: string;
  createdOn: string;
  isChecked: string;
 }
 export interface TicketDetailsData {
  id: string;
  LinkId: string;
  linkName: string;
  linkDescription: string;
  customerName: string;
  circuitId: string;
  circuitFrom: string;
  circuitTo: string;
  natureOfFault: string;
  nearestChamber: string;
  cutLocation: string;
  cutLat?: number | null;
  cutLng?: number | null;
  totalDistanceKm: string;
  cutDistanceKm: string;
  status: string;
  contactPersonName: string;
  contactPersonMobile: string;
  assignedTo: string;
  assignedBy: string;
  createdDate: string;
  remark: string;
  nocRemark: string;
  closureRemark: string;
  rfo: string;
  priority: 'high' | 'medium' | 'low';
  company: string;
  isStarted: boolean;
  otdrLength: string;
  modeOfComplaint: string;
  assignId:number;
  address: string;
}
 export interface TicketDetailsData {
  id: string;
  transactionNo: string;
  customerName: string;
  circuitId: string;
  circuitFrom: string;
  circuitTo: string;
  natureOfFault: string;
  status: string;
  contactPersonName: string;
  contactPersonMobile: string;
  assignedTo: string;
  assignedBy: string;
  createdDate: string;
  remark: string;
  nocRemark: string;
  closureRemark: string;
  rfo: string;
  nmsType: string;
  popLocation: string;
  priority: string;
  company: string;
  isStarted: boolean;
  otdrLength: string;
  modeOfComplaint: string;
  assignedTaskId: number;
  chamberDetails?: {
    name: string;
    latitude: number;
    longitude: number;
  };
  irAttachment: string;
  fields: {
    fieldId: number;
    fieldKey: string;
    label: string;
    value: string;
    type: string;
  }[];
}
// UI-friendly processed data
export interface ProcessedTicketData {
  // From TicketDataGtpl
  raw: TicketDataGtpl;
  // Parsed from 'data' field
  customerName: string;
  circuitId: string;
  circuitFrom: string;
  circuitTo: string;
  natureOfFault: string;
  contactPersonName: string;
  contactPersonMobile: string;
  remark: string;
  taskType: string;
  // UI computed fields
  displayStatus: 'assigned' | 'in-progress' | 'completed';
  priority: 'high' | 'medium' | 'low';
  isStarted: boolean;
  hasFollowUps: boolean;
}
export interface FollowUpDataGtpl {
  assignTaskId: string;
  empId: string;
  chamberId: string;
  chamberIdStr: string;
  chamberName: string;
  remark: string;
  lat: string;
  lng: string;
  address: string;
  issueCategory?: string;
  issueFound?: boolean;
  issueId?: string;
  image?: FollowUpImage;
  complaintFollowImage?: ReportImagesRequest[];
}
export interface FollowUpImage {
  imageExtention: string;
  imageData: string;
}
export interface ReportImagesRequest {
  imageUrl: string;
  imageExtention: string;
}
// Chamber selection data
export interface NearestChamberData {
  chamberId: string;
  chamberName: string;
  latitude: number;
  longitude: number;
  distance: number;
  address: string;
}

// Issue type data
export interface IssueTypeData {
  chamberId: string; // TYPE_ID_CHAMBER
  enclosureId: string; // TYPE_ID_ENCLOSURE
  tiffinId: string; // TYPE_ID_TIFFIN
}

export interface WorkTypeData {
  id: string;
  name: string;
}

export interface RawTicketData {
  id: number;
  assignTaskId: number;
  transactionNo: string;
  status: string;
  assignedTo: string;
  assignedByName: string;
  assignedOn: string;
  moduleName: string;
  data: string;
  isStartedByEmp: boolean;
  ticketStartTime: string | null;
  ticketEndTime: string | null;
  statusUpdatedOn: string;
  statusUpdatedByName: string;
  createdOn: string;
  createdBy: number;
  formId: number;
  taskGroup: string;
  rfo: string | null;
  rfoComment: string | null;
  routeData?: string; // For route tasks
  circuitChamberData?: string; // For circuit tasks
}

export interface ParsedFormData {
  customerName: string;
  circuitId: string;
  circuitFrom: string;
  circuitTo: string;
  otdrLength: string;
  natureOfFault: string;
  contactPersonName: string;
  contactPersonMobile: string;
  remark: string;
  modeOfComplaint: string;
  otdrAvailable: string;
  irAttachment: string;
  fields: {
    fieldId: number;
    fieldKey: string;
    label: string;
    value: string;
    type: string;
  }[];
}

export interface TicketData {
  id: string;
  ticketNo: string;
  transactionNo: string;
  description: string;
  assignedDate: string;
  priority: 'high' | 'medium' | 'low';
  status: 'assigned' | 'in-progress' | 'completed' | 'closed';
  customerName: string;
  customerMobile: string;
  ticketType: 'complaint' | 'task';
  // Enhanced fields for Java app matching
  taskType?: 'circuit' | 'route' | 'miscellaneous';
  hasChamber?: boolean;
  chamberCount?: number;
  // Location Info
  circuitFrom: string;
  circuitTo: string;
  circuitId: string;
  // Assignment Info
  assignedTo: string;
  assignedBy: string;
  // Contact Info
  contactPersonName: string;
  contactPersonMobile: string;
  // Technical Details
  natureOfFault: string;
  modeOfComplaint: string;
  otdrLength: string;
  remark: string;
  // Status Info
  isStarted: boolean;
  startTime: string | null;
  endTime: string | null;
  // Raw data for detailed view
  rawData: RawTicketData;
  formData: ParsedFormData;
}

// Tab types for navigation
export type TicketTabType =
  | 'all'
  | 'complaints'
  | 'tasks'
  | 'assigned'
  | 'inprogress'
  | 'completed';

export interface TicketFilter {
  tab: TicketTabType;
  date: string;
  search: string;
  status?: string;
}

// ✅ Other interfaces remain same...
export interface ChamberData {
  id: string;
  chamberId: string;
  chamberName: string;
  latitude: number;
  longitude: number;
  address?: string;
  distance?: number;
}
export interface FollowUpData {
  id?: string;
  ticketId: string;
  followUpText: string;
  followUpDate: string;
  empId: string;
  empName?: string;
  images?: string[];
  lat?: number;
  lng?: number;
  isComplaint?: boolean;
  complaintType?: string;
  workType?: string;
}

// ✅ API Request Structures
export interface GetTicketsRequest {
  moduleName: string;
  formId: number;
  empId: string;
  date: string;
  companyId: string;
}

export interface GetTicketDetailsRequest {
  ticket_id: string;
  flag: string;
  EmployeeID: string;
}

// ✅ API Endpoints
export const TICKET_ENDPOINTS = {
  GET_TICKETS: 'Complaint/GetEmpComplaintsOfDate',
  GET_TICKET_DETAILS: 'Complaint/GetComplaintById',
  GET_FOLLOW_UPS: 'Tickets/FollowUpList',
  ADD_FOLLOW_UP: 'Complaint/AddFollowUps',
  ADD_FOLLOW_UP_WITH_COMPLAINT: 'Complaint/AddComplaintFollowUp',
  UPDATE_RFO: 'Complaint/UpdateTaskRFO',
  GET_RFO_REASONS: 'RFOMaster/GetRFOMasterDD',
  GET_CHAMBERS: 'Chamber/GetNearestChambers',
  GET_WORK_TYPES: 'TypeOfWork/GetTypeOfWorkDD',
  GET_COMPLAINT_TYPES: 'TypeOfWork/GetTypeDD',
} as const;
