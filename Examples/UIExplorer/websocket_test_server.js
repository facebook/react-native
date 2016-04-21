/**
 * The examples provided by Facebook are for non-commercial testing and
 * evaluation purposes only.
 *
 * Facebook reserves all rights not expressly granted.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
 * OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NON INFRINGEMENT. IN NO EVENT SHALL
 * FACEBOOK BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN
 * AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 *
 * @flow
 */
'use strict';

/* eslint-env node */

const WebSocket = require('ws');

console.log(`\
Test server for WebSocketExample

This will send each incoming message right back to the other side.a
Restart with the '--binary' command line flag to have it respond with an
ArrayBuffer instead of a string.
`);

const respondWithBinary = process.argv.indexOf('--binary') !== -1;
const server = new WebSocket.Server({port: 5555});
server.on('connection', (ws) => {
  ws.on('message', (message) => {
    console.log('Received message:', message);
    if (respondWithBinary) {
      message = new Buffer(message);
    }
    ws.send(message);
  });

  console.log('Incoming connection!');
  ws.send('Why hello there!');
});
