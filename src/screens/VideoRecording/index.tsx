import React, {useCallback, useMemo, useRef, useState, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  PanResponder,
  Platform,
  DeviceEventEmitter,
} from 'react-native';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
  useMicrophonePermission,
  type CameraPosition,
  type VideoFile,
} from 'react-native-vision-camera';
import Slider from '@react-native-community/slider';
import {useRoute, useNavigation} from '@react-navigation/native';
import RNFS from 'react-native-fs';
import {Common} from '@utils';
import {SIZE} from '@res';
const Button = ({
  label,
  onPress,
  disabled,
  variant = 'primary',
}: {
  label: string;
  onPress?: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary';
}) => (
  <TouchableOpacity
    onPress={onPress}
    disabled={disabled}
    style={[
      styles.btn,
      variant === 'primary' ? styles.primaryBtn : styles.secondaryBtn,
      disabled && {opacity: 0.5},
    ]}
    activeOpacity={0.8}>
    <Text style={styles.btnText}>{label}</Text>
  </TouchableOpacity>
);

type VideoRecorderRouteParams = {
  projectId?: string;
};

const BYTES_PER_MB = 1024 * 1024;
const toMB = (n?: number | null) =>
  typeof n === 'number' && isFinite(n) ? n / BYTES_PER_MB : 0;
const EVENT_VIDEO_READY = 'VIDEO_READY_EVENT';
const ANDROID_TARGET_KBPS = 1_200_000;
const ANDROID_USE_HEVC =
  Platform.OS === 'android' && Number(Platform.Version) >= 24;
const VideoRecorder: React.FC = () => {
  const cameraRef = useRef<Camera>(null);
  const {hasPermission: hasCamPerm, requestPermission: requestCamPerm} =
    useCameraPermission();
  const {hasPermission: hasMicPerm, requestPermission: requestMicPerm} =
    useMicrophonePermission();

  const [position, setPosition] = useState<CameraPosition>('back');
  const device = useCameraDevice(position);

  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [video, setVideo] = useState<VideoFile | null>(null);
  const [savedVideoUri, setSavedVideoUri] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [permissionLoading, setPermissionLoading] = useState(false);

  const [estimatedSize, setEstimatedSize] = useState(0);
  const [recordingTime, setRecordingTime] = useState(0);
  const sizeLimit = 30 * 1024 * 1024;

  const [zoom, setZoom] = useState(1);
  const [showZoomControls, setShowZoomControls] = useState(false);
  const [initialZoom, setInitialZoom] = useState(1);
  const [initialDistance, setInitialDistance] = useState(0);

  const ready = useMemo(
    () => !!device && hasCamPerm && hasMicPerm,
    [device, hasCamPerm, hasMicPerm],
  );

  const route = useRoute<any>();
  const navigation = useNavigation();
  const {projectId} = (route.params ?? {}) as VideoRecorderRouteParams;

  // Pick the smallest format (pref ≤ 640×480), same as before.
  const lowFormat = useMemo(() => {
    if (!device?.formats?.length) return undefined;
    const sorted = [...device.formats].sort((a, b) => {
      const aPixels = (a.videoWidth ?? 0) * (a.videoHeight ?? 0);
      const bPixels = (b.videoWidth ?? 0) * (b.videoHeight ?? 0);
      if (aPixels !== bPixels) return aPixels - bPixels;
      return (a.maxFps ?? 30) - (b.maxFps ?? 30);
    });
    const vga = sorted.find(
      f =>
        (f.videoWidth ?? 0) <= 640 &&
        (f.videoHeight ?? 0) <= 480 &&
        (f.videoWidth ?? 0) > 0 &&
        (f.videoHeight ?? 0) > 0,
    );
    return vga ?? sorted[0];
  }, [device]);

  // ↓↓↓ For smaller size on Android, prefer the **lowest FPS** supported by the chosen format.
  const targetFps = useMemo(() => {
    if (!lowFormat) return Platform.OS === 'android' ? 20 : 24;
    const min = lowFormat.minFps ?? (Platform.OS === 'android' ? 15 : 24);
    const max = lowFormat.maxFps ?? 30;
    const wanted = Platform.OS === 'android' ? min : 24;
    return Math.min(Math.max(wanted, min), max);
  }, [lowFormat]);

  // Promise bridge for finished file
  const finishedResolverRef = useRef<null | ((file: VideoFile) => void)>(null);
  const finishedRejecterRef = useRef<null | ((err: any) => void)>(null);
  const waitForFinishedFile = useCallback(() => {
    return new Promise<VideoFile>((resolve, reject) => {
      finishedResolverRef.current = resolve;
      finishedRejecterRef.current = reject;
    });
  }, []);

  // pinch zoom
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gs) => gs.numberActiveTouches === 2,
      onPanResponderGrant: (evt, gs) => {
        if (gs.numberActiveTouches === 2) {
          setInitialZoom(zoom);
          const [a, b] = evt.nativeEvent.touches;
          const dist = Math.hypot(a.pageX - b.pageX, a.pageY - b.pageY);
          setInitialDistance(dist);
        }
      },
      onPanResponderMove: (evt, gs) => {
        if (gs.numberActiveTouches === 2 && initialDistance > 0) {
          const [a, b] = evt.nativeEvent.touches;
          const currentDistance = Math.hypot(
            a.pageX - b.pageX,
            a.pageY - b.pageY,
          );
          const scale = currentDistance / initialDistance;
          const newZoom = Math.min(
            Math.max(1, initialZoom * scale),
            device?.maxZoom || 10,
          );
          setZoom(newZoom);
        }
      },
    }),
  ).current;

  // rough size ticker (unchanged)
  useEffect(() => {
    if (isRecording && !isPaused) {
      const interval = setInterval(() => {
        setRecordingTime(prev => prev + 0.1);
        const estimated = (1 * 1024 * 1024 * (recordingTime / 60)) / 8;
        setEstimatedSize(estimated);
        if (estimated >= sizeLimit * 0.95) {
          onStop();
          Common.alert({
            title: 'Recording Stopped',
            msg: 'Your video is approaching the 30MB size limit.',
          });
        }
      }, 100);
      return () => clearInterval(interval);
    }
  }, [isRecording, isPaused, recordingTime]); // eslint-disable-line react-hooks/exhaustive-deps

  const ensurePermissions = useCallback(async () => {
    try {
      setPermissionLoading(true);
      setError(null);
      if (!hasCamPerm) await requestCamPerm();
      if (!hasMicPerm) await requestMicPerm();
    } catch (e) {
      setError('Permission request failed');
    } finally {
      setPermissionLoading(false);
    }
  }, [hasCamPerm, hasMicPerm, requestCamPerm, requestMicPerm]);

  const onStart = useCallback(async () => {
    setError(null);
    setVideo(null);
    setSavedVideoUri(null);
    setEstimatedSize(0);
    setRecordingTime(0);

    try {
      if (!cameraRef.current) return;
      setIsRecording(true);

      finishedResolverRef.current = null;
      finishedRejecterRef.current = null;

      // ---- ANDROID SIZE TUNING ----
      // We prefer HEVC (H.265) when available; otherwise fall back to H.264.
      const androidCodec = ANDROID_USE_HEVC
        ? ('hevc' as const)
        : ('h264' as const);
      const iosCodec = 'h264' as const;

      // Some VisionCamera versions don’t type `videoBitRate`; casting to any is safe at runtime.
      const recordingOptions: any = {
        fileType: 'mp4',
        videoCodec: Platform.OS === 'android' ? androidCodec : iosCodec,
        onRecordingFinished: (file: VideoFile) => {
          finishedResolverRef.current?.(file);
          finishedResolverRef.current = null;
          finishedRejecterRef.current = null;

          setVideo(file);
          setIsRecording(false);
          setIsPaused(false);
          setRecordingTime(0);
        },
        onRecordingError: (e: any) => {
          finishedRejecterRef.current?.(e);
          finishedResolverRef.current = null;
          finishedRejecterRef.current = null;

          setError(String(e));
          setIsRecording(false);
          setIsPaused(false);
          setRecordingTime(0);
        },
      };

      // ↓↓↓ Only on Android: push a **lower bitrate** for smaller files
      if (Platform.OS === 'android') {
        recordingOptions.videoBitRate = ANDROID_TARGET_KBPS; // e.g., 1.2 Mbps
        // Optional: also reduce audio bitrate slightly (if supported by your VC version)
        // recordingOptions.audioBitRate = 64_000;
      }

      await cameraRef.current.startRecording(recordingOptions);
    } catch (e: any) {
      setError(String(e?.message ?? e));
      setIsRecording(false);
      setIsPaused(false);
      setRecordingTime(0);
    }
  }, []);

  const persistVideoToDocuments = useCallback(
    async (srcPathLike: string) => {
      const srcPath = srcPathLike.startsWith('file://')
        ? srcPathLike.replace('file://', '')
        : srcPathLike;

      const dir = `${RNFS.DocumentDirectoryPath}/videos`;
      try {
        const exists = await RNFS.exists(dir);
        if (!exists) await RNFS.mkdir(dir);
      } catch {}

      const safeProject = String(projectId ?? '').replace(
        /[^a-zA-Z0-9_-]/g,
        '',
      );
      const filename = `video_${safeProject || 'proj'}_${Date.now()}.mp4`;
      const destPath = `${dir}/${filename}`;
      await RNFS.moveFile(srcPath, destPath);
      return `file://${destPath}`;
    },
    [projectId],
  );
  const onStop = useCallback(async () => {
    try {
      if (!cameraRef.current) return;

      await cameraRef.current.stopRecording();
      const file = await waitForFinishedFile();

      const originalUri = file?.path?.startsWith('file://')
        ? file.path
        : `file://${file?.path}`;
      const persistedUri = await persistVideoToDocuments(originalUri);
      setSavedVideoUri(persistedUri);

      let sizeBytes: number | undefined = undefined;
      try {
        const stat = await RNFS.stat(persistedUri.replace('file://', ''));
        sizeBytes = Number(stat.size ?? 0);
      } catch {}
      DeviceEventEmitter.emit(EVENT_VIDEO_READY, {
        uri: persistedUri,
        sizeBytes,
        durationSec: Math.round(recordingTime),
      });
      Common.showToast?.(
        'Video saved, finish your trip and tap END to upload.',
      );
      (navigation as any).goBack();
    } catch (e: any) {
      setError(String(e?.message || e));
      setIsRecording(false);
      setIsPaused(false);
      setRecordingTime(0);
    }
  }, [navigation, persistVideoToDocuments, recordingTime, waitForFinishedFile]);

  const onPause = useCallback(async () => {
    try {
      if (!cameraRef.current) return;
      await cameraRef.current.pauseRecording();
      setIsPaused(true);
    } catch {
      setError('Pause not supported on this device/OS');
    }
  }, []);

  const onResume = useCallback(async () => {
    try {
      if (!cameraRef.current) return;
      await cameraRef.current.resumeRecording();
      setIsPaused(false);
    } catch {
      setError('Resume not supported on this device/OS');
    }
  }, []);

  const flipCamera = useCallback(() => {
    setPosition(p => (p === 'back' ? 'front' : 'back'));
    setZoom(1);
  }, []);

  const toggleZoomControls = useCallback(
    () => setShowZoomControls(p => !p),
    [],
  );
  const handleZoomChange = useCallback((v: number) => setZoom(v), []);

  if (permissionLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#e11d48" />
        <Text>Checking permissions…</Text>
      </View>
    );
  }
  if (!hasCamPerm || !hasMicPerm) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Camera & Microphone Access</Text>
        <Text style={styles.hint}>
          We need permissions to record video. Tap the button below and allow
          access in the system prompt.
        </Text>
        <Button label="Grant Permissions" onPress={ensurePermissions} />
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>
    );
  }
  if (!device) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>No camera device found.</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <View style={styles.cameraWrap} {...panResponder.panHandlers}>
        <Camera
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          device={device}
          isActive
          video
          audio
          zoom={zoom}
          // ↓↓↓ keep small size by using our smallest format & low fps
          format={lowFormat}
          fps={targetFps}
          videoHdr={false}
          photoHdr={false}
          videoStabilizationMode="off"
        />

        {isRecording && (
          <View style={styles.recordingIndicator}>
            <View style={styles.recordingDot} />
            <Text style={styles.recordingText}>
              REC {Math.floor(recordingTime / 60)}:
              {(recordingTime % 60).toFixed(0).padStart(2, '0')}
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.zoomIndicator}
          onPress={toggleZoomControls}>
          <Text style={styles.zoomText}>{zoom.toFixed(1)}x</Text>
        </TouchableOpacity>

        {showZoomControls && (
          <View style={styles.zoomControls}>
            <Text style={styles.zoomLabel}>Zoom: {zoom.toFixed(1)}x</Text>
            <Slider
              style={styles.zoomSlider}
              minimumValue={1}
              maximumValue={device?.maxZoom || 10}
              value={zoom}
              onValueChange={handleZoomChange}
              minimumTrackTintColor="#e11d48"
              maximumTrackTintColor="#333"
              thumbTintColor="#e11d48"
            />
          </View>
        )}
      </View>

      {isRecording && (
        <View style={styles.sizeIndicator}>
          <View style={styles.sizeBar}>
            <View
              style={[
                styles.sizeProgress,
                {width: `${Math.min(100, (estimatedSize / sizeLimit) * 100)}%`},
              ]}
            />
          </View>
          <Text style={styles.sizeText}>
            {toMB(estimatedSize).toFixed(2)} MB / {toMB(sizeLimit).toFixed(0)}{' '}
            MB
          </Text>
        </View>
      )}

      <View style={styles.controls}>
        <View style={styles.row}>
          <Button
            label={`Flip to ${position === 'back' ? 'Front' : 'Back'}`}
            onPress={flipCamera}
            disabled={isRecording && !isPaused}
            variant="secondary"
          />
          {!isRecording ? (
            <Button label="Start Recording" onPress={onStart} />
          ) : (
            <>
              {!isPaused ? (
                <Button label="Pause" onPress={onPause} variant="secondary" />
              ) : (
                <Button label="Resume" onPress={onResume} variant="secondary" />
              )}
              <Button label="Stop" onPress={onStop} />
            </>
          )}
        </View>
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>

      {(video?.path || savedVideoUri) && (
        <View style={styles.preview}>
          <Text style={styles.title}>Recording Complete</Text>
          {savedVideoUri ? (
            <Text selectable style={styles.path}>
              Saved to: {savedVideoUri}
            </Text>
          ) : (
            <Text selectable style={styles.path}>
              Temp file: {video?.path}
            </Text>
          )}
          <Text style={styles.hint}>
            Close this screen and finish the trip. Tap END to upload.
          </Text>
        </View>
      )}
    </View>
  );
};

export default VideoRecorder;

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: '#000'},
  cameraWrap: {flex: 3, backgroundColor: '#111', overflow: 'hidden'},
  recordingIndicator: {
    position: 'absolute',
    top: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 4,
    zIndex: 10,
  },
  recordingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#e11d48',
    marginRight: 6,
  },
  recordingText: {color: '#fff', fontWeight: '600', fontSize: 12},
  zoomIndicator: {
    position: 'absolute',
    top: 20,
    left: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 4,
    zIndex: 10,
  },
  zoomText: {color: '#fff', fontWeight: '600', fontSize: 12},
  zoomControls: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 15,
    borderRadius: 8,
    zIndex: 10,
  },
  zoomLabel: {
    color: '#fff',
    marginBottom: 10,
    textAlign: 'center',
    fontWeight: '600',
  },
  zoomSlider: {width: '100%', height: 40},
  sizeIndicator: {
    padding: 12,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
  },
  sizeBar: {
    width: '100%',
    height: 6,
    backgroundColor: '#333',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 6,
  },
  sizeProgress: {height: '100%', backgroundColor: '#e11d48'},
  sizeText: {color: '#fff', fontSize: 12},
  controls: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#0a0a0a',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#222',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: Platform.OS === 'ios' ? SIZE.MS(14) : SIZE.MS(0),
  },
  btn: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: SIZE.MS(10),
    minWidth: 100,
    alignItems: 'center',
  },
  primaryBtn: {backgroundColor: '#e11d48'},
  secondaryBtn: {backgroundColor: '#333', borderWidth: 1, borderColor: '#555'},
  btnText: {color: '#fff', fontWeight: '700'},
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#000',
  },
  title: {color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 6},
  hint: {
    color: '#bbb',
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 6,
    marginBottom: 16,
  },
  error: {color: '#fca5a5', marginTop: 8, textAlign: 'center'},
  preview: {
    padding: 16,
    backgroundColor: '#0a0a0a',
    borderTopWidth: 1,
    borderTopColor: '#222',
  },
  path: {color: '#9ae6b4', fontSize: 12, marginTop: 4},
});
