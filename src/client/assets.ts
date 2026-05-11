const ASSET_NAMES = [
  'bullet.svg',
  'portal.png',
  'player.png',
];

const assets: Record<string, HTMLImageElement> = {};

const downloadPromise = Promise.all(ASSET_NAMES.map(downloadAsset));

function downloadAsset(assetName: string): Promise<void> {
  return new Promise(resolve => {
    const asset = new Image();
    asset.onload = () => {
      assets[assetName] = asset;
      resolve();
    };
    asset.src = `/assets/${assetName}`;
  });
}

export const downloadAssets = () => downloadPromise;

export const getAsset = (assetName: string): HTMLImageElement => assets[assetName];
