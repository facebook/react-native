/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

import type {ViewStyleProp} from '../StyleSheet/StyleSheet';
import type {IPerformanceLogger} from '../Utilities/createPerformanceLogger';

import GlobalPerformanceLogger from '../Utilities/GlobalPerformanceLogger';
import PerformanceLoggerContext from '../Utilities/PerformanceLoggerContext';
import warnOnce from '../Utilities/warnOnce';
import AppContainer from './AppContainer';
import DisplayMode, {type DisplayModeType} from './DisplayMode';
import getCachedComponentWithDebugName from './getCachedComponentWithDebugName';
import * as Renderer from './RendererProxy';
import invariant from 'invariant';
import * as React from 'react';

// require BackHandler so it sets the default handler that exits the app if no listeners respond
import '../Utilities/BackHandler';

type ActivityType = component(
  ...{
    mode: 'visible' | 'hidden',
    children: React.Node,
  }
);

export default function renderApplication<Props: Object>(
  RootComponent: React.ComponentType<Props>,
  initialProps: Props,
  rootTag: any,
  WrapperComponent?: ?React.ComponentType<any>,
  rootViewStyle?: ?ViewStyleProp,
  fabric?: boolean,
  scopedPerformanceLogger?: IPerformanceLogger,
  isLogBox?: boolean,
  debugName?: string,
  displayMode?: ?DisplayModeType,
  useOffscreen?: boolean,
) {
  invariant(rootTag, 'Expect to have a valid rootTag, instead got ', rootTag);

  const performanceLogger = scopedPerformanceLogger ?? GlobalPerformanceLogger;

  let renderable: React.MixedElement = (
    <PerformanceLoggerContext.Provider value={performanceLogger}>
      <AppContainer
        rootTag={rootTag}
        fabric={fabric}
        WrapperComponent={WrapperComponent}
        rootViewStyle={rootViewStyle}
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
    const Activity: ActivityType = React.unstable_Activity;

    renderable = (
      <Activity
        mode={displayMode === DisplayMode.VISIBLE ? 'visible' : 'hidden'}>
        {renderable}
      </Activity>
    );
  }

  // We want to have concurrentRoot always enabled when you're on Fabric.
  const useConcurrentRoot = Boolean(fabric);

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
    useConcurrentRoot,
  });

  const newArchitecture = !!fabric;
  if (!newArchitecture) {
    warnOnce(
      '[OSS][OldArchDeprecatedWarning]',
      'The app is running using the Legacy Architecture. The Legacy Architecture is deprecated and will be removed in a future version of React Native. Please consider migrating to the New Architecture. For more information, please see https://reactnative.dev/blog/2024/10/23/the-new-architecture-is-here',
    );
  }
  performanceLogger.stopTimespan('renderApplication_React_render');
}
