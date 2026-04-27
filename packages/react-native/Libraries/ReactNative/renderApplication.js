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

export default function renderApplication<Props extends Object>(
  RootComponent: React.ComponentType<Props>,
  initialProps: Props,
  rootTag: any,
  WrapperComponent?: ?React.ComponentType<any>,
  rootViewStyle?: ?ViewStyleProp,
  // Keep this parameter for backwards compatibility only. It is always treated as
  // true internally.
  fabric?: true | void,
  // Reserved positional slot (formerly `scopedPerformanceLogger`). Preserved so
  // existing callers that supply this argument continue to type-check; the
  // value is ignored.
  _unused?: void,
  isLogBox?: boolean,
  debugName?: string,
  displayMode?: ?DisplayModeType,
  useOffscreen?: boolean,
) {
  invariant(rootTag, 'Expect to have a valid rootTag, instead got ', rootTag);

  let renderable: React.MixedElement = (
    <AppContainer
      rootTag={rootTag}
      WrapperComponent={WrapperComponent}
      rootViewStyle={rootViewStyle}
      initialProps={initialProps ?? Object.freeze({})}
      internal_excludeLogBox={isLogBox}>
      <RootComponent {...initialProps} rootTag={rootTag} />
    </AppContainer>
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
    // $FlowFixMe[missing-export]
    // $FlowFixMe[prop-missing] `unstable_Activity` is not yet in the React types.
    const Activity: ActivityType = React.unstable_Activity;

    renderable = (
      <Activity
        mode={displayMode === DisplayMode.VISIBLE ? 'visible' : 'hidden'}>
        {renderable}
      </Activity>
    );
  }

  Renderer.renderElement({
    element: renderable,
    rootTag,
  });
}
