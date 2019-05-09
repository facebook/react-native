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
const NewAppScreen = require('../../Libraries/NewAppScreen').default;

exports.title = 'New App Screen';
exports.description = 'Displays the content of the new app screen';
exports.examples = [
  {
    title: 'New App Screen',
    description: 'Displays the content of the new app screen',
    render(): React.Element<any> {
      return <NewAppScreen />;
    },
  },
];
