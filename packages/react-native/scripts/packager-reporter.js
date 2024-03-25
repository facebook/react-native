/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

const logPath = process.env.RCT_PACKAGER_LOG_PATH;
if (logPath != null && logPath !== '') {
  const JsonReporter = require('metro/src/lib/JsonReporter');
  const fs = require('fs');
  const path = require('path');
  module.exports = class extends JsonReporter {
    constructor() {
      fs.mkdirSync(path.dirname(logPath), {
        recursive: true,
      });
      super(fs.createWriteStream(logPath));
    }
  };
} else {
  module.exports = require('metro/src/lib/TerminalReporter');
}
