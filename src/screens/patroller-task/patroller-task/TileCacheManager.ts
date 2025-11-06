/*
 @ 𝔸𝕦𝕥𝕙𝕠𝕣: ℙ𝕒𝕟𝕜𝕒𝕛 𝕂𝕦𝕞𝕒𝕣 ℙ𝕣𝕒𝕛𝕒𝕡𝕒𝕥𝕚
 @ 𝔼𝕞𝕒𝕚𝕝: 𝕡𝕜𝕡𝕣𝕒𝕛𝕒𝕡𝕒𝕥𝕚𝟙𝟙𝟡𝟡𝟟@𝕘𝕞𝕒𝕚𝕝.𝕔𝕠𝕞
 */
import { Common, Preferences } from '@utils';
import RNFS from 'react-native-fs';
import NetInfo from '@react-native-community/netinfo';

export type ProgressCallback = (total: number, percent: number) => void;

interface TileCoord {
  zoom: number;
  x: number;
  y: number;
}

export class TileCacheManager {
  public static downloading = false;
  private static cacheDir = `${RNFS.DocumentDirectoryPath}/mapTiles`;

  static async downloadTiles(
    latitude: number,
    longitude: number,
    zoomLevels: number[],
    onProgress?: ProgressCallback,
  ): Promise<void> {
    return new Promise(async (resolve) => {
      if (TileCacheManager.downloading) {
        Common.log('⏳ Download already in progress.');
        return;
      }

      const net = await NetInfo.fetch();
      if (!net.isConnected || !net.isInternetReachable) {
        Common.warn('🚫 No internet connection. Skipping tile download.');
        return;
      }

      TileCacheManager.downloading = true;
      await RNFS.mkdir(TileCacheManager.cacheDir);

      const tiles: TileCoord[] = [];
      for (const zoom of zoomLevels) {
        const { x, y } = TileCacheManager.getTileCoordinates(latitude, longitude, zoom);

        // Set a larger radius for higher zooms
        const radius = zoom >= 16 ? 10 : zoom >= 13 ? 5 : 2;

        for (let i = -radius; i <= radius; i++) {
          for (let j = -radius; j <= radius; j++) {
            tiles.push({ zoom, x: x + i, y: y + j });
          }
        }
      }

      const downloadedTiles = Preferences.getData('TILE_CACHE_PROGRESS') || [];
      const downloadedSet = new Set(downloadedTiles as string[]);

      const total = tiles.length;
      // Common.log('Total Tiles:', total);
      let done = downloadedSet.size;

      const queue = [...tiles];
      const CONCURRENCY = 4;

      async function worker() {
        while (queue.length > 0) {
          const tile = queue.shift();
          if (!tile) { return; }

          const key = `${tile.zoom}_${tile.x}_${tile.y}`;
          const tileDir = `${TileCacheManager.cacheDir}/${tile.zoom}/${tile.x}`;
          const tilePath = `${tileDir}/${tile.y}.png`;

          if (downloadedSet.has(key)) {
            Common.log(`🔁 Skipping already downloaded: ${key}`);
            continue;
          }

          try {
            const exists = await RNFS.exists(tilePath);
            if (!exists) {
              Common;
              await RNFS.mkdir(tileDir, { NSURLIsExcludedFromBackupKey: true });
              // Common.log('Downloa Tile Path:', tilePath);
              await RNFS.downloadFile({
                fromUrl: `https://c.tile.openstreetmap.org/${tile.zoom}/${tile.x}/${tile.y}.png`,
                toFile: tilePath,
                headers: {
                  'User-Agent': 'GigatelOfflineMap/1.0 (https://gigatel.com)',
                },
              }).promise;
              // Common.log('Downloaded:', tilePath);
            } else {
              Common.warn('Already Downloaded:', tilePath);
            }

            downloadedSet.add(key);
            done++;
            Preferences.setData('TILE_CACHE_PROGRESS', Array.from(downloadedSet));

            const prg = done;//Math.round((done / total) * 100);
            onProgress?.(total, prg);
          } catch (e) {
            Common.warn(`❌ Failed to download tile ${key}`, e);
          }
        }
      }

      const workers = Array.from({ length: CONCURRENCY }, () => worker());
      await Promise.all(workers);

      TileCacheManager.downloading = false;
      Preferences.setData('IS_MAP_DOWNLOADED', 'yes');
      resolve();
    });
  }

  static getTileCoordinates(lat: number, lon: number, zoom: number) {
    const tileX = Math.floor(((lon + 180) / 360) * Math.pow(2, zoom));
    const tileY = Math.floor(
      ((1 - Math.log(Math.tan((lat * Math.PI) / 180) + 1 / Math.cos((lat * Math.PI) / 180)) / Math.PI) / 2) *
      Math.pow(2, zoom),
    );
    return { x: tileX, y: tileY };
  }

  static async resetCache() {
    try {
      Preferences.removeData('TILE_CACHE_PROGRESS');
      Preferences.removeData('IS_MAP_DOWNLOADED');
      TileCacheManager.downloading = false;
      // await RNFS.unlink(TileCacheManager.cacheDir);
      Common.log('♻️ Tile cache cleared.');
    } catch (e) {
      Common.warn('Failed to reset tile cache', e);
    }
  }
}

