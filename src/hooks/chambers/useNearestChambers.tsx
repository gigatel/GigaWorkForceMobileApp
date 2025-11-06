import {useWatchUserLocation} from '@hooks/useWatchUserLocation';
import {Common} from '@utils';
import {useCallback, useEffect, useState} from 'react';
import {ticketService} from '../../services/ticketService';
import {Chamber} from 'src/types/data-types';
import Geolocation, {
  GeolocationResponse,
} from '@react-native-community/geolocation';

export const useNearestChambers = () => {
  const [chambers, setChambers] = useState<Chamber[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const fetchChambers = async () => {
    setLoading(true);
    try {
      Geolocation.getCurrentPosition(async info => {
        console.log('Current Position', info);
        const res = await ticketService.getNearestChambers(
          'GTPL',
          info?.coords?.latitude,
          info?.coords?.longitude,
          5000000,
        );
        if (res.success && res.data) {
          const mapped: Chamber[] = res.data.map(
            (c: any) =>
              ({
                id: Number(c.id || c.chamberId || Math.random()),
                name: c.chamber_name || c.chamberName || 'Unknown Chamber',
                address: c.chamber_location || c.landmark || 'No address',
                distance: Number(c.distance || 0) / 1000,
                chamberType: c.chamber_type || c.chamberType,
                chamberId: c.chamber_id || c.chamberId,
                chamberNo: c.chamberNo,
                routeId: c.route_id || c.routeId,
                chamberIdStr: c.chamber_id || c.chamberId,
                chamberName: c.chamber_name || c.chamberName,
                status: c.status || 1,
                updatedOn: c.updatedOn || new Date().toISOString(),
                chamberLat: c.chamber_latitude || c.chamberLat,
                chamberLong: c.chamber_longitude || c.chamberLong,
                chamberAddress: c.chamber_address || c.chamberAddress,
                taskName: c.task_name || c.taskName,
                isVisited: c.is_visited || c.isVisited,
              } as Chamber),
          );
          console.log('Chambers', {mapped});
          setChambers(mapped);
          Common.log('Chambers loaded:', mapped.length);
        } else {
          Common.showToast('No chambers found');
          setChambers([]);
        }
      });
    } catch (err: any) {
      setError(err);
      Common.error('fetchChambers', err);
      Common.showToast('Failed to load chambers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChambers();
  }, []);

  const refetch = useCallback(() => {
    fetchChambers();
  }, [fetchChambers]);
  return {chambers, loading, error, refetch};
};
