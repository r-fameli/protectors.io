import express from 'express';
import webpack from 'webpack';
import webpackDevMiddleware from 'webpack-dev-middleware';
import { Server as SocketIOServer } from 'socket.io';

import Constants from '../shared/constants';
import Game from './game';

const app = express();
app.use(express.static('public'));

if (process.env.NODE_ENV === 'development') {
  const webpackConfig = require('../../webpack.dev.js');
  const compiler = webpack(webpackConfig);
  app.use(webpackDevMiddleware(compiler));
} else {
  app.use(express.static('dist'));
}

const port = process.env.PORT || 3000;
const server = app.listen(port);
console.log(`Server listening on port ${port}`);

const io = new SocketIOServer(server);

const game = new Game();

io.on('connection', socket => {
  console.log('Player connected!', socket.id);

  socket.on(Constants.MSG_TYPES.JOIN_GAME, (username: string) => {
    game.addPlayer(socket, username);
    const joinMsg = { username: 'System', text: `${username} joined` };
    Object.values(game.sockets).forEach(s => s.emit(Constants.MSG_TYPES.CHAT, joinMsg));
  });

  socket.on(Constants.MSG_TYPES.INPUT, (data: { direction?: number; isMoving?: boolean }) => {
    game.handleInput(socket, data);
  });

  socket.on(Constants.MSG_TYPES.CHOOSE_UPGRADE, (upgradeKey: string) => {
    game.handleUpgrade(socket, upgradeKey);
  });

  socket.on(Constants.MSG_TYPES.CHAT, (text: string) => {
    const player = game.players[socket.id];
    if (player && text.trim()) {
      const payload = { username: player.username, text: text.trim().slice(0, 200) };
      Object.values(game.sockets).forEach(s => s.emit(Constants.MSG_TYPES.CHAT, payload));
    }
  });

  socket.on('disconnect', () => {
    const player = game.players[socket.id];
    const name = player ? player.username : 'Unknown';
    console.log('Player disconnected', name);
    game.removePlayer(socket);
    const leaveMsg = { username: 'System', text: `${name} left` };
    Object.values(game.sockets).forEach(s => s.emit(Constants.MSG_TYPES.CHAT, leaveMsg));
  });
});
