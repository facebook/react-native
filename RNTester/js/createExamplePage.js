/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

'use strict';

const React = require('react');

const RNTesterExampleContainer = require('./RNTesterExampleContainer');
import type {RNTesterExample} from './Shared/RNTesterTypes';

const createExamplePage = function(
  title: ?string,
  exampleModule: RNTesterExample,
): React.ComponentType<any> {
  class ExamplePage extends React.Component<{}> {
    render() {
      return <RNTesterExampleContainer module={exampleModule} title={title} />;
    }
  }

  return ExamplePage;
};

module.exports = createExamplePage;
