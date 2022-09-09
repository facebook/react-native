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
import type {DisplayModeType} from './DisplayMode';

import GlobalPerformanceLogger from '../Utilities/GlobalPerformanceLogger';
import PerformanceLoggerContext from '../Utilities/PerformanceLoggerContext';
import AppContainer from './AppContainer';
import getCachedComponentWithDebugName from './getCachedComponentWithDebugName';
import * as Renderer from './RendererProxy';
import invariant from 'invariant';
import * as React from 'react';

// require BackHandler so it sets the default handler that exits the app if no listeners respond
import '../Utilities/BackHandler';

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
