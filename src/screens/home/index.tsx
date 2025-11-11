import {APIs, URLs} from '@apis';
import {AnimImage, Buttons, ListView} from '@atoms';
import {DEVELOPER_NAME} from '@env';
import {
  LocationPermission,
  SyncOfflineDataSheet,
  UserNameDesigRow,
} from '@molecules';
import {BackHandler} from 'react-native';
import {RootStackParamList} from '@navigation/navigator';
import {Screen} from '@organisms';
import Geolocation from '@react-native-community/geolocation';
import NetInfo from '@react-native-community/netinfo';
import {useFocusEffect} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootState, StoreDispatch} from '@reducers';
import {COLORS, CONSTANT, FONTS, IMAGES, SIZE, STYLES} from '@res';
// import {todayAttendanceApi} from '@slices/attendance.slice';
import {dashboardListApi, getLoginTokenApi} from '@slices/dashboard.slice';
import {DataType, ScreenProps} from '@types';
import {
  postOnceIfDue,
  attachPosterDispatch,
} from '../../services/LocationPosterCore';
import {startForegroundPoster} from '../../services/ForegroundLocationPoster';
import {attachDispatch} from '../../services/LocationBatteryService';
import {
  Common,
  Location,
  Permissions,
  Preferences,
  Services,
  Voice,
} from '@utils';
import React, {
  FC,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useState,
  useRef,
} from 'react';
import {
  AppState,
  Image,
  StyleSheet,
  Text,
  Platform,
  View,
  Linking,
  NativeModules,
  NativeEventEmitter,
  TouchableOpacity, // ✅ added
} from 'react-native';
import * as Animiatable from 'react-native-animatable';
import {connect, useDispatch} from 'react-redux';
import DeviceInfo from 'react-native-device-info';
type MobileVersion = {
  project_name?: string;
  access_url?: string;
  version_name?: string;
  version_code?: string | number;
  description?: string;
};
export interface ProjectListItemProps {
  data: DataType.Project;
  index?: number;
}
export interface ModuleListItemProps {
  data: DataType.Module;
}
export interface SubModuleListItemProps {
  item: DataType.SubModule;
}
interface ModuleCardProps {
  title: string;
  image: string;
  onPress?: () => void;
}
let navigator: NativeStackNavigationProp<RootStackParamList>;
function getRandomDelay() {
  return Math.floor(Math.random() * (10000 - 2000 + 1)) + 2000;
}

const check = (name: string, lName: string) =>
  Common.isEqualIgnoreCase(name, lName);
const pickGoogleMapKey = (r: any) =>
  r?.googleMapKey ?? r?.data?.googleMapKey ?? null;
const employeeId = (r: any) =>
  r?.employeeDetails?.id ?? r?.data?.employeeDetails?.id ?? null;

const formatBytes = (n?: number) => {
  if (!n || n <= 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(n) / Math.log(k));
  return `${(n / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
};

// ===== Version compare helpers =====
const toParts = (v?: string | number) =>
  String(v ?? '')
    .trim()
    .split('.')
    .map(s => parseInt(s, 10))
    .map(n => (Number.isFinite(n) ? n : 0));
const cmpDot = (a: string | number, b: string | number) => {
  const A = toParts(a);
  const B = toParts(b);
  const len = Math.max(A.length, B.length);
  for (let i = 0; i < len; i++) {
    const av = A[i] ?? 0;
    const bv = B[i] ?? 0;
    if (av > bv) return 1;
    if (av < bv) return -1;
  }
  return 0;
};
const isServerNewerThanInstalled = async (serverCode?: string | number) => {
  const sc = String(serverCode ?? '').trim();
  if (!sc) return false;
  if (sc.includes('.')) {
    const appVerName = DeviceInfo.getVersion();
    return cmpDot(sc, appVerName) > 0;
  }
  const appBuild = parseInt(DeviceInfo.getBuildNumber(), 10) || 0;
  const srvBuild = parseInt(sc, 10) || 0;
  return srvBuild > appBuild;
};
// ===== iOS OTA helpers: probe & open
type HeadProbe = {
  ok: boolean;
  status: number;
  contentType?: string | null;
  contentLength?: number | null;
  url: string;
  error?: string;
};
const normalizeUrl = (raw: string) => {
  let u = raw.trim();
  // Remove accidental double slashes after host
  u = u.replace(/([^:])\/{2,}/g, '$1/'); // keeps "https://"
  return u;
};

// Try HEAD first; if blocked, try Range GET (1 byte) to fetch headers without downloading file
const probeUrl = async (url: string): Promise<HeadProbe> => {
  try {
    const res = await fetch(url, {method: 'HEAD' as any});
    const ct = res.headers.get('content-type');
    const cl = parseInt(res.headers.get('content-length') || '', 10);
    return {
      ok: res.ok,
      status: res.status,
      contentType: ct,
      contentLength: Number.isFinite(cl) ? cl : null,
      url: res.url || url,
    };
  } catch (_e) {
    try {
      const res = await fetch(url, {
        method: 'GET',
        headers: {Range: 'bytes=0-0'},
      } as any);
      const ct = res.headers.get('content-type');
      const cl = parseInt(res.headers.get('content-length') || '', 10);
      return {
        ok: res.ok || res.status === 206,
        status: res.status,
        contentType: ct,
        contentLength: Number.isFinite(cl) ? cl : null,
        url: res.url || url,
      };
    } catch (e: any) {
      return {
        ok: false,
        status: 0,
        contentType: null,
        contentLength: null,
        url,
        error: e?.message || String(e),
      };
    }
  }
};

const isPlistUrl = (u: string) =>
  /\.plist(\?|$)/i.test(u) || /manifest\.plist/i.test(u);
const isIpaUrl = (u: string) => /\.ipa(\?|$)/i.test(u);
const toItmsFromPlist = (manifestUrl: string) =>
  `itms-services://?action=download-manifest&url=${encodeURIComponent(
    manifestUrl,
  )}`;

const openOtaIOS = async (rawUrl: string) => {
  const url = normalizeUrl(rawUrl);
  const probe = await probeUrl(url);
  if (!probe.ok) {
    Common.alert({
      title: 'Update link not reachable',
      msg:
        `URL: ${url}\n` +
        (probe.status ? `Status: ${probe.status}\n` : '') +
        (probe.error
          ? `Error: ${probe.error}`
          : 'Server did not respond as expected'),
    });
    return;
  }
  if (isPlistUrl(url)) {
    if (!url.startsWith('https://')) {
      Common.alert({
        title: 'Manifest must be HTTPS',
        msg: 'iOS requires the manifest.plist to be served over HTTPS.',
      });
      return;
    }
    const itms = toItmsFromPlist(url);
    const can = await Linking.canOpenURL(itms);
    if (!can) {
      Common.alert({title: 'Cannot open installer', msg: itms});
      return;
    }
    await Linking.openURL(itms);
    return;
  }
  if (isIpaUrl(url)) {
    const can = await Linking.canOpenURL(url);
    if (!can) {
      Common.alert({title: 'Cannot open URL in Safari', msg: url});
      return;
    }
    await Linking.openURL(url);
    return;
  }
  const can = await Linking.canOpenURL(url);
  if (!can) {
    Common.alert({title: 'Cannot open URL', msg: url});
    return;
  }
  await Linking.openURL(url);
};
// ===== NAVIGATION FOR SUB-MODULES =====
const moduleNavigation = (item: DataType.SubModule) => {
  Common.log('item', item);
  console.log('itemData', {item});
  if (
    check(item.subModuleName, 'TICKETS') ||
    check(item.subModuleName, 'COMPLAINTS') ||
    check(item.subModuleName, 'FIBER MAINTENANCE') ||
    check(item.subModuleName, 'SPLICER TICKET') ||
    check(item.subModuleName, 'COMPLAINT MANAGEMENT')
  ) {
    const hasTicketAccess = item.polices?.some(
      p =>
        p.policyName === 'ViewComplaint' ||
        p.policyName === 'AccessTicket' ||
        p.policyName === 'ViewTickets' ||
        p.policyName === 'AccessComplaints',
    );
    if (hasTicketAccess) {
      Common.success('✅ Opening Tickets Module');
      navigator?.getParent()?.navigate('TicketsList');
    } else {
      Common.showToast('❌ Access Denied for Tickets Module');
    }
    return;
  }
  if (check(item.subModuleName, 'ATTENDANCE')) {
    const isViewAllow = item.polices?.some(
      p => p.policyName === 'ViewAttendance',
    );
    const isMarkAllow = item.polices?.some(
      p => p.policyName === 'MarkAttendance',
    );
    navigator?.getParent()?.navigate('AttendanceDashboard', {
      shiftType: 'single',
      isViewAllow,
      isMarkAllow,
    });
  } else if (check(item.subModuleName, 'CONTACTS')) {
    navigator?.getParent()?.navigate('ContactsList');
  } else if (check(item.subModuleName, 'HOLIDAY')) {
    navigator?.getParent()?.navigate('HolidaysList');
  } else if (check(item.subModuleName, 'DOUBLE DUTY')) {
    const isViewAllow = item.polices?.some(
      p => p.policyName === 'ViewDoubleDuty',
    );
    const isMarkAllow = item.polices?.some(
      p => p.policyName === 'MarkDoubleDuty',
    );
    navigator?.getParent()?.navigate('DDAttendanceDashboard', {
      shiftType: 'double',
      isViewAllow,
      isMarkAllow,
    });
  } else if (check(item.subModuleName, 'PAYROLL')) {
    navigator.navigate('MonthlySalary');
  } else if (check(item.subModuleName, 'ROAD PROJECT')) {
    navigator?.getParent()?.navigate('RoadProject');
  } else if (check(item.subModuleName, 'CHAMBER COMPLAINT')) {
    navigator?.getParent()?.navigate('AddChamberComplaint');
  } else if (check(item.subModuleName, 'PATROLLER TASK')) {
    navigator?.getParent()?.navigate('PatrollerTask');
  } else if (__DEV__) {
    navigator.navigate('DeveloperPKPScreen');
  } else {
    Common.showToast(item.subModuleName + ' is Under Development');
  }
};

// ===== UI bits =====
const ModuleCard: FC<ModuleCardProps> = ({title, image, onPress}) => (
  <TouchableOpacity
    style={styles.moduleCardContainer}
    activeOpacity={CONSTANT.BUTTON_OPACITY}
    onPress={onPress}>
    <View style={styles.moduleCardImageContainer}>
      <AnimImage
        animation={'rubberBand'}
        useNativeDriver={true}
        iterationCount={'infinite'}
        duration={getRandomDelay()}
        source={{uri: image}}
        style={styles.moduleCardImage}
      />
    </View>
    <Text style={styles.moduleCardTitleText}>{Common.toTitleCase(title)}</Text>
  </TouchableOpacity>
);

const ProjectList = memo(
  ({
    data,
    desc,
    code,
    onRefresh,
  }: {
    data: DataType.Project[];
    desc: string;
    code: string | number;
    onRefresh: () => void;
  }) => {
    return (
      <View>
        <ListView
          data={data}
          bounces
          isRefreshable
          onRefresh={onRefresh}
          ListHeaderComponent={<LogoView verCode={String(code)} desc={desc} />}
          renderItem={({item}: {item: DataType.Project}) => (
            <ProjectListItem data={item} />
          )}
        />
      </View>
    );
  },
);

const ProjectListItem: FC<ProjectListItemProps> = ({data}) => (
  <View>
    <ModuleList data={data.modules} />
  </View>
);

const ModuleList = memo(({data}: {data: DataType.Module[]}) => (
  <View>
    <ListView
      data={data}
      renderItem={({item}) => <ModuleListItem data={item} />}
    />
  </View>
));

const ModuleListItem = memo(({data}: {data: DataType.Module}) => (
  <View>
    <View style={styles.devider} />
    <Text style={styles.moduleTitleText}>{data?.moduleName}</Text>
    <SubModuleList data={data.subModules} />
  </View>
));

const SubModuleList = memo(({data}: {data: DataType.SubModule[]}) => (
  <View style={styles.subModuleListContainer}>
    {data.map(item => (
      <SubModuleListItem item={item} key={item?.subModuleName} />
    ))}
  </View>
));

const SubModuleListItem: FC<SubModuleListItemProps> = ({item}) => {
  const cardWidth = (Common.width - 70) / 4;
  return (
    <Animiatable.View
      animation={'zoomIn'}
      key={item?.subModuleName}
      style={[styles.subModuleItemView, {width: cardWidth}]}>
      <ModuleCard
        title={item.subModuleName}
        image={item.subModuleImage ?? ''}
        onPress={() => moduleNavigation(item)}
      />
    </Animiatable.View>
  );
};

const LogoView = ({desc}: {desc: string; verCode?: string}) => {
  console.log('logoViewDesc', {desc});
  if (__DEV__)
    return (
      <>
        <Animiatable.Image
          useNativeDriver
          iterationCount="infinite"
          animation="swing"
          source={IMAGES.globe}
          style={styles.globe}
        />
        <View style={styles.logoView}>
          <Buttons
            type="primary"
            title={'DEV'}
            viewStyle={styles.devButtonView}
          />
          <View style={styles.logoNameView}>
            <Image source={IMAGES.appLogo} style={styles.logoImage} />
            {/* <Text style={styles.logoNameText}>{'Gigatrack'}</Text> */}
          </View>
          <Buttons
            type="primary"
            title={`V ${Common.getAppVersion()}`}
            viewStyle={styles.vcButtonView}
          />
        </View>
      </>
    );
  return (
    <>
      <Animiatable.Image
        useNativeDriver
        iterationCount="infinite"
        animation="swing"
        source={IMAGES.globe}
        style={styles.globe}
      />
      <View style={styles.logoView}>
        <Buttons
          type="primary"
          title={'DEV'}
          viewStyle={styles.devButtonView}
        />
        <View style={styles.logoNameView}>
          <Image source={IMAGES.appLogo} style={styles.logoImage} />
          {/* <Text style={styles.logoNameText}>{'Gigatrack'}</Text> */}
        </View>
        <Buttons
          type="primary"
          title={`V ${Common.getAppVersion()}`}
          viewStyle={styles.vcButtonView}
        />
      </View>
    </>
  );
};

// ---------- FULL-SCREEN UPDATE GATE (both Android & iOS)
const UpdateGateScreen = ({children}: {children: React.ReactNode}) => (
  <View style={styles.updateScreen}>
    <View style={styles.updateScreenInner}>{children}</View>
  </View>
);
const UpdateRequiredCard = ({
  versionName,
  onUpdatePress,
  projectNames,
  currentVersionName,
  currentBuild,
  serverVersionCode,
  downloading,
  percent,
  downloaded,
  total,
}: {
  versionName?: string;
  onUpdatePress: () => void | Promise<void>;
  projectNames: string[];
  currentVersionName?: string;
  currentBuild?: string | number;
  serverVersionCode?: string | number;
  downloading?: boolean;
  percent?: number;
  downloaded?: number;
  total?: number;
}) => (
  <View style={styles.updateCard}>
    <Text style={styles.updateTitle}>Update Required</Text>
    <Text style={styles.updateSubtitle}>
      A new version {versionName ? `(${versionName}) ` : ''}is available for{' '}
      {projectNames.join(', ')} and you are using an older version of the
      application. Please update to continue.
    </Text>
    {(currentVersionName || currentBuild || serverVersionCode) && (
      <Text style={styles.updateNote}>
        App: v{currentVersionName ?? '—'} (code {currentBuild ?? '—'}){'\n'}
        Server: code {serverVersionCode ?? '—'}
      </Text>
    )}
    {downloading ? (
      <Text style={styles.updateNote}>
        Downloading…
        {typeof percent === 'number' && percent >= 0
          ? ` ${percent.toFixed(0)}%`
          : ''}
        {typeof downloaded === 'number' &&
        typeof total === 'number' &&
        total > 0
          ? ` • ${formatBytes(downloaded)} / ${formatBytes(total)}`
          : ''}
      </Text>
    ) : null}

    <Buttons
      type="primary"
      title={downloading ? 'Downloading…' : 'Update Now'}
      onPress={() => void onUpdatePress()}
      viewStyle={styles.updateBtn}
    />
  </View>
);

const Home: FC<ScreenProps.Home> = ({loading, dashboardList, navigation}) => {
  navigator = navigation;
  const {ApkInstaller} = NativeModules;

  const [showLocationSheet, setShowLocationSheet] = useState(false);
  const [isLoading, setisLoading] = useState(false);
  const [showSync, setShowSync] = useState(false);
  const [currentAddress, setCurrentAddress] = useState('');

  // APK download progress (Android)
  const [dlActive, setDlActive] = useState<boolean>(false);
  const [dlPercent, setDlPercent] = useState<number>(0);
  const [dlDownloaded, setDlDownloaded] = useState<number>(0);
  const [dlTotal, setDlTotal] = useState<number>(-1);

  const [showPrivacy, setShowPrivacy] = useState(false);
  const locationTimerRef = useRef<NodeJS.Timeout | null>(null);

  const dispatch = useDispatch<StoreDispatch>();
  useEffect(() => {
    const interval = setInterval(() => {
      const addrData = Preferences.getData(Preferences.KEY.LAST_GEO_ADDRESS);
      if (addrData?.address && addrData.address !== currentAddress) {
        setCurrentAddress(addrData.address);
      }
    }, 5000); // check every 5s for UI update

    return () => clearInterval(interval);
  }, [currentAddress]);

  useEffect(() => {
    const parent = navigation?.getParent?.();
    if (!parent || typeof parent.addListener !== 'function') return;

    const onTabPress = (e: any) => {
      try {
        const isForce = Preferences.getData('FORCE_UPDATE_REQUIRED') === 'yes';
        if (!isForce) return;

        // Block switching to other tabs
        e.preventDefault?.();
        Common.showToast('Update required — other tabs are disabled.');
      } catch {}
    };

    const unsub = parent.addListener('tabPress', onTabPress);
    return () => {
      if (typeof unsub === 'function') unsub();
    };
  }, [navigation]);

  // ======== STATIC "TICKETS" PROJECT (Custom) ========
  const TICKET_ICON = 'https://img.icons8.com/ios-filled/100/ticket--v3.png';
  const makeLocalTicketsProject = (): DataType.Project =>
    ({
      projectName: 'Custom Module',
      modules: [
        {
          moduleName: 'TICKETS',
          subModules: [
            {
              subModuleName: 'TICKETS',
              subModuleImage: TICKET_ICON,
              polices: [{policyName: 'AccessTicket'}],
            } as unknown as DataType.SubModule,
          ],
        } as unknown as DataType.Module,
      ],
    } as unknown as DataType.Project);

  // 🔁 CHANGED: use ONLY local custom tickets (no dependency on API modules),
  // while keeping your API calls elsewhere fully active.
  const uiProjects = useMemo<DataType.Project[]>(
    () => [makeLocalTicketsProject()],
    [],
  );
  // ================================================

  const ensurePostingServices = useCallback(async () => {
    try {
      attachDispatch(dispatch);
      attachPosterDispatch(dispatch);
      startForegroundPoster();
    } catch (e) {
      __DEV__ && console.warn('[Home] ensurePostingServices failed', e);
    }
  }, [dispatch]);

  useEffect(() => {
    void ensurePostingServices();
  }, [ensurePostingServices]);

  // Android APK installer events
  useEffect(() => {
    if (!NativeModules.ApkInstaller) return;
    const emitter = new NativeEventEmitter(NativeModules.ApkInstaller);
    const subP = emitter.addListener('ApkInstallerProgress', (e: any) => {
      setDlActive(true);
      setDlPercent(typeof e?.percent === 'number' ? e.percent : -1);
      setDlDownloaded(typeof e?.downloaded === 'number' ? e.downloaded : 0);
      setDlTotal(typeof e?.total === 'number' ? e.total : -1);
    });
    const subD = emitter.addListener('ApkInstallerDone', () => {
      setDlActive(false);
      setDlPercent(100);
    });
    const subE = emitter.addListener('ApkInstallerError', (e: any) => {
      setDlActive(false);
      Common.alert({
        title: 'Update failed',
        msg: `${e?.code ?? 'ERROR'}: ${e?.message ?? 'Unknown error'}`,
      });
    });
    return () => {
      subP.remove();
      subD.remove();
      subE.remove();
    };
  }, []);

  useEffect(() => {
    const sub = AppState.addEventListener('change', async state => {
      __DEV__ && console.log('[AppState]', state);
      if (
        state === 'active' ||
        state === 'background' ||
        state === 'inactive'
      ) {
        try {
          await ensurePostingServices();
        } catch (e) {
          __DEV__ && console.warn('[BG] ensure on AppState failed', e);
        }
      }
    });
    return () => sub.remove();
  }, [ensurePostingServices]);
  // ✅ Start foreground + periodic updates every 30s while focused
  useFocusEffect(
    useCallback(() => {
      let isMounted = true;

      const startInterval = () => {
        if (locationTimerRef.current) clearInterval(locationTimerRef.current);
        locationTimerRef.current = setInterval(async () => {
          try {
            await postOnceIfDue('fg', dispatch);
          } catch (e) {
            __DEV__ && console.warn('[Home] postOnceIfDue failed', e);
          }
        }, 30_000); // every 30 seconds
      };

      const startLocationFlow = async () => {
        try {
          await ensurePostingServices();
          startInterval();
        } catch (err) {
          __DEV__ && console.warn('[Home] startLocationFlow failed', err);
        }
      };

      startLocationFlow();

      return () => {
        isMounted = false;
        if (locationTimerRef.current) clearInterval(locationTimerRef.current);
      };
    }, [ensurePostingServices, dispatch]),
  );

  // ✅ Restart services when app comes to foreground or background
  useEffect(() => {
    const sub = AppState.addEventListener('change', async state => {
      if (['active', 'background'].includes(state)) {
        await ensurePostingServices();
      }
    });
    return () => sub.remove();
  }, [ensurePostingServices]);

  // ✅ Continue with your existing location + dashboard setup
  const handleStartService = useCallback(async () => {
    const res = await Location.checkPermission();
    if (res) {
      await Location.initializeConfig();
      await Services.startLocationService();
      await ensurePostingServices();
    }
  }, [ensurePostingServices]);

  useEffect(() => {
    dispatch(getLoginTokenApi());
    Permissions.requestPermission();
    handleStartService();
  }, [dispatch, handleStartService]);

  // (Optional) Map key setter paused while modules are static
  // useEffect(() => {
  //   const key = pickGoogleMapKey(dashboardList);
  //   if (key) Preferences.setData('GOOGLE_MAPS_API_KEY', key);
  // }, [dashboardList]);

  // useEffect(() => {
  //   const eid = employeeId(dashboardList);
  //   if (eid) {
  //     console.log('employeeID', {eid});
  //     Preferences.setData('EMPLOYEE_ID', eid);
  //     Common.log('Saved EMPLOYEE_ID in Preferences:', eid);
  //   }
  // }, [dashboardList]);

  useFocusEffect(
    useCallback(() => {
      if (
        dashboardList?.employeeDetails?.id &&
        dashboardList.employeeDetails.companyId
      ) {
        // Keep APIs intact if you re-enable attendance later
        // dispatch(todayAttendanceApi({ ... }))
      }
    }, [
      dashboardList?.employeeDetails?.companyId,
      dashboardList?.employeeDetails?.id,
      dispatch,
    ]),
  );
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        // ✅ Exit the app instead of going back
        BackHandler.exitApp();
        return true; // prevent default navigation
      };

      // Add event listener when this screen is focused
      const backHandler = BackHandler.addEventListener(
        'hardwareBackPress',
        onBackPress,
      );

      // Remove listener on unfocus/unmount
      return () => backHandler.remove();
    }, []),
  );

  const syncOfflineData = async () => {
    try {
      setShowSync(false);
      setisLoading(true);
      const lastAtt = Preferences.getData('OFFLINE_ATTENDANCE');
      const param: any[] = [];
      lastAtt?.forEach((item: any) => param.push(item.params));
      const res = await APIs.postRequestWithJson({
        path: URLs.syncOfflineAttendance,
        params: {attendanceList: param},
        isAuth: true,
      });
      setisLoading(false);
      if (res?.status === 200 && res.success) {
        const msg = 'ऑफलाइन डेटा सर्वर पर सिंक हो चुका है।';
        Common.alert({
          title: 'Sync Successful',
          msg: 'Offline data sync successfully to server. \n\n' + msg,
        });
        Voice.speak(msg);
        Preferences.removeData('OFFLINE_ATTENDANCE');
      } else {
        Common.alert({
          title: 'Alert',
          msg: res?.messege ?? 'Something went wrong in offline sync.',
        });
      }
    } catch (err) {
      Common.error('Error in Sync at Home', err);
      setShowSync(false);
      setisLoading(false);
    }
  };

  const sync = () => {
    const lastAtt = Preferences.getData('OFFLINE_ATTENDANCE');
    NetInfo.fetch().then(state => {
      if (state.isConnected && lastAtt && lastAtt.length > 0) {
        Common.log('Last Attendance Data Home::::::', lastAtt);
        setShowSync(true);
      }
    });
  };

  useFocusEffect(
    useCallback(() => {
      sync();
    }, []),
  );

  const getDashboardData = useCallback(
    (refresh: boolean) => {
      dispatch(dashboardListApi({isRefresh: refresh}));
    },
    [dispatch],
  );
  useEffect(() => {
    Common.warn('DEVELOPER_NAME::', DEVELOPER_NAME);
    getDashboardData(false);
    setShowLocationSheet(
      Preferences.getData('ALLOWED_ACCESS_FOR_LOCATION_BACKGROUND') !== 'yes',
    );
  }, [dispatch, getDashboardData, handleStartService]);

  // useFocusEffect(
  //   useCallback(() => {
  //     setShowPrivacy(false);
  //     handleStartService();

  //     Geolocation.getCurrentPosition(
  //       info => {
  //         Preferences.setData('LAST_GEO_ADDRESS', {
  //           address: '',
  //           lat: info.coords.latitude,
  //           long: info.coords.longitude,
  //         });
  //         Location.getAddressWithLatLong(
  //           info.coords.latitude,
  //           info.coords.longitude,
  //         ).then(data => {
  //           Preferences.setData('LAST_GEO_ADDRESS', data);
  //         });
  //       },
  //       err => Common.error('getCurrentPosition HOME Error::', err),
  //       {timeout: 20000, maximumAge: 0, enableHighAccuracy: false},
  //     );
  //   }, [handleStartService]),
  // );
  useFocusEffect(
    useCallback(() => {
      setShowPrivacy(false);
      handleStartService(); // this starts the foreground poster which starts the watcher
    }, [handleStartService]),
  );

  // ===== Version-based update gating
  const [forcedUpdateRequired, setForcedUpdateRequired] = useState(false);
  const {forcedAccessUrl, forcedVersionName, forcedProjectName} =
    useMemo(() => {
      const mv1: MobileVersion | undefined = dashboardList?.mobileAppVersion1;
      return {
        forcedAccessUrl: mv1?.access_url as string | undefined,
        forcedVersionName: mv1?.version_name as string | undefined,
        forcedProjectName:
          (mv1?.project_name as string | undefined) ?? 'Employee Master',
      };
    }, [dashboardList]);
  // ✅ Reliable location getter with retry + fallback
  const getSafeLocation = async (
    retries = 3,
  ): Promise<{lat: number; long: number} | null> => {
    return new Promise(resolve => {
      const attempt = (remaining: number) => {
        Geolocation.getCurrentPosition(
          pos => {
            resolve({
              lat: pos.coords.latitude,
              long: pos.coords.longitude,
            });
          },
          err => {
            if (remaining > 1) {
              __DEV__ &&
                console.warn(
                  `[Home] getCurrentPosition failed (${
                    retries - remaining + 1
                  }), retrying...`,
                  err?.message,
                );
              setTimeout(() => attempt(remaining - 1), 2000); // retry after 2s
            } else {
              __DEV__ &&
                console.warn(
                  '[Home] getCurrentPosition final fail:',
                  err?.message,
                );
              // fallback to last known location
              const last = Preferences.getData(
                Preferences.KEY.LAST_GEO_ADDRESS,
              );
              if (last?.lat && last?.long) {
                resolve({lat: last.lat, long: last.long});
              } else {
                resolve(null);
              }
            }
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
          },
        );
      };
      attempt(retries);
    });
  };

  useEffect(() => {
    let isActive = true;
    (async () => {
      const serverCode =
        dashboardList?.mobileAppVersion1?.version_code ??
        dashboardList?.mobileAppVersion?.version_code;
      try {
        const newer = await isServerNewerThanInstalled(serverCode);
        if (isActive) setForcedUpdateRequired(newer);
      } catch (e) {
        __DEV__ && console.warn('[VersionCheck] failed', e);
        if (isActive) setForcedUpdateRequired(false);
      }
    })();
    return () => {
      isActive = false;
    };
  }, [dashboardList]);

  const onUpdatePress = useCallback(async () => {
    const raw = forcedAccessUrl;
    if (!raw) {
      Common.showToast('Update URL not found');
      return;
    }

    if (Platform.OS === 'ios') {
      await openOtaIOS(raw);
      return;
    }

    // Android: existing APK flow
    try {
      const canInstall =
        await NativeModules.ApkInstaller?.canRequestPackageInstalls();
      if (!canInstall) {
        Common.warn('Allow “Install unknown apps” for this app to continue.');
        NativeModules.ApkInstaller?.openUnknownSourcesSettings();
        return;
      }
      setDlActive(true);
      setDlPercent(0);
      setDlDownloaded(0);
      setDlTotal(-1);
      const fileName = `Gigatel-${forcedVersionName ?? 'update'}.apk`;
      await NativeModules.ApkInstaller?.downloadAndInstall(raw, fileName);
    } catch (e: any) {
      setDlActive(false);
      Common.alert({
        title: 'Install failed',
        msg:
          (e?.message ?? String(e)) +
          '\n\nIf you still see “App not installed – package conflicts”, ' +
          'the existing app is signed with a different key or has a different packageId. ' +
          'Use the same keystore & package, and ensure versionCode is higher, or uninstall once.',
      });
    }
  }, [forcedAccessUrl, forcedVersionName]);

  const hideDashboardModules = forcedUpdateRequired;

  useEffect(() => {
    Preferences.setData(
      'FORCE_UPDATE_REQUIRED',
      hideDashboardModules ? 'yes' : 'no',
    );
  }, [hideDashboardModules]);
  // ✅ Fetch and save address once at Home start
  useEffect(() => {
    const fetchAndSaveInitialAddress = async () => {
      try {
        // ✅ Ensure permission first
        const hasPermission = await Location.checkPermission();
        if (!hasPermission) {
          const granted = await Permissions.requestPermission();
          if (!granted) {
            __DEV__ &&
              console.log('[Home] Permission denied, skipping location fetch');
            return;
          }
        }

        // ✅ Get address using your helper (it gets coords internally)
        const geo =
          (await Location.getAddressFromLatLong()) as DataType.GeoAddress;
        console.log('[Home] updated geoLocation', geo);

        if (geo?.lat && geo?.long) {
          // Save to preferences
          Preferences.setData(Preferences.KEY.LAST_GEO_ADDRESS, {
            lat: geo.lat,
            long: geo.long,
            address: geo.address ?? '',
          });

          __DEV__ &&
            console.log('[Home] initial address fetched:', geo.address);

          // ✅ Trigger first post after address fetched
          await postOnceIfDue('fg', dispatch);
        } else {
          __DEV__ && console.log('[Home] could not fetch valid coordinates');
        }
      } catch (err) {
        __DEV__ && console.warn('[Home] initial address fetch error:', err);
      }
    };

    // small delay for GPS initialization
    const timer = setTimeout(fetchAndSaveInitialAddress, 1000);
    return () => clearTimeout(timer);
  }, [dispatch]);

  const appVersionName = DeviceInfo.getVersion();
  const appBuildNumber = DeviceInfo.getBuildNumber();
  const serverVersionCode =
    dashboardList?.mobileAppVersion1?.version_code ??
    dashboardList?.mobileAppVersion?.version_code;

  return (
    <Screen
      loading={loading || isLoading}
      statusBgColor={COLORS.PRIMARY}
      preset="fixed">
      {hideDashboardModules ? (
        <UpdateGateScreen>
          <UpdateRequiredCard
            versionName={forcedVersionName}
            onUpdatePress={() => void onUpdatePress()}
            projectNames={[forcedProjectName]}
            currentVersionName={appVersionName}
            currentBuild={appBuildNumber}
            serverVersionCode={serverVersionCode}
            downloading={dlActive}
            percent={dlPercent}
            downloaded={dlDownloaded}
            total={dlTotal}
          />
        </UpdateGateScreen>
      ) : (
        <>
          {Preferences.getData('FORCE_UPDATE_REQUIRED') === 'yes' && (
            <View
              style={{
                backgroundColor: COLORS.PRIMARY,
                paddingVertical: 6,
                paddingHorizontal: 12,
                borderRadius: 6,
                margin: 12,
              }}>
              <Text style={{color: COLORS.WHITE, textAlign: 'center'}}>
                Update required — some sections are temporarily disabled.
              </Text>
            </View>
          )}
          <UserNameDesigRow
            name={
              (dashboardList?.employeeDetails?.firstName ?? '') +
              ' ' +
              (dashboardList?.employeeDetails?.middleName ?? '') +
              ' ' +
              (dashboardList?.employeeDetails?.lastName ?? '')
            }
            designation={dashboardList?.employeeDetails?.designationName ?? ''}
            onBellPress={() => {}}
          />
          <View style={styles.innerContainer}>
            {/* ✅ ADDED BACK: Render projects, but from our static local data */}
            <ProjectList
              onRefresh={() => {
                // still hits APIs but UI remains from static list
                sync();
                getDashboardData(true);
              }}
              data={uiProjects} // 🔁 CHANGED: show ONLY custom local project
              desc={dashboardList?.mobileAppVersion1?.description ?? ''}
              code={dashboardList?.mobileAppVersion?.version_code ?? ''}
            />
          </View>
          {!showPrivacy && (
            <LocationPermission
              show={showLocationSheet}
              onAllowPress={() => setShowLocationSheet(false)}
              onPrivacyPress={() => {
                setShowPrivacy(true);
                navigation.getParent()?.navigate('PrivacyPolicy');
              }}
            />
          )}
          {currentAddress ? (
            <View style={{paddingHorizontal: 16, paddingVertical: 8}}>
              <Text style={{color: COLORS.PRIMARY, fontSize: 14}}>
                📍 {currentAddress}
              </Text>
            </View>
          ) : null}
          <SyncOfflineDataSheet
            show={showSync}
            onSyncPress={() => syncOfflineData()}
          />
        </>
      )}
    </Screen>
  );
};

const MapStateToProps = (state: RootState) => ({
  loading:
    state.dashboard.loading === 'pending' ||
    state.attendance.onBehalfLoading === 'pending',
  dashboardList: state.dashboard.dashboardList,
});
export default connect(MapStateToProps)(Home);

// ====== STYLES ======
const styles = StyleSheet.create({
  globe: {
    width: SIZE.MS(200),
    height: SIZE.MS(200),
    alignSelf: 'center',
    resizeMode: 'contain',
    tintColor: COLORS.PRIMARY,
    marginVertical: SIZE.MVS(10),
  },
  logoView: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: SIZE.MS(10),
    borderRadius: SIZE.MS(6),
    backgroundColor: COLORS.WHITE,
    paddingHorizontal: SIZE.MS(15),
    paddingVertical: SIZE.MS(10),
    marginHorizontal: SIZE.MS(5),
    ...STYLES.SHADOW_PRIMARY_3,
    height: SIZE.MVS(65),
  },
  devButtonView: {
    height: SIZE.MVS(30),
    borderRadius: SIZE.MS(6),
    paddingHorizontal: SIZE.MS(10),
  },
  vcButtonView: {
    height: SIZE.MVS(30),
    borderRadius: SIZE.MS(6),
    paddingHorizontal: SIZE.MS(10),
    backgroundColor: COLORS.PRIMARY,
    borderWidth: 0,
  },
  logoNameView: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: {
    width: SIZE.MS(35),
    height: SIZE.MS(35),
    resizeMode: 'contain',
    marginHorizontal: SIZE.MS(10),
  },
  logoNameText: {
    fontFamily: FONTS.REGULAR,
    fontSize: SIZE.MVS(20),
    color: COLORS.PRIMARY_DARK,
  },

  subModuleItemView: {margin: 5},
  subModuleListContainer: {flexDirection: 'row', flexWrap: 'wrap'},
  innerContainer: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND_DEFAULT,
    padding: 15,
  },
  moduleCardContainer: {
    flex: 1,
  },
  moduleCardImageContainer: {
    backgroundColor: COLORS.WHITE,
    borderRadius: SIZE.MS(12),
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    padding: SIZE.MS(5),
    marginVertical: SIZE.MS(5),
    ...STYLES.SHADOW_PRIMARY_3,
  },
  moduleCardImage: {
    width: SIZE.MS(40),
    height: SIZE.MS(40),
    margin: SIZE.MS(10),
    resizeMode: 'contain',
  },
  moduleCardTitleText: {
    fontFamily: FONTS.REGULAR,
    fontSize: SIZE.MVS(11),
    color: COLORS.TEXT_DARK,
    textAlign: 'center',
    marginTop: SIZE.MS(5),
  },
  devider: {
    height: 1,
    backgroundColor: COLORS.BORDER_DEFAULT,
    marginVertical: SIZE.MS(10),
    marginHorizontal: SIZE.MS(5),
  },
  moduleTitleText: {
    fontFamily: FONTS.MEDIUM,
    fontSize: SIZE.MVS(14),
    color: COLORS.PRIMARY,
    margin: SIZE.MS(10),
  },

  updateScreen: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND_DEFAULT,
    paddingHorizontal: SIZE.MS(16),
    paddingVertical: SIZE.MS(24),
    justifyContent: 'center',
    alignItems: 'center',
  },
  updateScreenInner: {
    width: '100%',
    maxWidth: 420,
  },
  updateCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: SIZE.MS(12),
    paddingVertical: SIZE.MS(20),
    paddingHorizontal: SIZE.MS(16),
    ...STYLES.SHADOW_PRIMARY_3,
  },
  updateTitle: {
    fontFamily: FONTS.MEDIUM,
    fontSize: SIZE.MVS(22),
    color: COLORS.PRIMARY_DARK,
    marginBottom: SIZE.MS(10),
    textAlign: 'center',
  },
  updateSubtitle: {
    fontFamily: FONTS.REGULAR,
    fontSize: SIZE.MVS(14),
    color: COLORS.TEXT_DARK,
    marginBottom: SIZE.MS(16),
    lineHeight: SIZE.MVS(20),
    textAlign: 'center',
  },
  updateBtn: {
    alignSelf: 'center',
    paddingHorizontal: SIZE.MS(18),
    height: SIZE.MVS(44),
    borderRadius: SIZE.MS(10),
    marginTop: SIZE.MS(6),
    marginBottom: SIZE.MS(10),
  },
  updateNote: {
    marginTop: SIZE.MS(6),
    marginBottom: SIZE.MS(6),
    fontSize: SIZE.MVS(12),
    color: COLORS.TEXT_LIGHT,
    textAlign: 'center',
  },
});
