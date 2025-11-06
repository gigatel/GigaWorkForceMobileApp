import Geolocation from '@react-native-community/geolocation';
import {useEffect, useState} from 'react';
import {FollowUpWithIssuePayload, GeoLocation} from '../../types/issue-type';
import {showToast} from '../../utils/common';
import {ticketService} from '../../services';

interface TwoPhaseFollowUpPayload {
  basic: {
    // Phase 1 - Always required
    assignTaskId: string;
    empId: string;
    chamberId: string;
    chamberName: string;
    remark: string;
    primaryImage?: string;
    selectedChamber?: any;
  };

  issue?: {
    // Phase 2 - Only if issues found
    isIssueFound: boolean;
    issueCategory: string;
    issueId: string;
    issueImages: string[];
    issueRemarks: string;
  };

  common: {
    // Shared data
    ticketId: string;
    transactionNumber: string;
    companyCode: string;
    location: GeoLocation;
  };
}

export const useAddFollowUp = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (error) {
      showToast(error, 'short', 'bottom');
    }
  }, [error]);

  useEffect(() => {
    return () => {
      setLoading(false);
      setError(null);
    };
  }, []);

  const addComplaintFollowUp = async (payload: FollowUpWithIssuePayload) => {
    return new Promise(resolve => {
      Geolocation.getCurrentPosition(async res => {
        try {
          setLoading(true);
          const response = await ticketService.addComplaintFollowUp(payload, {
            lat: res?.coords.latitude,
            lng: res?.coords.longitude,
          });
          setLoading(false);
          const isResponseSuccess = response?.success;
          if (isResponseSuccess) {
            resolve(response);
          } else {
            // notify on error
            setError(response?.message);
            resolve(null);
          }
        } catch (err: any) {
          setLoading(false);
          setError(err?.message || 'Failed to submit complaint follow-up');
          resolve(null);
        }
      });
    });
  };

  const addFollowUp = async (payload: any) => {
    return new Promise(resolve => {
      Geolocation.getCurrentPosition(async res => {
        try {
          setLoading(true);
          const response = await ticketService.addFollowUp(
            payload.assignTaskId,
            payload.chamberId,
            payload.remark,
            payload.images,
            {lat: res?.coords.latitude, lng: res?.coords.longitude},
            payload.selectedChamber,
          );
          setLoading(false);
          const isResponseSuccess = response?.success;
          if (isResponseSuccess) {
            resolve(response);
          } else {
            setError(response?.message);
            resolve(null);
          }
        } catch (err: any) {
          setLoading(false);
          setError(err?.message || 'Failed to submit follow-up');
          resolve(null);
        }
      });
    });
  };

  // Two-phase submission that matches Android FollowUpGtplActivity flow
  const addTwoPhaseFollowUp = async (payload: TwoPhaseFollowUpPayload) => {
    return new Promise(resolve => {
      Geolocation.getCurrentPosition(async res => {
        try {
          setLoading(true);
          const location = {
            lat: res?.coords.latitude || payload.common.location.lat,
            lng: res?.coords.longitude || payload.common.location.lng,
          };

          // Phase 1: Basic Follow-Up (Always required)
          const basicPayload = {
            assignTaskId: payload.basic.assignTaskId,
            chamberId: payload.basic.chamberId,
            remark: payload.basic.remark,
            images: payload.basic.primaryImage
              ? [payload.basic.primaryImage]
              : [],
            selectedChamber: payload.basic.selectedChamber || {
              name: payload.basic.chamberName,
              address: 'Selected Chamber Location',
            },
          };

          const basicResult = await ticketService.addFollowUp(
            basicPayload.assignTaskId,
            basicPayload.chamberId,
            basicPayload.remark,
            basicPayload.images,
            location,
            basicPayload.selectedChamber,
          );

          // Phase 2: Issue Follow-Up (Only if issues found and basic was successful)
          let issueResult = null;
          if (basicResult?.success && payload.issue?.isIssueFound) {
            const issuePayload: FollowUpWithIssuePayload = {
              assignTaskId: payload.basic.assignTaskId,
              chamberId: payload.basic.chamberId,
              chamberIdStr: payload.basic.chamberId,
              isIssueFound: payload.issue.isIssueFound,
              issueCategory: payload.issue.issueCategory,
              issueId: payload.issue.issueId,
              complaintFollowImage: payload.issue.issueImages.map(
                (img: any) => ({
                  imageUrl: img.includes('base64,')
                    ? img.split('base64,')[1]
                    : img,
                  imageExtention: 'jpg',
                }),
              ),
              lat: location.lat.toString(),
              lng: location.lng.toString(),
              gpsLocation: `${location.lat},${location.lng}`,
              remark: payload.issue.issueRemarks,
              empId: payload.basic.empId,
              companyCode: payload.common.companyCode,
              complaintId: payload.basic.assignTaskId,
              issueFound: payload.issue.isIssueFound,
            };

            issueResult = await ticketService.addComplaintFollowUp(
              issuePayload,
              location,
            );
          }

          setLoading(false);

          // Return combined results
          const result = {
            success:
              basicResult?.success &&
              (payload.issue?.isIssueFound ? issueResult?.success : true),
            basicResult,
            issueResult,
            message: basicResult?.success
              ? payload.issue?.isIssueFound
                ? issueResult?.success
                  ? 'Follow-up with issue details submitted successfully'
                  : 'Basic follow-up submitted, but issue details failed'
                : 'Follow-up submitted successfully'
              : 'Failed to submit follow-up',
          };

          if (result.success) {
            resolve(result);
          } else {
            setError('Failed to submit two-phase follow-up');
            resolve(null);
          }
        } catch (err: any) {
          setLoading(false);
          setError(err?.message || 'Failed to submit two-phase follow-up');
          resolve(null);
        }
      });
    });
  };

  return {
    addComplaintFollowUp,
    addFollowUp,
    addTwoPhaseFollowUp,
    loading,
    error,
  };
};
