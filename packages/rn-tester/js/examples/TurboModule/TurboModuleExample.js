/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
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
    render: function (): React.MixedElement {
      return <SampleTurboModuleExample />;
    },
  },
];
