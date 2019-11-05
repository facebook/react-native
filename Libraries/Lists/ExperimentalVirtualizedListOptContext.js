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

const React = require('react');

const ExperimentalVirtualizedListOptContext: React.Context<boolean> = React.createContext<boolean>(
  false,
);

module.exports = ExperimentalVirtualizedListOptContext;
