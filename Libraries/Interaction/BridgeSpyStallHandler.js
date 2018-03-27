/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @providesModule BridgeSpyStallHandler
 * @flow
 */
'use strict';

const JSEventLoopWatchdog = require('JSEventLoopWatchdog');
const MessageQueue = require('MessageQueue');

const infoLog = require('infoLog');

const BridgeSpyStallHandler = {
  register: function() {
    let spyBuffer = [];
    MessageQueue.spy((data) => {
      spyBuffer.push(data);
    });
    const TO_JS = 0;
    JSEventLoopWatchdog.addHandler({
      onStall: () => {
        infoLog(
          spyBuffer.length + ' bridge messages during stall: ',
          spyBuffer.map((info) => {
            let args = '<args>';
            try {
              args = JSON.stringify(info.args);
            } catch (e1) {
              if (Array.isArray(info.args)) {
                args = info.args.map((arg) => {
                  try {
                    return JSON.stringify(arg);
                  } catch (e2) {
                    return '?';
                  }
                });
              } else {
                args = 'keys:' + JSON.stringify(Object.keys(info.args));
              }
            }
            return `${info.type === TO_JS ? 'N->JS' : 'JS->N'} : ` +
              `${info.module ? (info.module + '.') : ''}${info.method}(${JSON.stringify(args)})`;
          }),
        );
      },
      onIterate: () => {
        spyBuffer = [];
      },
    });
  },
};

module.exports = BridgeSpyStallHandler;
