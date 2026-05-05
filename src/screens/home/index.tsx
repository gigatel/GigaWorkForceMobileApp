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
import NetInfo from '@react-native-community/netinfo';
import {useFocusEffect} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootState, StoreDispatch} from '@reducers';
import {COLORS, CONSTANT, FONTS, IMAGES, SIZE, STYLES} from '@res';
import {dashboardListApi, getLoginTokenApi} from '@slices/dashboard.slice';
import {DataType, ScreenProps} from '@types';
import {
  postOnceIfDue,
  attachPosterDispatch,
} from '../../services/LocationPosterCore';
import {
  startForegroundPoster,
  stopForegroundPoster,
  restartForegroundPoster,
} from '../../services/ForegroundLocationPoster';
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
  TouchableOpacity,
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

// ===== iOS OTA helpers =====
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
  u = u.replace(/([^:])\/{2,}/g, '$1/');
  return u;
};

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

// ===== Navigation for sub-modules =====
const moduleNavigation = (item: DataType.SubModule) => {
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
  } else if (check(item.subModuleName, 'SearchCustomer')) {
    navigator?.getParent()?.navigate('PKP');
  } else if (__DEV__) {
    navigator.navigate('DeveloperPKPScreen');
  } else {
    Common.showToast(item.subModuleName + ' is Under Development');
  }
};

// ===== UI Components =====
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
  }) => (
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
  ),
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

const LogoView = ({desc}: {desc: string; verCode?: string}) => (
  <>
    <Animiatable.Image
      useNativeDriver
      iterationCount="infinite"
      animation="swing"
      source={IMAGES.globe}
      style={styles.globe}
    />
    <View style={styles.logoView}>
      <Buttons type="primary" title={'PROD'} viewStyle={styles.devButtonView} />
      <View style={styles.logoNameView}>
        <Image source={IMAGES.appLogo} style={styles.logoImage} />
      </View>
      <Buttons
        type="primary"
        title={`V ${Common.getAppVersion()}`}
        viewStyle={styles.vcButtonView}
      />
    </View>
  </>
);

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
    {downloading && (
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
    )}
    <Buttons
      type="primary"
      title={downloading ? 'Downloading…' : 'Update Now'}
      onPress={() => void onUpdatePress()}
      viewStyle={styles.updateBtn}
    />
  </View>
);

// ===== Main Home Component =====
const Home: FC<ScreenProps.Home> = ({loading, dashboardList, navigation}) => {
  navigator = navigation;

  const [showLocationSheet, setShowLocationSheet] = useState(false);
  const [isLoading, setisLoading] = useState(false);
  const [showSync, setShowSync] = useState(false);
  const [currentAddress, setCurrentAddress] = useState('');
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [forcedUpdateRequired, setForcedUpdateRequired] = useState(false);

  const [dlActive, setDlActive] = useState<boolean>(false);
  const [dlPercent, setDlPercent] = useState<number>(0);
  const [dlDownloaded, setDlDownloaded] = useState<number>(0);
  const [dlTotal, setDlTotal] = useState<number>(-1);

  const locationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const dispatch = useDispatch<StoreDispatch>();

  // ===== Static tickets project =====
  const TICKET_ICON = 'https://img.icons8.com/ios-filled/100/ticket--v3.png';
  const uiProjects = useMemo<DataType.Project[]>(
    () => [
      {
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
      } as unknown as DataType.Project,
    ],
    [],
  );

  // ===== Version info =====
  const appVersionName = DeviceInfo.getVersion();
  const appBuildNumber = DeviceInfo.getBuildNumber();
  const serverVersionCode =
    dashboardList?.mobileAppVersion1?.version_code ??
    dashboardList?.mobileAppVersion?.version_code;

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

  const hideDashboardModules = forcedUpdateRequired;

  // ===== Core service starter =====
  // ✅ Does NOT guard with "already running" — uses restartForegroundPoster
  // so background→foreground always re-attaches the watcher
  const ensurePostingServices = useCallback(async () => {
    try {
      attachDispatch(dispatch);
      attachPosterDispatch(dispatch);
      restartForegroundPoster(); // ✅ sirf restart karta hai agar band tha
    } catch (e) {
      __DEV__ && console.warn('[Home] ensurePostingServices failed', e);
    }
  }, [dispatch]);

  const handleStartService = useCallback(async () => {
    const res = await Location.checkPermission();
    if (res) {
      await Location.initializeConfig();
      await Services.startLocationService();
      await ensurePostingServices();
    }
  }, [ensurePostingServices]);

  const getDashboardData = useCallback(
    (refresh: boolean) => {
      dispatch(dashboardListApi({isRefresh: refresh}));
    },
    [dispatch],
  );

  const sync = useCallback(() => {
    const lastAtt = Preferences.getData('OFFLINE_ATTENDANCE');
    NetInfo.fetch().then(state => {
      if (state.isConnected && lastAtt && lastAtt.length > 0) {
        setShowSync(true);
      }
    });
  }, []);

  // ===== EFFECT 1: One-time mount setup =====
  // Login token, permissions, dashboard data, location sheet
  useEffect(() => {
    Common.warn('DEVELOPER_NAME::', DEVELOPER_NAME);
    dispatch(getLoginTokenApi());
    Permissions.requestPermission();
    handleStartService();
    getDashboardData(false);
    setShowLocationSheet(
      Preferences.getData('ALLOWED_ACCESS_FOR_LOCATION_BACKGROUND') !== 'yes',
    );
  }, [dispatch, handleStartService, getDashboardData]);
  // ===== EFFECT 4: AppState — sirf active pe restart =====
  useEffect(() => {
    const sub = AppState.addEventListener('change', async state => {
      __DEV__ && console.log('[AppState]', state);

      if (state === 'active') {
        // ✅ App foreground mein aaya — watcher restart karo agar band tha
        try {
          await ensurePostingServices(); // restartForegroundPoster call hoga
          await postOnceIfDue('fg', dispatch);
        } catch (e) {
          __DEV__ && console.warn('[AppState active] failed', e);
        }
      }
      // ✅ 'background' aur 'inactive' pe KUCH NAHI — watcher chalta rehne do
    });
    return () => sub.remove();
  }, [ensurePostingServices, dispatch]);

  // ===== EFFECT 2: Initial address fetch + first location post =====
  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        const hasPermission = await Location.checkPermission();
        if (!hasPermission) {
          const granted = await Permissions.requestPermission();
          if (!granted) return;
        }
        const geo =
          (await Location.getAddressFromLatLong()) as DataType.GeoAddress;
        if (geo?.lat && geo?.long) {
          Preferences.setData(Preferences.KEY.LAST_GEO_ADDRESS, {
            lat: geo.lat,
            long: geo.long,
            address: geo.address ?? '',
          });
          await postOnceIfDue('fg', dispatch);
        }
      } catch (err) {
        __DEV__ && console.warn('[Home] initial address fetch error:', err);
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [dispatch]);

  // ===== EFFECT 3: Address polling for UI (every 5s) =====
  useEffect(() => {
    const interval = setInterval(() => {
      const addrData = Preferences.getData(Preferences.KEY.LAST_GEO_ADDRESS);
      if (addrData?.address && addrData.address !== currentAddress) {
        setCurrentAddress(addrData.address);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [currentAddress]);

  // ===== EFFECT 4: AppState — restart services on foreground =====
  // useEffect(() => {
  //   const sub = AppState.addEventListener('change', async state => {
  //     __DEV__ && console.log('[AppState]', state);
  //     if (state === 'active') {
  //       // ✅ Only restart on 'active' (returning to foreground), not every state
  //       try {
  //         await ensurePostingServices();
  //         await postOnceIfDue('fg', dispatch);
  //       } catch (e) {
  //         __DEV__ && console.warn('[BG] AppState ensure failed', e);
  //       }
  //     }
  //     if (state === 'background') {
  //       // ✅ Stop the watcher when going to background to save battery
  //       stopForegroundPoster();
  //     }
  //   });
  //   return () => sub.remove();
  // }, [ensurePostingServices, dispatch]);

  // ===== EFFECT 5: APK installer events (Android) =====
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

  // ===== EFFECT 6: Force-update pref sync =====
  useEffect(() => {
    Preferences.setData(
      'FORCE_UPDATE_REQUIRED',
      hideDashboardModules ? 'yes' : 'no',
    );
  }, [hideDashboardModules]);
  useEffect(() => {
    void ensurePostingServices();
  }, [ensurePostingServices]); //
  // ===== EFFECT 7: Version check when dashboard loads =====
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

  // ===== EFFECT 8: Tab press guard during forced update =====
  useEffect(() => {
    const parent = navigation?.getParent?.();
    if (!parent || typeof parent.addListener !== 'function') return;
    const unsub = parent.addListener('tabPress', (e: any) => {
      try {
        const isForce = Preferences.getData('FORCE_UPDATE_REQUIRED') === 'yes';
        if (!isForce) return;
        e.preventDefault?.();
        Common.showToast('Update required — other tabs are disabled.');
      } catch {}
    });
    return () => {
      if (typeof unsub === 'function') unsub();
    };
  }, [navigation]);

  // ===== FOCUS EFFECT 1: Main location + interval =====
  // ✅ Single consolidated focus effect — starts services, posts immediately, sets interval
  useFocusEffect(
    useCallback(() => {
      setShowPrivacy(false);
      sync();

      const startFlow = async () => {
        try {
          await ensurePostingServices(); // restart watcher
          await postOnceIfDue('fg', dispatch); // immediate post on focus
        } catch (e) {
          __DEV__ && console.warn('[Home] focus flow failed', e);
        }
      };

      startFlow();

      // Post every 30s while screen is focused
      if (locationTimerRef.current) clearInterval(locationTimerRef.current);
      locationTimerRef.current = setInterval(async () => {
        try {
          await postOnceIfDue('fg', dispatch);
        } catch (e) {
          __DEV__ && console.warn('[Home] interval post failed', e);
        }
      }, 30_000);

      return () => {
        if (locationTimerRef.current) {
          clearInterval(locationTimerRef.current);
          locationTimerRef.current = null;
        }
      };
    }, [ensurePostingServices, dispatch, sync]),
  );

  // ===== FOCUS EFFECT 2: Hardware back — exit app =====
  useFocusEffect(
    useCallback(() => {
      const handler = BackHandler.addEventListener('hardwareBackPress', () => {
        BackHandler.exitApp();
        return true;
      });
      return () => handler.remove();
    }, []),
  );

  // ===== FOCUS EFFECT 3: Attendance check =====
  useFocusEffect(
    useCallback(() => {
      if (
        dashboardList?.employeeDetails?.id &&
        dashboardList.employeeDetails.companyId
      ) {
        // dispatch attendance API here if needed
      }
    }, [
      dashboardList?.employeeDetails?.companyId,
      dashboardList?.employeeDetails?.id,
      dispatch,
    ]),
  );

  // ===== Update press handler =====
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
    try {
      const canInstall =
        await NativeModules.ApkInstaller?.canRequestPackageInstalls();
      if (!canInstall) {
        Common.warn('Allow "Install unknown apps" for this app to continue.');
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
          '\n\nIf you still see "App not installed – package conflicts", ' +
          'the existing app is signed with a different key or has a different packageId. ' +
          'Use the same keystore & package, and ensure versionCode is higher, or uninstall once.',
      });
    }
  }, [forcedAccessUrl, forcedVersionName]);

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

  // ===== Render =====
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
            zonename={dashboardList?.employeeDetails?.zoneName ?? ''}
            onBellPress={() => {
              navigator?.getParent()?.navigate('Notifications');
            }}
          />
          <View style={styles.innerContainer}>
            <ProjectList
              onRefresh={() => {
                sync();
                getDashboardData(true);
              }}
              data={uiProjects}
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
  moduleCardContainer: {flex: 1},
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
  updateScreenInner: {width: '100%', maxWidth: 420},
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
