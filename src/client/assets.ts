const ASSET_NAMES = [
  'player.png',
  'mobs/lumberjack.png',
  'mobs/chainsawer.png',
  'mobs/loghouse.png',
  'mobs/foreman.png',
  'mobs/harvester.png',
  'objects/tree.png',
  'objects/exp.png',
  'projectiles/bullet.svg',
  'projectiles/caltrop.png',
  'weapons/turret-base.png',
  'weapons/turret-head.png',
  'weapons/springer.png',
  'weapons/spider.png',
  'areas/spiderweb.png',
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
