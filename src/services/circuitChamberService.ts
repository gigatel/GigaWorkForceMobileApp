// src/services/circuitChamberService.ts
import {Common, Preferences} from '@utils';
import {ApiResponse} from 'src/types/data-types';
import {APIs} from '../apis';

const API_ENDPOINTS = {
  GTPL_SUPPORT: {
    BASE_URL: 'http://mob.gigatel.me:40501/api/',
    GET_CUSTOMER_LIST: 'Customer/GetCustomerList',
    GET_CIRCUIT_INFO: 'CircuitInfo/GetCircuitInfoByCustomerId',
    GET_CHAMBERS_BY_CIRCUIT: 'Chamber/GetChambersByCircuitId',
    UPDATE_CIRCUIT_INFO: 'CircuitInfo/UpdateCircuitInfo',
  },
  GIGATEL_MAIN: {
    BASE_URL: 'http://mob.gigatel.me:60104/api/',
    GET_NEAREST_CHAMBERS: 'Chamber/GetNearestChambersList',
    GET_CHAMBERS_BY_CIRCUIT: 'CircuitInfo/GetChambersByCircuitId',
    },
};

// Types
interface CustomerResponse {
  id: string;
  name: string;
  // Add other customer fields as needed
}

interface CircuitResponse {
  id: string;
  name: string;
  customerId: string;
  // Add other circuit fields as needed
}

interface ChamberResponse {
  id: string;
  name: string;
  distance: number;
  // Add other chamber fields as needed
}

interface UpdateCoreRequest {
  chamberId: string;
  core1: string;
  core2: string;
  tube: string;
  // Add other update fields as needed
}

class CircuitChamberService {
  private getEmployeeData() {
    try {
      const loginResponse = Preferences.getData('LOGIN_RESPONSE');
      return {
        empId: loginResponse.employeeId,
        companyId: loginResponse.companyId,
        userId: loginResponse.userId,
        fullName: loginResponse.UserFullName,
      };
    } catch (error) {
      Common.error('❌ Error getting employee data:', error);
      throw error;
    }
  }

  // Get Customer List API
  async getCustomerList(): Promise<ApiResponse> {
    try {
      const token = Preferences.getData('API_AUTH_TOKEN');
      const response = await APIs.postRequestWithJson({
        path: `${API_ENDPOINTS.GTPL_SUPPORT.BASE_URL}${API_ENDPOINTS.GTPL_SUPPORT.GET_CUSTOMER_LIST}`,
        params: {
          authentication_token: token,
        },
        isAuth: true,
      });

      return {
        success: response.status === '200',
        status: response.status || 500,
        message: response.message || 'Customer list fetched successfully',
        data: response.data || [],
      };
    } catch (error: any) {
      Common.error('❌ Get Customer List Error:', error);
      return {
        success: false,
        status: 500,
        message: error?.message || 'Failed to fetch customer list',
        data: null,
      };
    }
  }

  // Get Circuit List by Customer ID
  async getCircuitList(customerId: string): Promise<ApiResponse> {
    try {
      const token = Preferences.getData('API_AUTH_TOKEN');
      const response = await APIs.postRequestWithJson({
        path: `${API_ENDPOINTS.GTPL_SUPPORT.BASE_URL}${API_ENDPOINTS.GTPL_SUPPORT.GET_CIRCUIT_INFO}`,
        params: {
          authentication_token: token,
          customer_id: customerId,
        },
        isAuth: true,
      });
      return {
        success: response.status === '200',
        status: response.status || 500,
        message: response.message || 'Circuit list fetched successfully',
        data: response.data || [],
      };
    } catch (error: any) {
      Common.error('❌ Get Circuit List Error:', error);
      return {
        success: false,
        status: 500,
        message: error?.message || 'Failed to fetch circuit list',
        data: null,
      };
    }
  }

  // Get Chamber List by Circuit ID
  async getCircuitChamberInfo(circuitId: string): Promise<ApiResponse> {
    try {
      const token = 'azbycxdwevfu';
      const response = await APIs.postRequestWithJson({
        path: `${API_ENDPOINTS.GIGATEL_MAIN.BASE_URL}${API_ENDPOINTS.GIGATEL_MAIN.GET_CHAMBERS_BY_CIRCUIT}`,
        params: {
          authentication_token: token,
          circuitId: circuitId,
        },
        isAuth: true,
      });

      console.log('🔑 Circuit Chamber Info Response:', response?.ChamberList);
      return {
        success: response.status === '200',
        status: response.status || 500,
        message: response.message || 'Chamber list fetched successfully',
        data: response.data || [],
      };
    } catch (error: any) {
      Common.error('❌ Get Chamber List Error:', error);
      return {
        success: false,
        status: 500,
        message: error?.message || 'Failed to fetch chamber list',
        data: null,
      };
    }
  }

  // Update Core Information
  async updateCoreInfo(updateData: UpdateCoreRequest): Promise<ApiResponse> {
    try {
      const employeeData = this.getEmployeeData();
      const token = Preferences.getData('API_AUTH_TOKEN');
      const response = await APIs.postRequestWithJson({
        path: `${API_ENDPOINTS.GTPL_SUPPORT.BASE_URL}${API_ENDPOINTS.GTPL_SUPPORT.UPDATE_CIRCUIT_INFO}`,
        params: {
          authentication_token: token,
          ...updateData,
          empId: employeeData.empId,
        },
        isAuth: true,
      });

      return {
        success: response.status === '200',
        status: response.status || 500,
        message: response.message || 'Core information updated successfully',
        data: response.data,
      };
    } catch (error: any) {
      Common.error('❌ Update Core Info Error:', error);
      return {
        success: false,
        status: 500,
        message: error?.message || 'Failed to update core information',
        data: null,
      };
    }
  }

  // Get Nearest Chambers
  async getNearestChambers(
    latitude: number,
    longitude: number,
    range: number = 1000,
  ): Promise<ApiResponse> {
    try {
      const token = Preferences.getData('API_AUTH_TOKEN');
      const response = await APIs.postRequestWithJson({
        path: `${API_ENDPOINTS.GIGATEL_MAIN.BASE_URL}${API_ENDPOINTS.GIGATEL_MAIN.GET_NEAREST_CHAMBERS}`,
        params: {
          authentication_token: token,
          lat: latitude,
          lng: longitude,
          //   range: range,
        },
        isAuth: true,
      });

      return {
        success: response.status === '200',
        status: response.status || 500,
        message: response.message || 'Nearest chambers fetched successfully',
        data: response.data || [],
      };
    } catch (error: any) {
      Common.error('❌ Get Nearest Chambers Error:', error);
      return {
        success: false,
        status: 500,
        message: error?.message || 'Failed to fetch nearest chambers',
        data: null,
      };
    }
  }

  // Get Chamber Distance List
  async getChamberDistanceList(circuitId: string): Promise<ApiResponse> {
    try {
      const token = Preferences.getData('API_AUTH_TOKEN');
      const response = await APIs.postRequestWithJson({
        path: `${API_ENDPOINTS.GTPL_SUPPORT.BASE_URL}/Chamber/GetChamberDistanceList`,
        params: {
          authentication_token: token,
          circuitId: circuitId,
        },
        isAuth: true,
      });

      return {
        success: response.status === '200',
        status: response.status || 500,
        message:
          response.message || 'Chamber distance list fetched successfully',
        data: response.data || [],
      };
    } catch (error: any) {
      Common.error('❌ Get Chamber Distance List Error:', error);
      return {
        success: false,
        status: 500,
        message: error?.message || 'Failed to fetch chamber distance list',
        data: null,
      };
    }
  }

  // Update Chamber Core Values
  async updateChamberCoreValues(
    chamberId: string,
    core1Value: string,
    core2Value: string,
    tubeValue: string,
  ): Promise<ApiResponse> {
    try {
      const employeeData = this.getEmployeeData();
      const token = Preferences.getData('API_AUTH_TOKEN');
      const response = await APIs.postRequestWithJson({
        path: `${API_ENDPOINTS.GTPL_SUPPORT.BASE_URL}/Chamber/UpdateChamberCoreValues`,
        params: {
          authentication_token: token,
          chamberId: chamberId,
          core1: core1Value,
          core2: core2Value,
          tube: tubeValue,
          empId: employeeData.empId,
        },
        isAuth: true,
      });

      return {
        success: response.status === '200',
        status: response.status || 500,
        message: response.message || 'Chamber core values updated successfully',
        data: response.data,
      };
    } catch (error: any) {
      Common.error('❌ Update Chamber Core Values Error:', error);
      return {
        success: false,
        status: 500,
        message: error?.message || 'Failed to update chamber core values',
        data: null,
      };
    }
  }
}

export const circuitChamberService = new CircuitChamberService();
