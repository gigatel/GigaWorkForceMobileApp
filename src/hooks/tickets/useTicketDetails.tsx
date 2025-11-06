import {Common} from '@utils';
import {useEffect, useState} from 'react';
import {ticketService} from '../../services';
import {TicketDetailsData} from 'src/types/ticket.types';

export const useTicketDetails = (ticketId: string) => {
  const [ticketDetails, setTicketDetails] = useState<TicketDetailsData | null>(
    null,
  );
  const [followUps, setFollowUps] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadTicketDetailsFromAPI = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await ticketService.getComplaintById(ticketId);

      Common.log('Ticket Details Response:', response);

      if (response.success && response.data) {
        const mappedData: TicketDetailsData = {
          id: response.data.id || ticketId,
          transactionNo: response.data.transactionNo || '',
          customerName: response.data.customerName || '',
          circuitId: response.data.circuitId || '',
          circuitFrom: response.data.circuitFrom || '',
          circuitTo: response.data.circuitTo || '',
          natureOfFault: response.data.natureOfFault || '',
          status: response.data.status || 'assigned',
          contactPersonName: response.data.contactPersonName || '',
          contactPersonMobile: response.data.contactPersonMobile || '',
          assignedTo: response.data.assignedTo || '',
          assignedBy: response.data.assignedBy || '',
          createdDate: response.data.assignedDate || '',
          remark: response.data.remark || '',
          nocRemark: 'test',
          closureRemark: '',
          rfo: response.data.rfo,
          priority: response.data.priority || 'medium',
          company: 'Gigatel',
          isStarted: response.data.isStarted || false,
          assignedTaskId: response.data.assignedTaskId || 0,
          otdrLength: '',
          modeOfComplaint: '',
          irAttachment: response.data.irAttachment || '',
          fields: response.data.fields || [],
        };
        console.log(mappedData, 'mappedDataonTicketDetails:');

        setTicketDetails(mappedData);

        if (response.followUps) {
          setFollowUps(response.followUps);
        }
      } else {
        setError('Ticket details not found');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load ticket details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTicketDetailsFromAPI();
  }, [ticketId]);

  const refetch = () => {
    loadTicketDetailsFromAPI();
  };

  return {
    ticketDetails,
    followUps,
    error,
    loading,
    refetch,
  };
};
