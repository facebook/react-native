/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

'use strict';

import type {SpyData} from '../BatchedBridge/MessageQueue';
const JSEventLoopWatchdog = require('./JSEventLoopWatchdog');

const MessageQueue = require('../BatchedBridge/MessageQueue');
const infoLog = require('../Utilities/infoLog');

const BridgeSpyStallHandler = {
  register: function () {
    let spyBuffer: Array<SpyData> = [];
    MessageQueue.spy(data => {
      spyBuffer.push(data);
    });
    const TO_JS = 0;
    JSEventLoopWatchdog.addHandler({
      onStall: () => {
        infoLog(
          spyBuffer.length + ' bridge messages during stall: ',
          spyBuffer.map(info => {
            let args: string | Array<?string> = '<args>';
            try {
              args = JSON.stringify(info.args);
            } catch (e1) {
              if (Array.isArray(info.args)) {
                args = info.args.map(arg => {
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
            return (
              `${info.type === TO_JS ? 'N->JS' : 'JS->N'} : ` +
              `${info.module ? info.module + '.' : ''}${
                info.method
              }(${JSON.stringify(args)})`
            );
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
