#!/usr/bin/env node
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

/* eslint-env node */

const connect = require('connect');
const fs = require('fs');
const http = require('http');
const path = require('path');

const app = connect();

const pokeImagePath = path.join(__dirname, '../../assets/poke.png');
const partyImagePath = path.join(__dirname, '../../assets/party.png');
const defaultImagePath = path.join(__dirname, '../../assets/uie_thumb_big.png');

function serveLocalImage(imagePath: string, res: http.ServerResponse) {
  fs.readFile(imagePath, (err, data) => {
    if (err) {
      console.log('Failed to load local image:', err);

      res.statusCode = 500;
      res.end('Error loading image');

      return;
    }

    res.end(data);
  });
}

app.use((req, res) => {
  console.log('Received request with headers:', req.headers);

  const customHeader = req.headers['custom-header'];

  const imagePath = () => {
    switch (customHeader) {
      case 'poke':
        return pokeImagePath;
      case 'party':
        return partyImagePath;
      default:
        return defaultImagePath;
    }
  };

  serveLocalImage(imagePath(), res);
});

const PORT = 5556;

http.createServer(app).listen(PORT, () => {
  console.log(`Local image server running on http://localhost:${PORT}`);
});
