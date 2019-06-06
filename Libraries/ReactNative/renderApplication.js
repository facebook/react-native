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

const AppContainer = require('./AppContainer');
import GlobalPerformanceLogger from '../Utilities/GlobalPerformanceLogger';
import type {IPerformanceLogger} from '../Utilities/createPerformanceLogger';
import PerformanceLoggerContext from '../Utilities/PerformanceLoggerContext';
const React = require('react');
const ReactFabricIndicator = require('./ReactFabricIndicator');

const invariant = require('invariant');

// require BackHandler so it sets the default handler that exits the app if no listeners respond
require('../Utilities/BackHandler');

function renderApplication<Props: Object>(
  RootComponent: React.ComponentType<Props>,
  initialProps: Props,
  rootTag: any,
  WrapperComponent?: ?React.ComponentType<*>,
  fabric?: boolean,
  showFabricIndicator?: boolean,
  scopedPerformanceLogger?: IPerformanceLogger,
) {
  invariant(rootTag, 'Expect to have a valid rootTag, instead got ', rootTag);

  let renderable = (
    <PerformanceLoggerContext.Provider
      value={scopedPerformanceLogger ?? GlobalPerformanceLogger}>
      <AppContainer rootTag={rootTag} WrapperComponent={WrapperComponent}>
        <RootComponent {...initialProps} rootTag={rootTag} />
        {fabric === true && showFabricIndicator === true ? (
          <ReactFabricIndicator />
        ) : null}
      </AppContainer>
    </PerformanceLoggerContext.Provider>
  );

  // If the root component is async, the user probably wants the initial render
  // to be async also. To do this, wrap AppContainer with an async marker.
  // For more info see https://fb.me/is-component-async
  if (
    /* $FlowFixMe(>=0.68.0 site=react_native_fb) This comment suppresses an
     * error found when Flow v0.68 was deployed. To see the error delete this
     * comment and run Flow. */
    RootComponent.prototype != null &&
    RootComponent.prototype.unstable_isAsyncReactComponent === true
  ) {
    // $FlowFixMe This is not yet part of the official public API
    const ConcurrentMode = React.unstable_ConcurrentMode;
    renderable = <ConcurrentMode>{renderable}</ConcurrentMode>;
  }

  GlobalPerformanceLogger.startTimespan('renderApplication_React_render');
  if (fabric) {
    require('../Renderer/shims/ReactFabric').render(renderable, rootTag);
  } else {
    require('../Renderer/shims/ReactNative').render(renderable, rootTag);
  }
  GlobalPerformanceLogger.stopTimespan('renderApplication_React_render');
}

module.exports = renderApplication;
