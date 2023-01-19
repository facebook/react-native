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

const React = require('react');
const NativeCxxModuleExampleExample = require('./NativeCxxModuleExampleExample');

exports.displayName = (undefined: ?string);
exports.title = 'Cxx TurboModule';
exports.category = 'Basic';
exports.description = 'Usage of Cxx TurboModule';
exports.examples = [
  {
    title: 'TurboCxxModuleExample',
    render: function (): React.Element<any> {
      return <NativeCxxModuleExampleExample />;
    },
  },
];
