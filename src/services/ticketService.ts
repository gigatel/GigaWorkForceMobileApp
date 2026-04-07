// src/services/ticketService.ts - ENHANCED with Issue Types
import {APIs, URLs} from '../apis';
import {Common, Preferences} from '@utils';
import axios from 'axios';
import {getAddressFromCoordinates, postRequestWithJson} from '../apis/apis';
import {BASE_URL, BASE_URL_2, BASE_URL_4, BASE_URL_6} from '../apis/urls';
import {ApiResponse, GeoLocation} from 'src/types/data-types';
import {
  FollowUpDataGtpl,
  GetTicketsRequest,
  ParsedFormData,
  RawTicketData,
  TicketAPIResponse,
  TicketData,
  TicketDataGtpl,
} from '../types/ticket.types';
import {
  BasicFollowUpPayload,
  FollowUpWithIssuePayload,
  IssueTypesResponse,
  IssueWorkTypesResponse,
} from '../types/issue-type';

const API_ENDPOINTS = {
  GTPL_SUPPORT: {
    BASE_URL: BASE_URL_4,
    ADD_FOLLOW_UP: 'Complaint/AddFollowUps',
    GET_FOLLOW_UP_LIST: 'Tickets/FollowUpList',
    GET_COMPLAINT_BY_ID: 'Complaint/GetComplaintById',
  },
  GTPL_FLEET: {
    BASE_URL: BASE_URL_2,
    ADD_COMPLAINT_FOLLOW_UP: 'Complaint/AddComplaintFollowUp',
    GET_TYPE_DD: 'TypeOfWork/GetTypeDD',
    GET_TYPE_OF_WORK_DD: 'TypeOfWork/GetTypeOfWorkDD',
  },
  GIGATEL_MAIN: {
    BASE_URL: BASE_URL_6,
    GET_NEAREST_CHAMBERS: 'Chamber/GetNearestChambersList',
  },
};

class TicketService {
  public getEmployeeData() {
    try {
      const authToken = Preferences.getData('API_AUTH_TOKEN');
      const loginResponse = Preferences.getData('LOGIN_RESPONSE');

      console.log('loginResponse', loginResponse);

      return {
        empId: loginResponse.employeeId,
        companyId: loginResponse.companyId,
        userId: loginResponse.userId,
        fullName: loginResponse.UserFullName,
      };
    } catch (error) {
      Common.error('❌ Error parsing JWT token:', error);
      throw error;
    }
  }

  private parseFormData(dataString: string): ParsedFormData {
    try {
      const formFields = JSON.parse(dataString);
      const parsed: any = {};

      // Map to final output
      const finalOutput = formFields.map((f: any) => ({
        fieldId: f.FieldId,
        fieldKey: f.FieldIdStr,
        label: f.LableName,
        value: f.Value, // prefer ValueStr if 
        type: f.Type,
      }));

      formFields.forEach((field: any) => {
        switch (field.FieldIdStr) {
          case 'customer_name':
            parsed.customerName = field.ValueStr || field.Value || '';
            break;
          case 'circuit_id_with_name':
            parsed.circuitId = field.Value || field.ValueStr || '';
            break;
          case 'circuit_from':
            parsed.circuitFrom = field.Value || '';
            break;
          case 'circuit_to':
            parsed.circuitTo = field.Value || '';
            break;
          case 'otdr_length':
            parsed.otdrLength = field.Value || '';
            break;
          case 'nature_of_fault':
            parsed.natureOfFault = field.ValueStr || field.Value || '';
            break;
          case 'mode_of_complaint':
            parsed.modeOfComplaint = field.ValueStr || field.Value || '';
            break;
          case 'field_2':
            parsed.contactPersonName = field.Value || '';
            break;
          case 'field_3':
            parsed.contactPersonMobile = field.Value || '';
            break;
          case 'remark':
            parsed.remark = field.Value || '';
            break;
          case 'otdr_available':
            parsed.otdrAvailable = field.ValueStr || field.Value || '';
            break;

          case 'ir_attachment':
            parsed.irAttachment = field.Value || '';
            break;
        }
      });

      parsed.fields = finalOutput;
      return parsed as ParsedFormData;
    } catch (error) {
      Common.error('Error parsing form data:', error);
      return {} as ParsedFormData;
    }
  }
  async addBasicFollowUp(
    payload: BasicFollowUpPayload,
    location: GeoLocation,
  ): Promise<ApiResponse> {
    try {
      const address =
        (await getAddressFromCoordinates(
          location.coords.latitude,
          location.coords.longitude,
        )) || `${location.coords.latitude}, ${location.coords.longitude}`;

      const requestData = {
        ...payload,
        lat: location.coords.latitude.toString(),
        lng: location.coords.longitude.toString(),
        address,
      };

      Common.log('🚀 Phase 1: Basic Follow-up', requestData);

      const response = await postRequestWithJson({
        path: `${API_ENDPOINTS.GTPL_SUPPORT.BASE_URL}${API_ENDPOINTS.GTPL_SUPPORT.ADD_FOLLOW_UP}`,
        params: requestData,
        isAuth: true,
        checkNetSpeed: false,
      });

      return {
        success: response.status === '200',
        status: response.status || 500,
        message: response.message || 'Basic follow-up submitted',
        data: response.data,
      };
    } catch (error: any) {
      Common.error('❌ Basic Follow-up Error:', error);
      return {
        success: false,
        status: 500,
        message:
          (error?.message as string) || 'Failed to submit basic follow-up',
        data: null,
      };
    }
  }

  // Phase 2: Follow-up with Issues (Conditional - only if issues found)
  async addComplaintFollowUpWithIssue(
    payload: FollowUpWithIssuePayload,
    location: GeoLocation,
  ): Promise<ApiResponse> {
    try {
      const requestData = {
        ...payload,
        lat: location.coords.latitude.toString(),
        lng: location.coords.longitude.toString(),
        gpsLocation: `${location.coords.latitude},${location.coords.longitude}`,
      };

      Common.log('🔧 Phase 2: Issue Follow-up', requestData);

      const response = await postRequestWithJson({
        path: `${BASE_URL}${API_ENDPOINTS.GTPL_SUPPORT.ADD_FOLLOW_UP}`,
        params: requestData,
        isAuth: true,
        checkNetSpeed: false,
      });

      return {
        success: response.status === '200' && response.success,
        status: response.status || 500,
        message: response.message || 'Issue follow-up submitted',
        data: response.data,
      };
    } catch (error: any) {
      Common.error('❌ Issue Follow-up Error:', error);
      return {
        success: false,
        status: 500,
        message: (error?.message as string) || 'Failed to submit issue details',
        data: null,
      };
    }
  }

  // ✅ Enhanced transformation with chamber detection
  private transformTicketData(rawTicket: RawTicketData): TicketData {
    Common.log('🔍 rawTicket:', rawTicket);
    const formData = this.parseFormData(rawTicket.data);

    // ✅ Detect task type and chambers
    const ticketType =
      rawTicket.moduleName === 'COMPLAINTS' ? 'complaint' : 'task';
    let taskType: 'circuit' | 'route' | 'miscellaneous' | undefined;
    let hasChamber = false;
    let chamberCount = 0;

    if (ticketType === 'task') {
      // Analyze route data for chambers
      if (rawTicket.routeData && rawTicket.routeData !== '[]') {
        try {
          const routeData = JSON.parse(rawTicket.routeData);
          if (Array.isArray(routeData)) {
            chamberCount = routeData.length;
            hasChamber = chamberCount > 0;
            taskType = 'route';
          }
        } catch (e) {
          Common.log('Error parsing route data');
        }
      }

      // Check circuit chamber data
      if (
        rawTicket.circuitChamberData &&
        rawTicket.circuitChamberData !== '[]'
      ) {
        try {
          const circuitData = JSON.parse(rawTicket.circuitChamberData);
          chamberCount = 1;
          hasChamber = true;
          taskType = 'circuit';
        } catch (e) {
          Common.log('Error parsing circuit chamber data');
        }
      }

      // Default to miscellaneous if no chamber data
      if (!taskType) {
        taskType = 'miscellaneous';
      }
    }

    return {
      id: rawTicket.id.toString(),
      ticketNo: rawTicket.transactionNo,
      transactionNo: rawTicket.transactionNo,
      description: formData.remark || 'No description available',
      assignedDate: rawTicket.assignedOn,
      priority: this.determinePriority(formData.natureOfFault),
      status: this.mapStatus(rawTicket.status),
      customerName: formData.customerName || 'Unknown Customer',
      customerMobile: formData.contactPersonMobile || '',
      ticketType: ticketType,

      // ✅ Enhanced task fields
      taskType: taskType,
      hasChamber: hasChamber,
      chamberCount: chamberCount,

      // Location
      circuitFrom: formData.circuitFrom || '',
      circuitTo: formData.circuitTo || '',
      circuitId: formData.circuitId || '',

      // Assignment
      assignedTo: rawTicket.assignedTo || '',
      assignedBy: rawTicket.assignedByName || '',

      // Contact
      contactPersonName: formData.contactPersonName || '',
      contactPersonMobile: formData.contactPersonMobile || '',

      // Technical
      natureOfFault: formData.natureOfFault || '',
      modeOfComplaint: formData.modeOfComplaint || '',
      otdrLength: formData.otdrLength || '',
      remark: formData.remark || '',

      // Status
      isStarted: rawTicket.isStartedByEmp || false,
      startTime: rawTicket.ticketStartTime,
      endTime: rawTicket.ticketEndTime,

      // Raw data
      rawData: rawTicket,
      formData: formData,
    };
  }

  private determinePriority(natureOfFault: string): 'high' | 'medium' | 'low' {
    const faultLower = natureOfFault?.toLowerCase() || '';
    if (
      faultLower.includes('cut') ||
      faultLower.includes('down') ||
      faultLower.includes('outage')
    ) {
      return 'high';
    }
    if (
      faultLower.includes('slow') ||
      faultLower.includes('intermittent') ||
      faultLower.includes('partial')
    ) {
      return 'medium';
    }
    return 'low';
  }

  private mapStatus(
    apiStatus: string,
  ): 'assigned' | 'in-progress' | 'completed' | 'closed' {
    switch (apiStatus?.toLowerCase()) {
      case 'assigned':
        return 'assigned';
      case 'in progress':
      case 'inprogress':
      case 'started':
        return 'in-progress';
      case 'completed':
      case 'finished':
        return 'completed';
      case 'closed':
        return 'closed';
      default:
        return 'assigned';
    }
  }

  async getTickets(request: Partial<GetTicketsRequest> = {}) {
    try {
      const employeeData = this.getEmployeeData();
      console.log('employeeData', employeeData);
      console.log('request', request);
      const requestPayload: GetTicketsRequest = {
        moduleName: 'COMPLAINTS',
        ...request,
        formId: 1,
        empId: employeeData.empId,
        date: request.date || '2025-08-13',
        companyId: employeeData.companyId,
      };

      Common.log('🎫 API Request:', requestPayload);

      const response = (await postRequestWithJson({
        path: URLs.getEmpComplaintsOfDate,
        params: requestPayload,
        isAuth: true,
      })) as TicketAPIResponse;

      Common.log('🎫 API Response:', response);

      if (response && response.data && Array.isArray(response.data)) {
        const transformedTickets = response.data.map(rawTicket =>
          this.transformTicketData(rawTicket),
        );

        return {
          status: 'success',
          message: `Loaded ${transformedTickets.length} tickets`,
          data: transformedTickets,
          success: true,
        };
      } else {
        return {
          status: 'error',
          message: 'No tickets found',
          data: [],
          success: false,
        };
      }
    } catch (error) {
      Common.error('❌ Get Tickets Error:', error);
      return {
        status: 'error',
        message: 'Failed to fetch tickets',
        data: [],
        success: false,
      };
    }
  }

  async getTicketDetails(ticketId: string) {
    try {
      const employeeData = this.getEmployeeData();

      // ✅ FIX: Proper URL construction without double ?id=
      const apiUrl = `${URLs.getComplaintById}?id=${ticketId}`;

      // ✅ FIX: Try GET request first (as per API spec)
      const response = await APIs.getRequestWithQuery({
        path: `Complaint/GetComplaintById?id=${ticketId}`,
        isAuth: true,
      });

      Common.log('🎫 Ticket Details Response:', response);

      if (response && response.data) {
        return {
          status: 'success',
          message: 'Ticket details loaded',
          data: this.transformTicketData(response.data),
          success: true,
        };
      } else {
        return {
          status: 'error',
          message: 'Ticket details not found',
          data: null,
          success: false,
        };
      }
    } catch (error: any) {
      Common.error('❌ Get Ticket Details Error:', error);

      // ✅ If GET fails, try POST as fallback
      try {
        const postResponse = await APIs.postRequestWithJson({
          path: `Complaint/GetComplaintById?id=${ticketId}`,
          params: {id: ticketId},
          isAuth: true,
        });

        if (postResponse && postResponse.data) {
          return {
            status: 'success',
            message: 'Ticket details loaded',
            data: this.transformTicketData(postResponse.data),
            success: true,
          };
        }
      } catch (postError) {
        Common.error('❌ POST fallback also failed:', postError);
      }

      return {
        status: 'error',
        message: 'Failed to fetch ticket details',
        data: null,
        success: false,
      };
    }
  }

  async getFollowUps(ticketId: string) {
    try {
      const employeeData = this.getEmployeeData();

      const requestPayload = {
        empId: employeeData.empId,
        ticketId: ticketId,
      };

      const response = await APIs.postRequestWithJson({
        path: 'Tickets/FollowUpList',
        params: requestPayload,
        isAuth: true,
      });

      if (response && response.data && Array.isArray(response.data)) {
        return {
          status: 'success',
          message: `Loaded ${response.data.length} follow-ups`,
          data: response.data,
          success: true,
        };
      } else {
        return {
          status: 'success',
          message: 'No follow-ups found',
          data: [],
          success: true, // Don't fail if no follow-ups
        };
      }
    } catch (error) {
      Common.log('❌ Get Follow-ups Error (non-critical):', error);
      return {
        status: 'success', // Don't fail the whole screen
        message: 'Follow-ups not available',
        data: [],
        success: true,
      };
    }
  }

  // Get ticket details (matching getTicketDetailsGTPL)
  async getTicketDetailsGtpl(ticketId: string) {
    try {
      const response = await APIs.getRequestWithQuery({
        path: `Complaint/GetComplaintById?id=${ticketId}`,
        isAuth: true,
      });

      if (response?.data?.formData) {
        return {
          status: 'success',
          success: true,
          data: response.data.formData as TicketDataGtpl,
        };
      }

      return {status: 'error', success: false, data: null};
    } catch (error) {
      Common.error('Get ticket details error:', error);
      return {status: 'error', success: false, data: null};
    }
  }

  // Get follow-ups (matching followUpList)
  async getFollowUpsGtpl(ticketId: string) {
    try {
      const employeeData = this.getEmployeeData();
      const payload = {
        empId: employeeData.empId,
        ticketId: ticketId,
      };

      const response = await APIs.postRequestWithJson({
        path: 'Tickets/FollowUpList',
        params: payload,
        isAuth: true,
      });

      if (response?.data) {
        return {
          status: 'success',
          success: true,
          data: response.data as FollowUpDataGtpl[],
        };
      }

      return {status: 'error', success: false, data: []};
    } catch (error) {
      Common.error('Get follow-ups error:', error);
      return {status: 'error', success: false, data: []};
    }
  }

  // Get RFO reasons (matching getRfoList)
  async getRfoReasons() {
    try {
      const response = await APIs.getRequestWithQuery({
        path: 'RFOMaster/GetRFOMasterDD',
        isAuth: true,
      });
      if (response?.data) {
        return {
          success: true,
          data: response.data,
        };
      }
      return {success: false, data: []};
    } catch (error) {
      Common.error('Get RFO reasons error:', error);
      return {success: false, data: []};
    }
  }
  // Update RFO status (matching updateRfoStatus)
  async updateRfoStatus(
    ticketId: string,
    rfoId: string,
    comment: string,
    status: string = 'Task Complete',
  ) {
    try {
      const employeeData = this.getEmployeeData();
      const payload = {
        rfoId: rfoId,
        formDataId: ticketId,
        comment: comment,
        status: status,
        empId: employeeData.empId,
      };

      const response = await APIs.postRequestWithJson({
        path: 'Complaint/UpdateTaskRFO',
        params: payload,
        isAuth: true,
      });

      if (response?.status === '200') {
        return {
          success: true,
          message: 'Status updated successfully',
        };
      }

      return {success: false, message: 'Failed to update status'};
    } catch (error) {
      Common.error('Update RFO status error:', error);
      return {success: false, message: 'Failed to update status'};
    }
  }

  // If fetch works, update your service
  async getComplaintById(ticketId: string) {
    console.log('ticketIdData',{ticketId})
    try {
      Common.log(`🎫 Fetching complaint by ID: ${ticketId}`);

      // ✅ Try with direct fetch first (for debugging)
      const directResponse = await fetch(
        `http://mob.giagtel.me:60203/api/Complaint/GetComplaintById?id=${ticketId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${Preferences.getData('API_AUTH_TOKEN')}`, // Use your auth token
            // Add auth headers if needed from Preferences
          },
        },
      );

      const data = await directResponse.json();
      Common.log('✅ Direct fetch success:', data);

      if (data && data.success && data.data && data.data.formData) {
        const formData = data.data.formData;
        console.log('🔍 data:', data);
        const taskStatusHistories = (data?.data?.taskStatusHistories || []) as {
          empId: number;
          remark: string;
          status: string;
          statusUpdatedByName: string;
          statusUpdatedOn: string;
        }[];

        Common.log('🔍 taskStatusHistories:', taskStatusHistories);
        // get latest task status history based on statusUpdatedOn
        const latestTaskStatusHistory = taskStatusHistories.sort(
          (a, b) =>
            new Date(b.statusUpdatedOn).getTime() -
            new Date(a.statusUpdatedOn).getTime(),
        )[0];
        Common.log('🔍 latestTaskStatusHistory:', latestTaskStatusHistory);
        const status = latestTaskStatusHistory?.status || 'assigned';
        const inProgressDate = taskStatusHistories.find(
          item => item.status === 'In Progress',
        )?.statusUpdatedOn;
        const completedDate = taskStatusHistories.find(
          item => item.status === 'Completed',
        )?.statusUpdatedOn;
        const closedDate = taskStatusHistories.find(
          item => item.status === 'Closed',
        )?.statusUpdatedOn;
        const parsedFormFields = this.parseFormData(formData.data);

        const ticketData = {
          id: formData.id.toString(),
          transactionNo: formData.transactionNo,
          customerName: parsedFormFields.customerName || '',
          circuitId: parsedFormFields.circuitId || '',
          circuitFrom: parsedFormFields.circuitFrom || '',
          circuitTo: parsedFormFields.circuitTo || '',
          natureOfFault: parsedFormFields.natureOfFault || '',
          status: status,
          assignedTaskId: formData.assignTaskId,
          contactPersonName: parsedFormFields.contactPersonName || '',
          contactPersonMobile: parsedFormFields.contactPersonMobile || '',
          assignedTo: formData.assignedTo || '',
          assignedBy: formData.assignedByName || '',
          assignedDate: formData.assignedOn || '',
          remark: parsedFormFields.remark || '',
          priority: this.determinePriority(parsedFormFields.natureOfFault),
          isStarted: inProgressDate ? true : false,
          inProgressDate: inProgressDate,
          completedDate: completedDate,
          closedDate: closedDate,
          rfo: formData.rfo || '',
          irAttachment: parsedFormFields.irAttachment || '',
          fields: parsedFormFields.fields || [],
        };

        return {
          status: 'success',
          data: ticketData,
          success: true,
          followUps: data.data.followUps || [],
        };
      }

      throw new Error('Invalid response structure');
    } catch (error: any) {
      Common.error('❌ GetComplaintById Error:', error);
      return {
        status: 'error',
        message: 'Failed to fetch complaint details',
        success: false,
      };
    }
  }

  async getNearestChambers(
    companyCode = 'GTPL',
    latitude?: number,
    longitude?: number,
    range?: number,
  ) {
    const url =
      'http://mob.giagtel.me:60203/api/TicketDropDown/GetNearestChambers';

    const params = {companyCode, latitude, longitude, range}; // फिलहाल बस इतना
    const token = Preferences.getData('API_AUTH_TOKEN');
    Common.log('🔑 Token:', token);

    const axiosOpts: any = {params};
    if (token) {
      axiosOpts.headers = {Authorization: `Bearer ${token}`};
    }

    Common.log('➡️  Chamber params', params);

    const {data} = await axios.get(url, axiosOpts);
    Common.log('🔑 Axios opts:', axiosOpts);
    Common.log('⬅️  Chamber resp', data);

    return {
      success: data?.success === true,
      data: Array.isArray(data?.data) ? data.data.slice(0, 12) : [],
    };
  }

  // Add Follow-Up (with pictures)
  async addFollowUp(
    ticketId: string,
    chamberId: string,
    remark: string,
    images: string[],
    gpsLocation?: {lat: number; lng: number},
    selectedChamber?: any,
  ) {
    try {
      const emp = this.getEmployeeData();

      const requestPayload = {
        assignTaskId: parseInt(ticketId), // ✅ Number
        chamberId: parseInt(chamberId) || 0, // ✅ Number
        chamberIdStr: chamberId, // ✅ String version
        chamberName: selectedChamber?.name || 'Selected Chamber', // ✅ Required field
        address: selectedChamber?.address || 'Chamber Location', // ✅ Required field
        remark: remark,
        empId: parseInt(emp.empId), // ✅ Number
        lat: gpsLocation?.lat?.toString() || '28.6139', // ✅ String
        lng: gpsLocation?.lng?.toString() || '77.209', // ✅ String
        image:
          images.length > 0
            ? {
                imageData: images[0].includes('base64,')
                  ? images[0].split('base64,')[1]
                  : images[0], // ✅ Clean base64
                imageExtention: 'jpg',
              }
            : null,
      };

      Common.log('📝 Adding Follow-Up (Fixed):', requestPayload);

      const response = await fetch(
        'http://mob.giagtel.me:60203/api/Complaint/AddFollowUps', // ✅ Correct port
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${Preferences.getData('API_AUTH_TOKEN')}`,
          },
          body: JSON.stringify(requestPayload),
        },
      );

      if (!response.ok) {
        const txt = await response.text();
        throw new Error(`HTTP ${response.status}: ${txt.slice(0, 120)}…`);
      }

      const data = await response.json();
      Common.log('✅ Follow-Up success:', data);

      return {
        success: !!(data && data.success),
        message: data?.message || 'Follow-up added successfully',
        data: data?.data,
      };
    } catch (error: any) {
      Common.error('❌ Add Follow-Up Error:', error);
      return {
        success: false,
        message: 'Failed to add follow-up',
      };
    }
  }

  // ================================
  // 🏷️ ISSUE TYPES METHODS
  // ================================

  // Get issue categories (Chamber, Enclosure, Tiffin)
  async getTypeDD(): Promise<IssueTypesResponse> {
    try {
      Common.log('🏷️ Getting Issue Categories (TypeDD)');

      const res = await fetch(
        'http://mob.giagtel.me:40601/api/TypeOfWork/GetTypeDD',
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${Preferences.getData('API_AUTH_TOKEN')}`,
          },
        },
      );

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`HTTP ${res.status}: ${txt.slice(0, 120)}…`);
      }

      const data = await res.json();
      Common.log('✅ Issue Categories fetch success:', data);

      return {
        status: data?.status || '200',
        success: !!(data && data.success),
        data: data?.data ?? [],
        message: data?.message || 'Issue categories loaded successfully',
      };
    } catch (error: any) {
      Common.error('❌ Issue Categories Error:', error);
      return {
        status: '500',
        success: false,
        data: [],
        message: 'Failed to load issue categories',
      };
    }
  }

  // Get specific work types for a selected category
  async getTypeOfWorkDD(typeId: string): Promise<IssueWorkTypesResponse> {
    try {
      Common.log('🔧 Getting Work Types for category:', typeId);

      const res = await fetch(
        `http://mob.giagtel.me:40601/api/TypeOfWork/GetTypeOfWorkDD?id=${typeId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${Preferences.getData('API_AUTH_TOKEN')}`,
          },
        },
      );

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`HTTP ${res.status}: ${txt.slice(0, 120)}…`);
      }

      const data = await res.json();
      Common.log('✅ Work Types fetch success:', data);

      return {
        status: data?.status || '200',
        success: !!(data && data.success),
        data: data?.data ?? [],
        message: data?.message || 'Work types loaded successfully',
      };
    } catch (error: any) {
      Common.error('❌ Work Types Error:', error);
      return {
        status: '500',
        success: false,
        data: [],
        message: 'Failed to load work types',
      };
    }
  }

  // Add follow-up WITH issue details (when issue found = true)
  async addComplaintFollowUp(
    payload: FollowUpWithIssuePayload,
    gpsLocation?: {lat: number; lng: number},
    selectedChamber?: any,
  ) {
    try {
      const emp = this.getEmployeeData();

      const requestPayload = {
        complaintId: parseInt(payload.assignTaskId), // ✅ Field name changed
        chamberId: parseInt(payload.chamberId) || 0, // ✅ Number
        chamberIdStr: payload.chamberIdStr, // ✅ String
        isIssueFound: payload.isIssueFound, // ✅ Boolean
        issueCategory: payload.issueCategory
          ? parseInt(payload.issueCategory)
          : undefined, // ✅ Field name changed
        issueId: payload.issueId ? parseInt(payload.issueId) : undefined, // ✅ Field name changed
        complaintFollowImage: payload.complaintFollowImage || [], // ✅ Array format
        lat: payload.lat || gpsLocation?.lat?.toString() || '28.6139', // ✅ GPS coordinates
        lng: payload.lng || gpsLocation?.lng?.toString() || '77.209', // ✅ GPS coordinates
        gpsLocation:
          payload.gpsLocation ||
          `${gpsLocation?.lat || 28.6139}, ${gpsLocation?.lng || 77.209}`, // ✅ Combined GPS
        remark: payload.remark,
        employeeId: parseInt(emp.empId), // ✅ Employee ID
        companyCode: payload.companyCode || 'GTPL', // ✅ Company code
        createdOn: new Date().toISOString(), // ✅ Timestamp
        isOffline: false, // ✅ Offline status
      };

      Common.log('📝 Adding Complaint Follow-Up with Issue:', requestPayload);

      const res = await fetch(
        'http://mob.giagtel.me:60203/api/Complaint/AddComplaintFollowUp', // ✅ Correct port
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${Preferences.getData('API_AUTH_TOKEN')}`,
          },
          body: JSON.stringify(requestPayload),
        },
      );

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`HTTP ${res.status}: ${txt.slice(0, 120)}…`);
      }

      const data = await res.json();
      Common.log('✅ Complaint Follow-Up with Issue success:', data);

      return {
        success: !!(data && data.success),
        message: data?.message || 'Ticket started successfully',
        data: data?.data,
      };
    } catch (error: any) {
      Common.error('❌ Add Complaint Follow-Up with Issue Error:', error);
      return {
        success: false,
        message: 'Failed to add complaint follow-up with issue',
      };
    }
  }

  async getFollowUpList(ticketId: string) {
    try {
      Common.log('📋 Getting Follow-Up List for:', ticketId);

      const response = await fetch(
        `http://mob.giagtel.me:60203/api/Tickets/FollowUpList?ticketId=${ticketId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${Preferences.getData('API_AUTH_TOKEN')}`,
          },
        },
      );

      if (!response.ok) {
        const txt = await response.text();
        throw new Error(`HTTP ${response.status}: ${txt.slice(0, 120)}…`);
      }

      const data = await response.json();
      Common.log('✅ Follow-Up List success:', data);

      return {
        success: !!(data && data.success),
        message: data?.message || 'Follow-ups loaded',
        data: data?.data || [],
      };
    } catch (error: any) {
      Common.error('❌ Get Follow-Up List Error:', error);
      return {
        success: false,
        message: 'Failed to load follow-ups',
        data: [],
      };
    }
  }

  async getRFOMasterDD() {
    try {
      Common.log('📋 Getting RFO Master Dropdown...');

      const response = await fetch(
        'http://mob.giagtel.me:60203/api/RFOMaster/GetRFOMasterDD',
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${Preferences.getData('API_AUTH_TOKEN')}`,
          },
        },
      );

      if (!response.ok) {
        const txt = await response.text();
        throw new Error(`HTTP ${response.status}: ${txt.slice(0, 120)}…`);
      }

      const data = await response.json();
      Common.log('✅ RFO Master DD success:', data);

      return {
        success: !!(data && data.success),
        message: data?.message || 'RFO options loaded',
        data: data?.data || [],
      };
    } catch (error: any) {
      Common.error('❌ Get RFO Master DD Error:', error);
      return {
        success: false,
        message: 'Failed to load closure reasons',
        data: [],
      };
    }
  }

  async updateTaskRFO(payload: any) {
    try {
      const emp = this.getEmployeeData(); // Get employee data

      // ✅ Fixed payload structure according to swagger
      const requestPayload = {
        formDataId: parseInt(payload.ticketId), // ✅ Field name change
        rfoId: parseInt(payload.rfoId), // ✅ Number format
        comment: payload.closureRemarks, // ✅ Field name change
        status: payload.status, // ✅ Keep as is
        empId: parseInt(emp.empId), // ✅ Add employee ID
      };

      Common.log('🔒 Updating Task RFO (Fixed):', requestPayload);

      const response = await fetch(
        'http://mob.giagtel.me:60203/api/Complaint/UpdateTaskRFO',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${Preferences.getData('API_AUTH_TOKEN')}`,
          },
          body: JSON.stringify(requestPayload),
        },
      );

      if (!response.ok) {
        const txt = await response.text();
        throw new Error(`HTTP ${response.status}: ${txt.slice(0, 120)}…`);
      }

      const data = await response.json();
      Common.log('✅ Update Task RFO success:', data);

      return {
        success: !!(data && data.success),
        message: data?.message || 'Ticket closed successfully',
        data: data?.data,
      };
    } catch (error: any) {
      Common.error('❌ Update Task RFO Error:', error);
      return {
        success: false,
        message: 'Failed to close ticket',
      };
    }
  }

  async getOldIRList(ticketId: string) {
    try {
      const response = await fetch(
        'http://mob.giagtel.me:60203/api/Complaint/GetOldIRList',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ticketId}),
        },
      );
      console.log('response', response);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      return {
        success: true,
        data: data.data || data,
        message: 'Old IR list loaded successfully',
      };
    } catch (error: any) {
      console.error('Error fetching Old IR list:', error);
      return {
        success: false,
        data: [],
        message: error.message || 'Failed to load Old IR list',
      };
    }
  }

  async createNewIR(irData: any) {
    try {
      const response = await fetch(
        'http://mob.giagtel.me:60203/api/Complaint/CreateNewIR',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(irData),
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      return {
        success: true,
        data: data.data || data,
        message: 'New IR created successfully',
      };
    } catch (error: any) {
      console.error('Error creating New IR:', error);
      return {
        success: false,
        message: error.message || 'Failed to create New IR',
      };
    }
  }
}

export const ticketService = new TicketService();
