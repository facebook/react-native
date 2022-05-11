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

import * as React from 'react';
import ColoredView from '../../../library/src/ColoredViewNativeComponent';

exports.title = 'Colored View';
exports.description =
  'Codegen discovery must be enabled for iOS. See Podfile for more details. Simple component using the new architecture.';
exports.examples = [
  {
    title: 'Colored View',
    render(): React.Element<any> {
      return (
        <>
          <ColoredView color="#00AA00" style={{width: 100, height: 100}} />
        </>
      );
    },
  },
];
