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

const {
  default: SampleLegacyModuleExample,
} = require('./SampleLegacyModuleExample');
const React = require('react');

exports.displayName = (undefined: ?string);
exports.title = 'Legacy Native Module';
exports.category = 'Basic';
exports.description = 'Usage of legacy Native Module';
exports.examples = [
  {
    title: 'SampleLegacyModule',
    render: function (): React.MixedElement {
      return <SampleLegacyModuleExample />;
    },
  },
];
