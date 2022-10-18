/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

import type {IPerformanceLogger} from '../Utilities/createPerformanceLogger';

import GlobalPerformanceLogger from '../Utilities/GlobalPerformanceLogger';
import PerformanceLoggerContext from '../Utilities/PerformanceLoggerContext';
import AppContainer from './AppContainer';
import DisplayMode, {type DisplayModeType} from './DisplayMode';
import getCachedComponentWithDebugName from './getCachedComponentWithDebugName';
import * as Renderer from './RendererProxy';
import invariant from 'invariant';
import * as React from 'react';

// require BackHandler so it sets the default handler that exits the app if no listeners respond
import '../Utilities/BackHandler';

type OffscreenType = React.AbstractComponent<{
  mode: 'visible' | 'hidden',
  children: React.Node,
}>;

export default function renderApplication<Props: Object>(
  RootComponent: React.ComponentType<Props>,
  initialProps: Props,
  rootTag: any,
  WrapperComponent?: ?React.ComponentType<any>,
  fabric?: boolean,
  showArchitectureIndicator?: boolean,
  scopedPerformanceLogger?: IPerformanceLogger,
  isLogBox?: boolean,
  debugName?: string,
  displayMode?: ?DisplayModeType,
  useConcurrentRoot?: boolean,
  useOffscreen?: boolean,
) {
  invariant(rootTag, 'Expect to have a valid rootTag, instead got ', rootTag);

  const performanceLogger = scopedPerformanceLogger ?? GlobalPerformanceLogger;

  let renderable: React.MixedElement = (
    <PerformanceLoggerContext.Provider value={performanceLogger}>
      <AppContainer
        rootTag={rootTag}
        fabric={fabric}
        showArchitectureIndicator={showArchitectureIndicator}
        WrapperComponent={WrapperComponent}
        initialProps={initialProps ?? Object.freeze({})}
        internal_excludeLogBox={isLogBox}>
        <RootComponent {...initialProps} rootTag={rootTag} />
      </AppContainer>
    </PerformanceLoggerContext.Provider>
  );

  if (__DEV__ && debugName) {
    const RootComponentWithMeaningfulName = getCachedComponentWithDebugName(
      `${debugName}(RootComponent)`,
    );
    renderable = (
      <RootComponentWithMeaningfulName>
        {renderable}
      </RootComponentWithMeaningfulName>
    );
  }

  if (useOffscreen && displayMode != null) {
    // $FlowFixMe[incompatible-type]
    // $FlowFixMe[prop-missing]
    const Offscreen: OffscreenType = React.unstable_Offscreen;

    renderable = (
      <Offscreen
        mode={displayMode === DisplayMode.VISIBLE ? 'visible' : 'hidden'}>
        {renderable}
      </Offscreen>
    );
  }

  performanceLogger.startTimespan('renderApplication_React_render');
  performanceLogger.setExtra(
    'usedReactConcurrentRoot',
    useConcurrentRoot ? '1' : '0',
  );
  performanceLogger.setExtra('usedReactFabric', fabric ? '1' : '0');
  performanceLogger.setExtra(
    'usedReactProfiler',
    Renderer.isProfilingRenderer(),
  );
  Renderer.renderElement({
    element: renderable,
    rootTag,
    useFabric: Boolean(fabric),
    useConcurrentRoot: Boolean(useConcurrentRoot),
  });
  performanceLogger.stopTimespan('renderApplication_React_render');
}
