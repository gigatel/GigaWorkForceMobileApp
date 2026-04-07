//dev_base_url
// export const BASE_URL ='http://mob.gigatel.me:60202/api/';//for login
// export const BASE_URL2 = 'http://mob.gigatel.me:60201/api/';//for location
// export const BASE_URL3 = 'http://mob.gigatel.me:60203/api/';// for tickets
// //prod_base_url
export const BASE_URL ='http://tech1.gigatel.work:60202/api/';//for login
export const BASE_URL2 = 'http://tech1.gigatel.work:60201/api/';//for location
export const BASE_URL3 = 'http://tech1.gigatel.work:60203/api/';// for tickets
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
//ticket_status_update_api
