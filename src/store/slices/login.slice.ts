import { APIs, URLs } from '@apis';
import { navigate, reset } from '@navigation/services';
import { createAsyncThunk, createEntityAdapter, createSlice } from '@reduxjs/toolkit';
import { CONSTANT, STRINGS } from '@res';
import { Common, Preferences, Security } from '@utils';

const LOGIN = 'login';
const otpAdapter = createEntityAdapter();
// export const getOtpApi = createAsyncThunk(
//   `${LOGIN}/getPublicKey`,
//   async (params: any, thunkAPI) => {
//     try {
//       const { mobileNumber, hashKey } = params;
//       console.log('[getOtpApi] start', { mobileNumber, hashKey });

//       const keyResponse = await APIs.postRequestWithJson({
//         path: URLs.getPwdEncription,
//         params: { userId: mobileNumber },
//         isAuth: false,
//       });

//       console.log('[getOtpApi] keyResponse', keyResponse);

//       if (!keyResponse) {
//         Common.showToast(STRINGS.server_not_responding);
//         return thunkAPI.rejectWithValue(STRINGS.server_not_responding);
//       }

//       // good check: key must be present
//       if (keyResponse?.status === 200 && keyResponse?.success === true && keyResponse?.key) {
//         try {
//           Preferences.setData('PUBLIC_KEY', keyResponse.key);
//           const pemKey = await Security.convertKeyToPem(keyResponse.key);
//           Preferences.setData('PEM_KEY', pemKey);

//           const encPass = await Security.encrypt(pemKey, CONSTANT.AUTH_PASSWORD_DEFAULT);
//           console.log('[getOtpApi] encPass', encPass);

//           if (!encPass || !encPass.success) {
//             console.log('[getOtpApi] encryption failed', encPass);
//             return thunkAPI.rejectWithValue('Encryption failed');
//           }

//           const otpPrams = {
//             userId: String(mobileNumber),
//             password: encPass.data ?? '',
//             appType: 'app',
//             hashKey: String(hashKey ?? ''),
//           };

//           console.log('[getOtpApi] sending OTP request to server', otpPrams);

//           const otpRes = await APIs.postRequestWithJson({
//             path: URLs.getOtp,
//             params: otpPrams,
//             isAuth: false,
//           });

//           console.log('[getOtpApi] otpRes', otpRes);

//           // treat provider success flexibly
//           if (otpRes?.status === 200 && (otpRes?.message === 'success' || otpRes?.success === true)) {
//             // navigate to OtpVerification and return otpRes for reducer if needed
//             navigate('OtpVerification', {
//               userId: String(mobileNumber),
//               password: encPass.data ?? '',
//               appType: 'app',
//             });
//             return otpRes;
//           } else {
//             // show backend message if provided
//             Common.showToast(otpRes?.message ?? 'Failed to send OTP');
//             return thunkAPI.rejectWithValue(otpRes ?? 'Failed to send OTP');
//           }
//         } catch (innerErr) {
//           console.log('[getOtpApi] inner error', innerErr);
//           return thunkAPI.rejectWithValue(innerErr);
//         }
//       } else if (keyResponse?.status === 401) {
//         Common.showToast(keyResponse?.message);
//         return thunkAPI.rejectWithValue(keyResponse);
//       } else {
//         Common.showToast(keyResponse?.message ?? 'Failed to fetch key');
//         return thunkAPI.rejectWithValue(keyResponse);
//       }
//     } catch (error) {
//       console.log('[getOtpApi] outer catch', error);
//       return thunkAPI.rejectWithValue(error);
//     }
//   },
// );
export const getOtpApi = createAsyncThunk(
  `${LOGIN}/getPublicKey`,
  async (params: any, thunkAPI) => {
    try {
      const { mobileNumber, hashKey } = params;
      console.log('getOtpApi');
      const keyResponse = await APIs.postRequestWithJson({
        path: URLs.getPwdEncription,
        params: { userId: mobileNumber },
        isAuth: false,
      });
      if (keyResponse == null) {
        Common.showToast(STRINGS.server_not_responding);
        thunkAPI.rejectWithValue(STRINGS.server_not_responding);
      } else {
        if (keyResponse?.status === 200 && keyResponse?.success === true) {
          if (keyResponse?.key !== null || keyResponse?.key !== '') {
            Preferences.setData('PUBLIC_KEY', keyResponse?.key);
            const pemKey = await Security.convertKeyToPem(keyResponse?.key);
            Preferences.setData('PEM_KEY', pemKey);
            const encPass = await Security.encrypt(pemKey, CONSTANT.AUTH_PASSWORD_DEFAULT);
            if (!encPass.success) {
              return;
            }
            const otpPrams = {
              userId: mobileNumber + '',
              password: encPass?.data ?? '',
              appType: 'app',
              hashKey: hashKey + '',
            };
            console.log({otpPrams},'otpPrams')
            const otpRes = await APIs.postRequestWithJson({
              path: URLs.getOtp,
              params: otpPrams,
              isAuth: false,
            });
            if (otpRes?.status === 200 && otpRes?.message === 'success') {
              navigate('OtpVerification', {
                userId: mobileNumber + '',
                password: encPass?.data ?? '',
                appType: 'app',
              });
            }
          } else {
            thunkAPI.rejectWithValue(keyResponse);
          }
        } else if (keyResponse?.status === 401) {
          Common.showToast(keyResponse?.message);
          thunkAPI.rejectWithValue(keyResponse);
        } else {
          // Common.showToast('Mobile Number Not Registered!');
          Common.showToast(keyResponse?.message);
          thunkAPI.rejectWithValue(keyResponse);
        }
      }
    } catch (error) {
      return thunkAPI.rejectWithValue(error);
    }
  },
);

// Verify OTP API
export const verifyOtpApi = createAsyncThunk(
  `${LOGIN}/verifyOtpApi`,
  async (params: any, thunkAPI) => {
    console.log(Preferences.getData('PEM_KEY'));
    
    try {
      console.log('[verifyOtpApi] start', params);
      const encOtp = await Security.encrypt(
        Preferences.getData('PEM_KEY'),
        params.otp,
      );
      // const pemKey = Preferences.getData('PEM_KEY');
      // if (!pemKey) {
      //   console.log('[verifyOtpApi] PEM_KEY missing');
      //   return thunkAPI.rejectWithValue('Missing PEM key');
      // }
      // const encOtp = await Security.encrypt(pemKey, params.otp);
      console.log('[verifyOtpApi] encOtp', encOtp);
      if (!encOtp || !encOtp.success) {
        console.log('[verifyOtpApi] otp encryption failed', encOtp);
        return thunkAPI.rejectWithValue('OTP encryption failed');
      }

      const loginRes = await APIs.postRequestWithJson({
        path: URLs.verifyLogin,
        params: {
          ...params,
          otp: encOtp.data,
        },
        isAuth: false,
      });

      console.log('[verifyOtpApi] loginRes', loginRes);

      if (loginRes?.status === 200 && loginRes?.success) {
        // persist tokens & user data
        Preferences.setData('API_AUTH_TOKEN', loginRes?.token ?? '');
        Preferences.setData('LOGIN_RESPONSE', loginRes?.loginUserInfo);
        if (loginRes?.loginUserInfo) {
          const user = loginRes.loginUserInfo;
          console.log('[verifyOtpApi] Saving user', { user });
          Preferences.setData('USER_DATA', user);
          Preferences.setData('EMPLOYEE_ID', user.employeeId);
          Preferences.setData('COMPANY_ID', user.companyId);
          Preferences.setData('ORGANIZATION_CODE', user.organizationName);
          Preferences.setData('ORGANIZATION_ID', user.organizationId);
        }
        // Return the loginRes as payload for fulfilled reducer
        return loginRes;
      } else if (loginRes?.status === 401) {
        Common.showToast(loginRes.message);
        return thunkAPI.rejectWithValue(loginRes);
      } else {
        Common.showToast(loginRes?.message ?? 'Login failed');
        return thunkAPI.rejectWithValue(loginRes ?? 'Login failed');
      }
    } catch (error) {
      console.log('[verifyOtpApi] catch', error);
      return thunkAPI.rejectWithValue(error);
    }
  },
);

//! Select Comapny API
// export const selectCompanyApi = createAsyncThunk(
//   `${LOGIN}/selectCompanyApi`,
//   async (params: any, thunkAPI) => {
//     try {
//       const selectRes = await APIs.postRequestWithJson({
//         path: URLs.selectCompany,
//         params,
//         isAuth: true,
//       });
//       if (selectRes?.status === 200 && selectRes?.success) {
//         Preferences.setData('API_AUTH_TOKEN', selectRes?.data ?? '');
//         // Preferences.setData('LOGIN_POLICIES', selectRes.policies);
//         Common.showToast('Login Successfully');
//         reset('BottomTab');
//       } else
//         if (selectRes?.status === 401) {
//           Common.showToast(selectRes.message);
//           thunkAPI.rejectWithValue(selectRes);
//         } else {

//         }
//     } catch (error) {
//       thunkAPI.rejectWithValue(error);
//     }

//   }
// );

const intialState = otpAdapter.getInitialState({
  loading: 'idel',
  error: null,
  data: null,
  loginData: null,
});

const loginSlice = createSlice({
  name: LOGIN,
  initialState: intialState,
  reducers: {},
  extraReducers: builder => {
    //! Get OTP
    builder.addCase(getOtpApi.pending, (state,) => {
      state.loading = 'pending';
    });
    builder.addCase(getOtpApi.fulfilled, (state, action) => {
      state.loading = 'fulfilled';
      state.data = action.payload ?? null;
    });
    builder.addCase(getOtpApi.rejected, (state,) => {
      state.loading = 'rejected';
    });
    //! Verify OTP | Login
    builder.addCase(verifyOtpApi.pending, (state,) => {
      state.loading = 'pending';
    });
    builder.addCase(verifyOtpApi.fulfilled, (state, action) => {
      state.loading = 'fulfilled';
      state.loginData = action.payload ?? null;
    });
    builder.addCase(verifyOtpApi.rejected, (state,) => {
      state.loading = 'rejected';
    });

  },
});


export const loginReducer = loginSlice.reducer;
