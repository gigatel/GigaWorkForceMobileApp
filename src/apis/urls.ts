// export const BASE_URL ='http://mob.gigatel.me:60202/api/';//for login
// export const BASE_URL2 = 'http://mob.gigatel.me:60201/api/';//for location
// export const BASE_URL3 = 'http://mob.gigatel.me:60203/api/';// for tickets
export const BASE_URL ='http://tech1.gigatel.work:60202/api/';//for login
export const BASE_URL2 = 'http://tech1.gigatel.work:60201/api/';//for location
export const BASE_URL3 = 'http://tech1.gigatel.work:60203/api/';// for tickets
//Base_url prod
//! Account
export const getPwdEncription = BASE_URL + 'Account/GetPwdEncriptionKeyForUser';
export const getOtp = BASE_URL + 'Account/GetOtp2';
export const verifyLogin = BASE_URL + 'Account/AppLogin';
//location_Api
export const postLocationAPI= BASE_URL2 + 'Location/PostLocation';
//dashboardListApi
export const getDashboardList = BASE_URL + 'AppDashboard/DashboardList2';
//Tickets
export const getComplaintsDate = BASE_URL3 + 'Complaint/GetEmpComplaintsByDate';
export const getComplaintsDetail = BASE_URL3 + 'Complaint/GetMobComplaintDetailById';
export const followUpComplaint = BASE_URL3 + 'Complaint/ComplaintFollowUps';
export const removefollowUpComplaint = BASE_URL3 + 'Complaint/ComplaintClosedBySplicer';
