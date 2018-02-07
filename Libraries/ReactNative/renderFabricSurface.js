/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule renderFabricSurface
 * @format
 * @flow
 */

'use strict';

const AppContainer = require('AppContainer');
const React = require('React');
const ReactFabric = require('ReactFabric');

const invariant = require('fbjs/lib/invariant');

// require BackHandler so it sets the default handler that exits the app if no listeners respond
require('BackHandler');

// Note: this is a fork of renderApplication.js to simply invoke ReactFabric.
function renderFabricSurface<Props: Object>(
  RootComponent: React.ComponentType<Props>,
  initialProps: Props,
  rootTag: any,
  WrapperComponent?: ?React.ComponentType<*>,
) {
  invariant(rootTag, 'Expect to have a valid rootTag, instead got ', rootTag);

  let renderable = (
    <AppContainer rootTag={rootTag} WrapperComponent={WrapperComponent}>
      <RootComponent {...initialProps} rootTag={rootTag} />
    </AppContainer>
  );

  // If the root component is async, the user probably wants the initial render
  // to be async also. To do this, wrap AppContainer with an async marker.
  // For more info see https://fb.me/is-component-async
  if (
    RootComponent.prototype != null &&
    RootComponent.prototype.unstable_isAsyncReactComponent === true
  ) {
    // $FlowFixMe This is not yet part of the official public API
    class AppContainerAsyncWrapper extends React.unstable_AsyncComponent {
      render() {
        return this.props.children;
      }
    }

    renderable = (
      <AppContainerAsyncWrapper>{renderable}</AppContainerAsyncWrapper>
    );
  }

  ReactFabric.render(renderable, rootTag);
}

module.exports = renderFabricSurface;
