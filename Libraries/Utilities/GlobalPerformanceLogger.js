/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */
'use strict';

const createPerformanceLogger = require('createPerformanceLogger');

/**
 * This is a global shared instance of IPerformanceLogger that is created with
 * createPerformanceLogger().
 * Any metric that you log with this logger will be attached to *all* in-flight
 * TTI/TTRC events so you should use it carefully. If you want to log something
 * from your React component you should use PerformanceLoggerContext instead.
 * This logger should be used only for global stuff like load_bundle events.
 */
const GlobalPerformanceLogger = createPerformanceLogger();

module.exports = GlobalPerformanceLogger;
