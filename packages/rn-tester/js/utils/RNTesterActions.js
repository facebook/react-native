/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

'use strict';

export type RNTesterBackAction = {type: 'RNTesterBackAction', ...};

export type RNTesterListAction = {type: 'RNTesterListAction', ...};

export type RNTesterExampleAction = {
  type: 'RNTesterExampleAction',
  openExample: string,
  ...
};

export type RNTesterAction =
  | RNTesterBackAction
  | RNTesterListAction
  | RNTesterExampleAction;

function Back(screen: string): RNTesterBackAction {
  return {
    type: 'RNTesterBackAction',
    screen,
  };
}

function OpenList(screen: string): RNTesterListAction {
  return {
    type: 'RNTesterListAction',
    screen,
  };
}

function ExampleAction(openExample: string): RNTesterExampleAction {
  return {
    type: 'RNTesterExampleAction',
    openExample,
  };
}

const RNTesterActions = {
  Back,
  OpenList,
  ExampleAction,
};

module.exports = RNTesterActions;
