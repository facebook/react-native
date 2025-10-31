/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 * @fantom_mode dev
 */

/**
 * We force the DEV mode, because React only uses console.createTask in DEV builds.
 */

//$FlowExpectedError[cannot-write]
delete console.createTask;

require('./consoleCreateTask-jsx-benchmark-itest.js');
