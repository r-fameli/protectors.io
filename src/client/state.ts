const RENDER_DELAY = 100;

interface ExpOrbState {
  id: string;
  x: number;
  y: number;
  radius: number;
}

interface MobState {
  id: string;
  x: number;
  y: number;
  direction: number;
  hp: number;
  maxHp: number;
  radius: number;
  mobType: string;
}

interface DeployableState {
  type: string;
  id: string;
  x: number;
  y: number;
  direction?: number;
  radius: number;
  remainingRatio: number;
  aimDirection?: number;
}

interface ServerUpdate {
  t: number;
  me: PlayerState;
  others: PlayerState[];
  bullets: BulletState[];
  trees: TreeState[];
  mobs: MobState[];
  deployables: DeployableState[];
  caltrops: CaltropState[];
  spiders: SpiderState[];
  arrows: ArrowState[];
  expOrbs: ExpOrbState[];
}

export type WeaponType = 'turret' | 'springer' | 'spiderweb' | 'crossbow';

export interface WeaponState {
  type: WeaponType;
  cooldown: number;
  maxCooldown: number;
}

export interface UpgradeLevels {
  cooldown: number;
  range: number;
  damage: number;
}

export interface PlayerState {
  id: string;
  x: number;
  y: number;
  direction: number;
  hp: number;
  weapons: WeaponState[];
  exp: number;
  level: number;
  nextLevelExp: number;
  upgrades: UpgradeLevels;
  pendingUpgrades: number;
}

interface BulletState {
  id: string;
  x: number;
  y: number;
}

interface TreeState {
  id: string;
  x: number;
  y: number;
  radius: number;
  hp: number;
  maxHp: number;
}

interface CaltropState {
  id: string;
  x: number;
  y: number;
  radius: number;
}

interface SpiderState {
  id: string;
  x: number;
  y: number;
  direction: number;
  radius: number;
}

interface ArrowState {
  id: string;
  x: number;
  y: number;
  direction: number;
  radius: number;
}

interface GameState {
  me?: PlayerState;
  others?: PlayerState[];
  bullets?: BulletState[];
  trees?: TreeState[];
  mobs?: MobState[];
  deployables?: DeployableState[];
  caltrops?: CaltropState[];
  spiders?: SpiderState[];
  arrows?: ArrowState[];
  expOrbs?: ExpOrbState[];
}

const gameUpdates: ServerUpdate[] = [];
let gameStart = 0;
let firstServerTimestamp = 0;

export function initState() {
  gameStart = 0;
  firstServerTimestamp = 0;
}

export function processGameUpdate(update: ServerUpdate) {
  if (!firstServerTimestamp) {
    firstServerTimestamp = update.t;
    gameStart = Date.now();
  }
  gameUpdates.push(update);

  const base = getBaseUpdate();
  if (base > 0) {
    gameUpdates.splice(0, base);
  }
}

function currentServerTime(): number {
  return firstServerTimestamp + (Date.now() - gameStart) - RENDER_DELAY;
}

function getBaseUpdate(): number {
  const serverTime = currentServerTime();
  for (let i = gameUpdates.length - 1; i >= 0; i--) {
    if (gameUpdates[i].t <= serverTime) {
      return i;
    }
  }
  return -1;
}

export function getCurrentState(): GameState {
  if (!firstServerTimestamp) {
    return {};
  }

  const base = getBaseUpdate();
  const serverTime = currentServerTime();

  if (base < 0 || base === gameUpdates.length - 1) {
    const latestUpdate = gameUpdates[gameUpdates.length - 1];
    return {
      me: latestUpdate.me,
      others: latestUpdate.others || [],
      bullets: latestUpdate.bullets || [],
      trees: latestUpdate.trees || [],
      mobs: latestUpdate.mobs || [],
      deployables: latestUpdate.deployables || [],
      caltrops: latestUpdate.caltrops || [],
      spiders: latestUpdate.spiders || [],
      arrows: latestUpdate.arrows || [],
      expOrbs: latestUpdate.expOrbs || [],
    };
  } else {
    const baseUpdate = gameUpdates[base];
    const next = gameUpdates[base + 1];
    const ratio = (serverTime - baseUpdate.t) / (next.t - baseUpdate.t);
    return {
      me: interpolateObject(baseUpdate.me, next.me, ratio),
      others: interpolateObjectArray(baseUpdate.others || [], next.others || [], ratio),
      bullets: interpolateObjectArray(baseUpdate.bullets || [], next.bullets || [], ratio),
      trees: next.trees || [],
      mobs: next.mobs || [],
      deployables: next.deployables || [],
      caltrops: next.caltrops || [],
      spiders: next.spiders || [],
      arrows: next.arrows || [],
      expOrbs: next.expOrbs || [],
    };
  }
}

function interpolateObject<T>(object1: T, object2: T | undefined, ratio: number): T {
  if (!object2) {
    return object1;
  }

  const interpolated: Record<string, unknown> = {};
  (Object.keys(object1 as Record<string, unknown>)).forEach(key => {
    if (key === 'direction') {
      interpolated[key] = interpolateDirection((object1 as Record<string, number>)[key], (object2 as Record<string, number>)[key], ratio);
    }
    // FIXME: Is this case needed?
    else if (key === 'weapons') {
      interpolated[key] = (object2 as Record<string, unknown>)[key] || (object1 as Record<string, unknown>)[key];
    } else {
      interpolated[key] = (object1 as Record<string, number>)[key] + ((object2 as Record<string, number>)[key] - (object1 as Record<string, number>)[key]) * ratio;
    }
  });
  return interpolated as unknown as T;
}

function interpolateObjectArray<T extends { id: string }>(objects1: T[], objects2: T[], ratio: number): T[] {
  return objects1.map(o => {
    const corresponding = objects2.find(o2 => o2.id === o.id);
    return corresponding ? interpolateObject(o, corresponding, ratio) : o;
  });
}

function interpolateDirection(d1: number, d2: number, ratio: number): number {
  const absD = Math.abs(d2 - d1);
  if (absD >= Math.PI) {
    if (d1 > d2) {
      return d1 + (d2 + 2 * Math.PI - d1) * ratio;
    } else {
      return d1 + (d2 - 2 * Math.PI - d1) * ratio;
    }
  } else {
    return d1 + (d2 - d1) * ratio;
  }
}
