export interface LoginResponse {}
export interface IdName {
  id: number,
  name: string,
  isChecked?: boolean
}
export interface Loading {
  loading?: 'idel' | 'pending' | 'fulfilled' | 'rejected';
}
export type LoadingType = 'idel' | 'pending' | 'fulfilled' | 'rejected';

export type ShiftType = 'single' | 'double'
export type SheetRowType = 'behalfOf' | 'default' | 'labelValue' |'chamber' | 'nearestChamber' | 'chamberComplaintAlert' | 'customer' | 'circuit';

export interface ApiResponse {
  success: boolean;
  status: number;
  message: string;
  data: string | null;
}

export interface GeoLocation {
  mocked: boolean;
  timestamp: number;
  coords: Coords
  extras: {
    meanCn0: number,
    maxCn0: number,
    satellites: number
  },
}
export interface Coords {
  speed?: number;
  longitude: number;
  latitude: number;
  accuracy?: number;
  heading?: number;
  altitude?: number;
  altitudeAccuracy?: number;
}
export interface GeoAddress {
  lat: number
  long: number,
  address: string
}
export interface GeoError {
  code: number;
  message: string;
  PERMISSION_DENIED: number;
  POSITION_UNAVAILABLE: number;
  TIMEOUT: number;
}
export interface AttendancePolicy {
  isViewAttendanceAllow: boolean
  isMarkAttendaceAllow: boolean
}


export interface ImagePickerResponse {
  modificationDate: string,
  size: number,
  mime: string,
  height: number,
  data: string,
  width: number,
  filename: string,
  path: string
}

//! ================ DASHBOARD ================ ! \\
interface DasboardResponse {
  notification: string;
  projectListAll: Project[];
  mobileAppVersion: MobileAppVersion;
  mobileAppVersion1: MobileAppVersion1;
  isDeviceToken: boolean;
  isPolicyChanged: boolean;
  employeeDetails: EmployeeDetails;
  attendance: Attendance;
  doubleDuty: string | null;
  bikeMeterInfo: BikeMeterInfo;
  isLogoutRequired: boolean;
  geoFencingDetails: GeoFencingDetails[]
  success: boolean;
  status: number;
  message: string;
  data: string | null;
}

interface Project {
  id: number;  
  projectId: number;
  projectCode:string;
  projectName: string;
  name: string;
  startAddress:string;
  endAddress:string;
  modules: Module[];
  polices: Policy[]; 
}

interface Module {
  moduleId: number;
  moduleName: string;
  moduleImage: string | null;
  subModules: SubModule[];
  polices: Policy[]; // Empty in the data, but included for completeness
}

interface SubModule {
  subModuleId: number;
  subModuleName: string;
  subModuleImage: string | null;
  polices: Policy[];
}

interface Policy {
  id: number;
  policyId: number;
  policyName: string;
  policyType: string;
  isChecked: boolean;
  projectId: number;
  projectName: string;
  moduleId: number;
  moduleName: string;
  moduleImage: string | null;
  subModuleId: number;
  subModuleName: string;
  subModuleImage: string;
  companyId: number;
}

interface MobileAppVersion {
  id: number;
  version_name: string;
  version_code: string;
  description: string;
  access_url: string;
  created_on: string; // Date string in custom format (e.g., "18-03-YYYY 06:22:37")
  app_type_id: number;
}

interface EmployeeDetails {
  createdByName: string | null;
  designationName: string | null;
  departmentName: string | null;
  zoneName: string | null;
  shiftName: string | null;
  companyName: string | null;
  branchName: string | null;
  reportingManager: string | null;
  reportingBranch: string | null;
  lastUpdatedByName: string | null;
  companyBranchList: string | null;
  employeePhotoUrl: string | null;
  officeEmailId: string | null;
  officeMobileNo: string | null;
  personalEmailId: string | null;
  personalMobileNo: string | null;
  leaveFormulaName: string | null;
  latePenaltyFormulaName: string | null;
  userId: number;
  role: string | null;
  nextShiftId: number | null;
  nextShiftName: string | null;
  nextShiftTime: string | null;
  nextZoneId: number | null;
  nextZoneName: string | null;
  id: number;
  isPateroller: boolean;
  employeeCode: string;
  firstName: string;
  middleName: string | null;
  lastName: string;
  gender: string;
  designationId: number;
  departmentId: number;
  zoneId: number;
  branchId: number;
  organizationId: number;
  birthDate: string; // ISO 8601 date string
  joiningDate: string; // ISO 8601 date string
  employmentType: string;
  leavingDate: string | null; // ISO 8601 date string
  bloodGroup: string | null;
  shiftTime: string;
  employeePhoto: string | null;
  probationFromDate: string | null; // ISO 8601 date string
  probationToDate: string | null; // ISO 8601 date string
  shiftId: number;
  companyId: number;
  physicalStatus: string;
  leaveFormula: number;
  holidayFormula: number;
  latePenaltyFormula: number | null;
  attendanceReport: string;
  lastUpdated: string | null; // ISO 8601 date string
  lastUpdatedBy: number | null;
  isDeleted: boolean;
  isActive: boolean;
  createdBy: number;
  createdOn: string; // ISO 8601 date string
  type: 'phone' | 'whatsapp' // Local
}

export interface GeoFencingDetails {
  geoFencingAllowedOn: string;
  office: string;
  rangeInMeter: number;

}

interface Attendance {
  date: string; // Custom date format (e.g., "21-4-2025")
  inTime: string | null;
  inTimeStr: string | null;
  outTime: string | null;
  outTimeStr: string | null;
  inFullTime: string | null;
  outFullTime: string | null;
  late: string | null;
  workingHours: string | null;
  status: string;
  overTime: string | null;
  inMode: string | null;
  outMode: string | null;
  inLocation: string | null;
  outLocation: string | null;
  remark: string | null;
  editByName: string | null;
  editOn: string | null; // Date string if present
  weekOffDay: string;
  isLocked: boolean | null;
  isApproved: boolean | null;
  otInApplicableOTRange: boolean | null;
  statusAuto: boolean;
  bhaf1StatusAuto: boolean;
  bhaf2StatusAuto: boolean;
  isEdited: boolean;
  shiftAttPolicies: string | null;
  doubleDuty: string | null;
  tripleDuty: string | null;
  latePanaltyData: string | null;
}

interface BikeMeterInfo {
  bikeReadingSubmittedAtStartTime: string;
  bikeReadingSubmittedAtEndTime: string;
  bikeNumberSubmittedAtStartTime: string;
  bikeNumberSubmittedAtEndTime: string;
}


interface AllowedModuleList {
  id: number;
  name: string;
}

interface AllowedModule {
  allowedModuleList: AllowedModuleList[];
  modules: string[];
}

export interface AttendanceResponse extends ApiResponse {
  todayAttendanceData: AttendanceData
  attendanceData: AttendanceData[];
}
export interface AttendanceData {
  date: string | null
  isPresent: boolean
  inTimeStr: string | null;
  outTimeStr: string | null;
  inTime: string | null
  outTime: string | null
  doubleLogs: PunchLogs[]
  tripleLogs: string | null
  punchLogs: PunchLogs[] | null
  isMarkIn: boolean // Made Local Prop
  isMarkOut: boolean // Made Local Prop
  markOutDisable: boolean // Made Local Prop
  isShiftTimingRestrictions: boolean // Made Local Prop

}

export interface PostLocationResponse {
  id?: string | number;
  latitude?: number;
  longitude?: number;
  timestamp?: string;      // ISO string if server returns it
  message?: string;        // optional server message
  [key: string]: any;      // keep flexible for now
}

export interface PunchLogs {
  shiftTime: string,
  behalfOfShiftTime: string
  overTime: string
  behalfOfOverTime: string
  editBy: string | null
  editOn: string | null
  preEditTime: string | null
  editRemark: string | null
  weekOff: string | null
  weekOffDay: string | null
  isApproved: string | null
  isLocked: string | null
  isEdited: string | null
  id: number
  employeeId: number
  deviceName: string
  deviceSerial: string
  location: string
  punchMode: string
  direction: 'in' | 'out'
  imageData: null | string
  lat: null | string | number
  lon: null | string | number
  createdOn: string
  behalfOf: number
  shiftId: number
  behalfOfShiftId: number
  syncTime: null | string
  nextShiftId: null | number
  nextZoneId: null | number
}

export interface DateProps {
  dateString: string;
  day: number;
  month: number;
  timestamp: number;
  year: number;
}

export interface AttendanceInOutReport {
  empId: number
  empName: string
  departmentId: number
  departmentName: string
  designationId: number
  designationName: string
  shiftId: number
  shiftName: string
  device: null | string
  doubleDuty: null | AttendanceInOutReport
  tripleDuty: null | string
  joiningDate: string
  leavingDate: null | string
  date: string
  inTime: null | string
  outTime: null | string
  inFullTime: null | string
  outFullTime: null | string
  late: null | string
  workingHours: null | string
  status: string | null
  overTime: null | string
  inMode: null | string
  outMode: null | string
  inLocation: null | string
  outLocation: null | string
  remark: null | string
  editByName: null | string
  editOn: null | string
  weekOffDay: null | string
  isLocked: null | string
  isApproved: null | string
  otInApplicableOTRange: null | string
  statusAuto: true
  bhaf1StatusAuto: true
  bhaf2StatusAuto: true
  isEdited: false
  shiftAttPolicies: any
  latePanaltyData: any
}

export interface EmployeeZoneChamber {
  id: number,
  route_id_int: number,
  route_id: string,
  route_name: string,
  chamber_id: string,
  chamber_name: string,
  chamber_longitude: string,
  chamber_latitude: string,
  chamberNo: string
}

export interface EmployeeOfficeBranch {}

export interface AllowedShift {
  id: number
  shiftName: string
  shiftTime: string
  startTime: string
  shiftStartTime: string
  shiftEndTime: string
  endTime: string
}
export interface EmployeeShift extends AllowedShift {
}

export interface TodayDoubleDuty extends AttendanceInOutReport {

}

export interface TodayDuty extends AttendanceInOutReport {


}

export interface MarkAttendanceRequest {
  imageData: string
  punchMode: string
  deviceName: string
  deviceSerial: string
  direction: string
  imageExtention: string
  location: string
  lat: string
  lon: string
  gpsAddress: string
  behalfOf: string | number
  nextShiftId: string | number
  nextZoneId: string | number
  date?: string
  time?: string
  direction?: string
  behalfName?: string
  employeeCode?: string
}

export interface TodayBehalfOf {
  id: number,
  name: string
  employeeCode: string
  designation: string
  shiftTime: string
  shiftName: string
  shiftStartTime: string
  shiftEndTime: string
  isDay: boolean
  isEvening: boolean
  isNight: boolean
}


//! PAYROLL
export interface MonthlySalary {
  'id': number
  'month': number
  'year': number
  'empId': number
  'employeeCode': string
  'firstName': string
  'middleName': null
  'lastName': string
  'designationId': number
  'designationName': string
  'departmentId': number
  'departmentName': string
  'workingDays': number
  'absentDays': number
  'halfDay': number
  'sickLeave': number
  'casualLeave': number
  'totalLeave': number
  'prevSickLeave': number
  'prevCasualLeave': number
  'prevTotalLeave': number
  'weekOff': number
  'skipWeekOff': number
  'woSandwich': number
  'holidaySandwich': number
  'doubleDuty': number
  'previousOT': number
  'currentOT': number
  'approvedOT': number
  'totalOT': number
  'totalPayableDays': number
  'totalDays': number
  'inHand': number
  'ohnh': number
  'status': string
  'actualGross': number
  'actualCtc': number
  'earnedLeave': number
  'calculatedGross': number
  'calculatedCtc': number
  'formulaId': number
  'penaltyDays': number
  'isActive': null
  'createdBy': null
  'createdOn': null
  'createdByName': null
  'isApproved': null
  'approvedBy': null
  'approvedByName': null
  'advanceDeduction': null
  'earings': SalaryEarnings[
  ],
  'deductions': SalaryDeductions[

  ]
}

export interface SalaryEarnings {
  'id': number,
  'empId': number,
  'earningId': number,
  'earningName': string
  'earing': number,
  'month': number,
  'year': number,
  'isActive': null,
  'createdBy': null,
  'createdOn': null,
  'createdByName': null,
  'monthalySalaryId': null
}
export interface SalaryDeductions {
  'id': number,
  'empId': number,
  'deductionId': number,
  'deductionName': string
  'deduction': number,
  'month': number,
  'year': number,
  'isActive': null,
  'createdBy': null,
  'createdOn': null,
  'createdByName': null,
  'monthalySalaryId': null
}

export interface LeaveStatus {
  id: number,
  leaveTypeId: number,
  leaveTypeName: 'PL' | 'SL',
  datTypeId: number,
  dayTypeName: string,
  sessionTypeId: number,
  sessionType: string,
  leaveFrom: string,
  leaveTill: string,
  appliedDate: string,
  leaveReason: string,
  leaveStatus: string
}

export interface HolidayList {
  id: number,
  empName: string,
  employeeCode: string,
  designationName: string,
  departmentName: string,
  empId: number,
  holidayId: number,
  name: string,
  holidayDate: string,
  approvedByName: null | string,
  createdByName: null | string,
  createdOn: string,
  isApproved: null | string,
  holidayType: number,
  approvedOn: null | string,
  status: string,
}


export interface PatrollerTask {
  taskId: number,
  taskName: string,
  chamberCount: number,
  taskChamberList: Chamber[],
  successTaskChamberList: Chamber[]
}

export interface Chamber {
  id: number,
  chamberId: string
  chamberName: string
  status: number,
  updatedOn: string
  chamberLat: string
  chamberLong: string
  chamberIdStr: string
  chamberAddress: string
  taskName: string
  distance: number
  isVisited: boolean
}
export interface ChamberComplaint {
  id: number
  transactionNO: string
  typeId: number
  typeName: string
  typeOfWorkId: number
  typeOfWorkName: string
  priorityId: number
  priorityName: string
  workScope: string
  routeName: string
  fromChamberId: number
  fromChamberIdStr: string
  fromChamberName: string
  fromChamberLat: string
  fromChamberLon: string
  fromChamberGPSAddress: string
  toChamberId: null | string,
  toChamberIdStr: null | string,
  toChamberName: null | string,
  toChamberLat: null | string,
  toChamberLon: null | string,
  toChamberGPSAddress: null | string,
  uploadFile: string
  landMark: null | string,
  mode: string
  ticketId: null | string,
  remark: string
  lat: string
  lon: string
  gpsAddress: string
  employeeId: number
  employeeName: string
  companyCode: string
  companyId: number
  createdOn: string
  createdByName: string
  employeeCode: string
  designation: string
  hrmsFomZoneName: string
  hrmsToZoneName: null,
  hrmsFromZoneId: number
  hrmsToZoneId: number
}

export interface NearestChamber {
  'distance': number
  'chamberNo': number
  'id': number
  'route_id_int': number
  'route_id': string
  'route_name': string
  'chamber_id': string
  'chamber_name': string
  'zone_id': null | number,
  'enclouser_id': number
  'enclouser_id_str': null | string,
  'chamber_type': string
  'chamber_longitude': string
  'chamber_latitude': string
  'chamber_location': string
  'order_no': number
  'landmark': string
  'start_point': string
  'duct_stand_on_chamber': string
  'hrms_zone_id': null | string,
  'hrms_zone_name': null | string,
  'chamber_address': null | string,
  'is_active': null | string,
  'zone_name': null | string,
  'dayPatroller': null | string,
  'nightPatroller': null | string,
  'zone_map_status': null | string
}
export interface UpdateMobileLocation {
  token: string;
  employeeID: string;
  address: string;
  batteryStatus: string;
  delay: string;
  dateTime: string;
  distance: string;
  // dutyStatus: string;
  latitude: string;
  longitude: string;
  companyId: string;
}