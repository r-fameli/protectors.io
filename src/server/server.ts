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
  });

  socket.on(Constants.MSG_TYPES.INPUT, (data: { direction?: number; isMoving?: boolean }) => {
    game.handleInput(socket, data);
  });

  socket.on('disconnect', () => {
    console.log('Player disconnected');
    game.removePlayer(socket);
  });
});
