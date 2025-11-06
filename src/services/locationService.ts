import axios from 'axios';
import {updateMobileLocationUrl} from '../apis/urls';
import {UpdateMobileLocation} from '../types/data-types';

export const updateMobileLocation = async (payload: UpdateMobileLocation) => {
  console.log('updateMobileLocation', payload);
  
  const response = await axios.post(updateMobileLocationUrl, payload);
  return response.data;
};
