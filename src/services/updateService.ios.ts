// src/services/updateService.ios.ts
import { Linking, Alert, Platform, ActionSheetIOS } from 'react-native';

const toHttps = (u: string) => u.replace(/^http:\/\//i, 'https://');
const isItms = (u: string) => /^itms-services:\/\//i.test(u);
const isPlist = (u: string) => /\.plist(\?.*)?$/i.test(u);
const isIpa = (u: string) => /\.ipa(\?.*)?$/i.test(u);

// if you host manifest right next to ipa with same name, e.g. MyApp.ipa -> MyApp.plist
const deriveManifestFromIpa = (ipaUrl: string) => ipaUrl.replace(/\.ipa(\?.*)?$/i, '.plist');

const itmsFromManifest = (manifestUrl: string) =>
  `itms-services://?action=download-manifest&url=${encodeURIComponent(toHttps(manifestUrl))}`;

/**
 * Open Ad-Hoc installer flow from a server-provided `accessUrl`.
 * Accepted inputs:
 * - itms-services://?action=download-manifest&url=...
 * - https://.../manifest.plist
 * - https://.../MyApp.ipa   (we'll try .plist next to it)
 * - https://.../landing.html (must contain a link to itms-services)
 */
export async function openOtaFromAccessUrl(accessUrl: string) {
  if (Platform.OS !== 'ios') return;

  if (!accessUrl || typeof accessUrl !== 'string') {
    Alert.alert('Update', 'Update URL not found.');
    return;
  }

  let url = accessUrl.trim();

  // case A: already itms-services
  if (isItms(url)) {
    try {
      const can = await Linking.canOpenURL(url);
      if (can) { await Linking.openURL(url); return; }
    } catch {}
  }

  // normalize to https for web links
  if (!isItms(url)) url = toHttps(url);

  // case B: direct manifest.plist -> convert to itms-services
  if (isPlist(url)) {
    const itms = itmsFromManifest(url);
    try {
      const can = await Linking.canOpenURL(itms);
      if (can) { await Linking.openURL(itms); return; }
    } catch {}
  }

  // case C: server sent raw .ipa (not installable directly)
  if (isIpa(url)) {
    // try friendly guess: same path with .plist
    const guessPlist = deriveManifestFromIpa(url);
    const itms = itmsFromManifest(guessPlist);
    try {
      const can = await Linking.canOpenURL(itms);
      if (can) { await Linking.openURL(itms); return; }
    } catch {}

    // final: ask backend to provide a manifest or landing page
    Alert.alert(
      'Cannot Install Directly',
      'iOS needs a manifest (.plist) or a landing page with an itms-services link. ' +
      'Please host a manifest next to the IPA (same name, .plist) or return a manifest URL in access_url.'
    );
    return;
  }

  // case D: normal https landing page (should contain a link to itms-services)
  try {
    await Linking.openURL(url); // opens Safari
  } catch {
    ActionSheetIOS.showShareActionSheetWithOptions(
      { url, message: 'Open this link in Safari to install the app' },
      () => {},
      () => {}
    );
    Alert.alert('Install', `Open in Safari:\n${url}`);
  }
}
