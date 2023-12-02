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

import type {RNTesterModule} from '../types/RNTesterTypes';

import RNTesterModuleContainer from './RNTesterModuleContainer';

const React = require('react');

const createExamplePage = function (
  title: ?string,
  exampleModule: RNTesterModule,
): React.ComponentType<any> {
  class ExamplePage extends React.Component<{...}> {
    render(): React.Node {
      return <RNTesterModuleContainer module={exampleModule} />;
    }
  }

  return ExamplePage;
};

module.exports = createExamplePage;
