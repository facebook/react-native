/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule renderApplication
 * @format
 * @flow
 */

'use strict';

const AppContainer = require('AppContainer');
const React = require('React');
const ReactNative = require('ReactNative');

const invariant = require('fbjs/lib/invariant');

// require BackHandler so it sets the default handler that exits the app if no listeners respond
require('BackHandler');

function renderApplication<Props: Object>(
  RootComponent: ReactClass<Props>,
  initialProps: Props,
  rootTag: any,
  WrapperComponent?: ?ReactClass<*>,
) {
  invariant(rootTag, 'Expect to have a valid rootTag, instead got ', rootTag);

  ReactNative.render(
    <AppContainer rootTag={rootTag} WrapperComponent={WrapperComponent}>
      <RootComponent {...initialProps} rootTag={rootTag} />
    </AppContainer>,
    rootTag,
  );
}

module.exports = renderApplication;
