interface ConstantsType {
  PLAYER_RADIUS: number;
  PLAYER_MAX_HP: number;
  PLAYER_SPEED: number;
  PLAYER_FIRE_COOLDOWN: number;
  BULLET_RADIUS: number;
  BULLET_SPEED: number;
  BULLET_DAMAGE: number;
  SCORE_PER_SECOND: number;
  MAP_SIZE: number;
  TREE_MAX_HP: number;
  MSG_TYPES: {
    JOIN_GAME: string;
    GAME_UPDATE: string;
    INPUT: string;
    GAME_OVER: string;
  };
}

const Constants: ConstantsType = Object.freeze({
  PLAYER_RADIUS: 40,
  PLAYER_MAX_HP: 100,
  PLAYER_SPEED: 400,
  PLAYER_FIRE_COOLDOWN: 0.25,
  BULLET_RADIUS: 3,
  BULLET_SPEED: 800,
  BULLET_DAMAGE: 10,
  SCORE_PER_SECOND: 1,
  MAP_SIZE: 4000,
  TREE_MAX_HP: 1000,
  MSG_TYPES: {
    JOIN_GAME: 'join_game',
    GAME_UPDATE: 'update',
    INPUT: 'input',
    GAME_OVER: 'dead',
  },
});

export default Constants;
