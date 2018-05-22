/**
 * Copyright (c) 2015-present, Facebook, Inc.
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

import type {ExampleModule} from 'ExampleTypes';

var createExamplePage = function(
  title: ?string,
  exampleModule: ExampleModule,
): React.ComponentType<any> {
  class ExamplePage extends React.Component<{}> {
    render() {
      return <RNTesterExampleContainer module={exampleModule} title={title} />;
    }
  }

  return ExamplePage;
};

module.exports = createExamplePage;
