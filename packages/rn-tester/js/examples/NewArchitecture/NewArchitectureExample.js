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

import * as React from 'react';
import MyNativeView from '../../../NativeComponentExample/js/MyNativeView';

exports.title = 'New Architecture Examples';
exports.description =
  'Simple component using the new architecture. Fabric must be enabled.';
exports.examples = [
  {
    title: 'New Architecture Renderer',
    description: 'Click to change background and opacity',
    render(): React.Element<any> {
      return (
        <>
          <MyNativeView />
        </>
      );
    },
  },
];
