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
import NewFabricComponent from '../../../NewFabricComponentExample/js/NewFabricComponentExampleNativeComponent';

exports.title = 'New Fabric Component Example';
exports.description =
  'Codegen discovery must be enabled for iOS. See Podfile for more details. Simple component using the new architecture.';
exports.examples = [
  {
    title: 'New Fabric Component',
    description: 'An horizontally centered test',
    render(): React.Element<any> {
      return (
        <>
          <NewFabricComponent text="Hey!!!" style={{width: 390, height: 30}} />
        </>
      );
    },
  },
];
