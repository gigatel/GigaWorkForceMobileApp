/*
 @ 𝔸𝕦𝕥𝕙𝕠𝕣: ℙ𝕒𝕟𝕜𝕒𝕛 𝕂𝕦𝕞𝕒𝕣 ℙ𝕣𝕒𝕛𝕒𝕡𝕒𝕥𝕚
 @ 𝔼𝕞𝕒𝕚𝕝: 𝕡𝕜𝕡𝕣𝕒𝕛𝕒𝕡𝕒𝕥𝕚𝟙𝟙𝟡𝟡𝟟@𝕘𝕞𝕒𝕚𝕝.𝕔𝕠𝕞
 */

import { Common } from '@utils';
import moment from 'moment';
import { log, warn } from './common';
import { DataType } from '@types';


export const getFormatedTime = (format: string = 'hh:mm A') => {
  return moment(new Date()).format(format);
};

/**
 * Checks if current time is within N minutes before or after a given time
 * @param timeString - A time string in "HH:mm" format (e.g., "09:30")
 * @param minutesBefore - How many minutes before the time the login is allowed
 * @returns boolean - true if now >= (time - minutesBefore), false otherwise
 */
export const isWithinAllowedTime = (
  timeString: string,
  minutesBefore: number
): boolean => {
  const [hour, minute] = timeString.split(':').map(Number);
  const now = new Date();
  const targetTime = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    hour,
    minute
  );
  const earliestAllowedTime = new Date(targetTime.getTime() - minutesBefore * 60 * 1000);
  return now >= earliestAllowedTime;
};
/**
 * Checks if the current system time is within the duty shift time range (startTime to endTime).
 * @param startTime - Start time in HH:mm format (e.g., "09:00")
 * @param endTime - End time in HH:mm format (e.g., "17:00")
 * @returns boolean - True if current time is within startTime and Te, false otherwise
 */
export function checkTimeExistWithinRange(startTime: string, endTime: string): boolean {
  let checkWithinRange = false;

  try {
    // Helper function to parse time string to Date object
    const parseTime = (timeStr: string): Date => {
      const [hours, minutes] = timeStr.split(':').map(Number);
      const date = new Date();
      date.setHours(hours, minutes, 0, 0);
      return date;
    };

    // Get current time
    const now = new Date();
    const currentTimeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    // Parse start, end, and current times
    const st = parseTime(startTime);
    const et = parseTime(endTime);
    const currentTime = parseTime(currentTimeStr);

    // Add one day to all dates to match Java's Calendar.add(Calendar.DATE, 1)
    const addOneDay = (date: Date): Date => {
      const newDate = new Date(date);
      newDate.setDate(date.getDate() + 1);
      return newDate;
    };

    const startTimeWithDay = addOneDay(st);
    const endTimeWithDay = addOneDay(et);
    const currentTimeWithDay = addOneDay(currentTime);

    // Check if current time is within the range
    if (
      currentTimeWithDay.getTime() > startTimeWithDay.getTime() &&
      currentTimeWithDay.getTime() < endTimeWithDay.getTime()
    ) {
      checkWithinRange = true;
    } else {
      checkWithinRange = false;
    }
  } catch (error) {
    Common.error('Error parsing time:', error);
  }

  return checkWithinRange;
}


export function getTimeAgo(timeStr: string): string {
  // Parse the input time
  const [time, modifier] = timeStr.split(' ');
  let [hours, minutes] = time.split(':').map(Number);

  // Convert to 24-hour format
  if (modifier === 'PM' && hours !== 12) {
    hours += 12;
  } else if (modifier === 'AM' && hours === 12) {
    hours = 0;
  }

  // Get current time and target time
  const now = new Date();
  const targetTime = new Date(now);
  targetTime.setHours(hours, minutes, 0, 0);

  // If the target time is in the future (today), assume it's from yesterday
  if (targetTime > now) {
    targetTime.setDate(targetTime.getDate() - 1);
  }

  const diffMs = now.getTime() - targetTime.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const hrs = Math.floor(diffMinutes / 60);
  const mins = diffMinutes % 60;

  if (hrs > 0 && mins > 0) {
    return `${hrs} hour ${mins} min `;
  } else if (hrs > 0) {
    return `${hrs} hour `;
  } else {
    return `${mins} min `;
  }
}


export const checkShiftInTime = (shiftStart: string = ''): boolean => {
  if (!shiftStart) { return false; }

  const shiftDateTime = moment(shiftStart, 'DD-MM-YYYY HH:mm', true);
  if (!shiftDateTime.isValid()) { return false; }

  const now = moment();
  const diffInMinutes = shiftDateTime.diff(now, 'minutes');

  console.log('diffInMinutes', diffInMinutes);
  return diffInMinutes > 120;
};

/**
 *
 * @param shiftStart Start time of the shift in 'DD-MM-YYYY HH:mm' format
 * @param shiftEnd End time of the Shift in 'HH:mm' format
 * @returns Return true if within shift time else false
 */
export const isLoginWithinShift = (
  shiftStart: string = '',
  shiftEnd: string = ''
): boolean => {
  if (!shiftStart || !shiftEnd) { return false; }

  const start = moment(shiftStart, 'DD-MM-YYYY HH:mm', true);
  const end = moment(shiftEnd, 'HH:mm', true);

  if (!start.isValid() || !end.isValid()) { return false; }

  const now = moment();

  return now.isBetween(start, end, undefined, '[]'); // inclusive
};

export const isShiftOver = (shiftEnd: string = ''): boolean => {
  if (!shiftEnd) { return false; }

  const shiftEndTime = moment(shiftEnd, 'DD-MM-YYYY HH:mm', true);
  if (!shiftEndTime.isValid()) { return false; }
  const now = moment();
  return now.isAfter(shiftEndTime);
};


/**
 * Checks if current time is within the shift range.
 * @param shiftStartTime - A string in format 'DD-MM-YYYY HH:mm'
 * @param shiftEndTime - A string in format 'DD-MM-YYYY HH:mm'
 * @returns true if current time is within shift, otherwise false
 */
export const isDDShiftTime = (
  shiftStartTime: string,
  shiftEndTime: string
): boolean => {
  const now = moment();
  const start = moment(shiftStartTime, 'DD-MM-YYYY HH:mm');
  const end = moment(shiftEndTime, 'DD-MM-YYYY HH:mm');

  const shift = now.isBetween(start, end, undefined, '[]');
  log('DD Shift Time', shiftStartTime, shiftEndTime, shift);
  return shift;// inclusive of start and end
};

export const isBefore5Minute = (inTime: string) => {
  const start = moment(inTime, 'DD-MM-YYYY hh:mm A');
  const now = moment();
  return now.isAfter(start) && now.diff(start, 'minutes') <= 5;
};

/**
 * Return Shift time true or false after checking with current time
 * @param shiftStartTime Shift Start Time in DD-MM-YYYY HH:mm format
 * @param shiftEndTime Shift End Time in DD-MM-YYYY HH:mm format
 * @returns
 */
export const isWithinShiftTime = (
  shiftStartTime: string,
  shiftEndTime: string
): boolean => {
  if (!shiftStartTime || !shiftEndTime) {
    return false;
  }
  const now = moment();
  const start = moment(shiftStartTime, 'DD-MM-YYYY HH:mm');
  const end = moment(shiftEndTime, 'DD-MM-YYYY HH:mm');

  if (!start.isValid() || !end.isValid()) {
    console.warn('Invalid shift time format');
    return false;
  }

  return now.isBetween(start, end, undefined, '[)');
};

/**
 * Return true if current time is less than Shift End Time
 * @param shiftEndTime time in format DD-MM-YYYY HH:mm
 * @returns
 */
export const isBefore = (dateTime: string): boolean => {
  const start = moment(dateTime, 'DD-MM-YYYY HH:mm');
  const now = moment();
  return now.isBefore(start);
};


/**
 * Checks if current time is within 2 hours before the shift start time.
 * @param shiftStartTime - A string in format 'DD-MM-YYYY HH:mm'
 * @returns true if current time is within 2 hours before shift start, else false
 */
export const canLoginBefore2Hours = (shiftStartTime: string): boolean => {
  console.log('1');
  if (!shiftStartTime) { return false; }
  console.log('2');

  const shiftStart = moment(shiftStartTime, 'DD-MM-YYYY HH:mm', true);
  const now = moment();
  console.log('3');

  if (!shiftStart.isValid()) {
    console.warn('Invalid shift start time format');
    return false;
  }
  console.log('4', shiftStartTime);

  const twoHoursBeforeShift = shiftStart.clone().subtract(2, 'hours');
  console.log('twoHoursBeforeShift', twoHoursBeforeShift);
  return now.isSameOrAfter(twoHoursBeforeShift) && now.isBefore(shiftStart);
};

/**
 * Checks if the employee's shift is over based on the shift end time.
 * @param shiftEndTime - A string in format 'DD-MM-YYYY HH:mm'
 * @returns true if current time is after shift end time, else false
 */
export const isCurrentShiftOver = (shiftEndTime: string): boolean => {
  if (!shiftEndTime) { return false; }

  const end = moment(shiftEndTime, 'DD-MM-YYYY HH:mm', true);
  const now = moment();

  if (!end.isValid()) {
    console.warn('Invalid shift end time format');
    return false;
  }
  return now.isAfter(end);
};

type Shift = {
  shiftStartTime: string;
  shiftEndTime: string;
};

/**
 * Compares selected employee's shift time with an allowed shift time.
 *
 * @param selectedShift - Selected employee's shift object
 * @param allowedShift - Allowed shift object
 * @returns boolean - true if both shift start and end times match exactly
 */
export const isSelectedShiftSameAsAllowedShift = (
  selectedShift: Shift,
  allowedShift: Shift
): boolean => {
  const selectedStart = moment(selectedShift.shiftStartTime, 'DD-MM-YYYY HH:mm');
  const selectedEnd = moment(selectedShift.shiftEndTime, 'DD-MM-YYYY HH:mm');
  const allowedStart = moment(allowedShift.shiftStartTime, 'DD-MM-YYYY HH:mm');
  const allowedEnd = moment(allowedShift.shiftEndTime, 'DD-MM-YYYY HH:mm');

  if (!selectedStart.isValid() || !selectedEnd.isValid() || !allowedStart.isValid() || !allowedEnd.isValid()) {
    warn('Invalid date format in shift data');
    return false;
  }

  return selectedStart.isSame(allowedStart) && selectedEnd.isSame(allowedEnd);
};


/**
 *
 * @param start Start Time in string
 * @param end End Time in string
 * @returns return diffrent of the both time
 */
export function getTimeDifference(start: string, end: string): number {
  if (!start && !end) { return 0; }

  const shiftDateTime = moment(end);
  if (!shiftDateTime.isValid()) { return 0; }

  const now = moment(start);
  const diffInMinutes = shiftDateTime.diff(now, 'seconds');

  // console.log('diffInMinutes', diffInMinutes);
  return diffInMinutes;
}