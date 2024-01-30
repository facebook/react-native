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

const SampleTurboModuleExample = require('./SampleTurboModuleExample');
const React = require('react');

exports.displayName = (undefined: ?string);
exports.title = 'TurboModule';
exports.category = 'Basic';
exports.description = 'Usage of TurboModule';
exports.examples = [
  {
    title: 'SampleTurboModule',
    render: function (): React.Element<any> {
      return <SampleTurboModuleExample />;
    },
  },
];
