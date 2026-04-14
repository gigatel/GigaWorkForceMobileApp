//dev_base_url
export const BASE_URL ='http://mob.gigatel.me:60202/api/';//for login
export const BASE_URL2 = 'http://mob.gigatel.me:60201/api/';//for location
export const BASE_URL3 = 'http://mob.gigatel.me:60203/api/';// for tickets
// //prod_base_url
// export const BASE_URL ='http://tech1.gigatel.work:60202/api/';//for login
// export const BASE_URL2 = 'http://tech1.gigatel.work:60201/api/';//for location
// export const BASE_URL3 = 'http://tech1.gigatel.work:60203/api/';// for tickets
//local_base_url
// export const BASE_URL = 'http://10.0.0.65:60202/api/';//for login
// export const BASE_URL2 = 'http://10.0.0.65:60204/api/';//for location
// export const BASE_URL3 = 'http://10.0.0.65:60203/api/';// for tickets
//! Account
export const getPwdEncription = BASE_URL + 'Account/GetPwdEncriptionKeyForUser';
// export const getOtp = BASE_URL + 'Account/GetOtp2';
export const getOtp = BASE_URL + 'Account/GetOtp2';
export const verifyLogin = BASE_URL + 'Account/AppLogin';
//location_Api
export const postLocationAPI = BASE_URL2 + 'Location/PostLocation';
//dashboardListApi
export const getDashboardList = BASE_URL + 'AppDashboard/DashboardList2';
//Tickets
export const getComplaintsDate = BASE_URL3 + 'Complaint/GetEmpComplaintsByDate';
export const getComplaintsDetail = BASE_URL3 + 'Complaint/GetMobComplaintDetailById';
export const followUpComplaint = BASE_URL3 + 'Complaint/ComplaintFollowUps';
export const removefollowUpComplaint = BASE_URL3 + 'Complaint/ComplaintClosedBySplicer';
export const acknowledgement = BASE_URL3 + 'Complaint/AcknowledgeComplaintStatus';
export const travelStart = BASE_URL3 + 'Complaint/StartVehicleStatus';
export const travelStop = BASE_URL3 + 'Complaint/StopVehicleStatus';
export const HoldTicket = BASE_URL3 + 'Complaint/HoldTicketStatus';
//getRfolistApi
export const getRFOList = BASE_URL + 'RFO/GetRFOList';
export const selectCompany = BASE_URL + 'Account/SelectCompany';
export const getEmpDeviceList = BASE_URL + 'Account/GetEmpDeviceList';
export const dashboardList = BASE_URL + 'AppDashboard/DashboardList2';
export const getAppModules = BASE_URL + 'Policy/GetUserModuleAppModules?';
//! Attendance
export const viewAttendance = BASE_URL + 'Attendance/ViewAttendance';
export const viewAttendanceInOutReport = BASE_URL + 'Attendance/ViewInOutReport';
export const todayAttendance = BASE_URL + 'Attendance/TodayAttendance';
export const getTodayWorkingOnBehalf = BASE_URL + 'Attendance/GetTodayWorkingOnBehalf';
export const getEmpZoneChambers = BASE_URL + 'Zone/GetEmpZoneChambers';
export const getEmpOfficeBranches = BASE_URL + 'Branch/GetEmpBranches';
export const markAttendance = BASE_URL + 'Attendance/MarkAttendance';
export const syncOfflineAttendance = BASE_URL + 'Attendance/SyncOfflineAttendance';
//! Payroll₹
export const monthlyEmpSalary = BASE_URL + 'EmpSalary/MonthalyEmpSalary';
export const apiURLS = BASE_URL + '';
//! Holidays | Contacts
export const getHolidayList = BASE_URL + 'Holiday/GetEmpOptionalHoliday';
export const insertUpdateEmpHolidayRequest = BASE_URL + 'Holiday/InsertUpdateEmpHolidayRequest';
export const getEmployeeListContact = BASE_URL + 'Employee/GetEmployeeListForContact';
//! Leave
export const leaveStatus = BASE_URL + 'LeaveMaster/LeaveStatus';
export const getEmpBalanceLeaves = BASE_URL + 'LeaveType/GetEmpBalanceLeaves';
export const getEmployeeLeaveRequestPaggi = BASE_URL + 'LeaveType/GetEmployeeLeaveRequestPaggi';
export const insertUpdateEmpLeaveRequest = BASE_URL + 'LeaveType/InsertUpdateEmpLeaveRequest';
export const getEmployeeLeaveTyepDd = BASE_URL + 'LeaveType/GetEmployeeLeaveTyepDd';
//! Employee
export const getEmployeeListForContact = BASE_URL + 'Employee/GetEmployeeListForContact';
export const updateMobileAddress = BASE_URL + 'Employee/UpdateMobileAddress';
//! Patroller Task        
//ticket_status_update_api
