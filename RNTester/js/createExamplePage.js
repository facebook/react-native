/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule createExamplePage
 * @flow
 */
'use strict';

const React = require('react');

const RNTesterExampleContainer = require('./RNTesterExampleContainer');

import type { ExampleModule } from 'ExampleTypes';

var createExamplePage = function(title: ?string, exampleModule: ExampleModule)
  : ReactClass<any> {

  class ExamplePage extends React.Component {
    render() {
      return <RNTesterExampleContainer module={exampleModule} title={title} />;
    }
  }

  return ExamplePage;
};

module.exports = createExamplePage;
