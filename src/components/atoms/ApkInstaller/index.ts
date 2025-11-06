// src/native/ApkInstaller.ts
import { NativeModules, NativeEventEmitter } from 'react-native';

const { ApkInstaller } = NativeModules as {
  ApkInstaller: {
    installWithProgress?: (apkPath: string) => Promise<boolean>;
    addListener?: (e: string) => void;
    removeListeners?: (n: number) => void;
  };
};

const emitter = new NativeEventEmitter(NativeModules.ApkInstaller);

export type ProgressHandler = (percent: number) => void;
export type ResultHandler = (status: number, message?: string) => void;

/**
 * Starts install and wires native progress/result events.
 * Resolves once the native method is invoked (result will come via callback).
 */
export async function installWithProgress(
  apkPath: string,
  onProgress?: ProgressHandler,
  onResult?: ResultHandler
) {
  const subs: Array<{ remove: () => void }> = [];

  if (onProgress) {
    subs.push(
      emitter.addListener('ApkInstallerProgress', (e: { percent?: number }) => {
        onProgress(e?.percent ?? 0);
      })
    );
  }
  if (onResult) {
    subs.push(
      emitter.addListener('ApkInstallerResult', (e: { status?: number; message?: string }) => {
        onResult(e?.status ?? -1, e?.message);
        // auto cleanup
        subs.forEach(s => s.remove());
      })
    );
  }

  if (typeof ApkInstaller.installWithProgress !== 'function') {
    throw new Error('installWithProgress is not available in native module');
  }

  try {
    await ApkInstaller.installWithProgress(apkPath);
  } catch (e) {
    subs.forEach(s => s.remove());
    throw e;
  }
}
