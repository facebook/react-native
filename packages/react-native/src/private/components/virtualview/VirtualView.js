/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {ViewStyleProp} from '../../../../Libraries/StyleSheet/StyleSheet';
import type {NativeSyntheticEvent} from '../../../../Libraries/Types/CoreEventTypes';
import type {HostInstance} from '../../types/HostInstance';
import type {NativeModeChangeEvent} from './VirtualViewNativeComponent';

import StyleSheet from '../../../../Libraries/StyleSheet/StyleSheet';
import * as ReactNativeFeatureFlags from '../../featureflags/ReactNativeFeatureFlags';
import VirtualViewExperimentalNativeComponent from './VirtualViewExperimentalNativeComponent';
import VirtualViewClassicNativeComponent from './VirtualViewNativeComponent';
import nullthrows from 'nullthrows';
import * as React from 'react';
// $FlowFixMe[missing-export]
import {startTransition, unstable_Activity as Activity, useState} from 'react';

// @see VirtualViewNativeComponent
export enum VirtualViewMode {
  Visible = 0,
  Prerender = 1,
  Hidden = 2,
}

// @see VirtualViewNativeComponent
export enum VirtualViewRenderState {
  Unknown = 0,
  Rendered = 1,
  None = 2,
}

export type Rect = $ReadOnly<{
  x: number,
  y: number,
  width: number,
  height: number,
}>;

export type ModeChangeEvent = $ReadOnly<{
  ...Omit<NativeModeChangeEvent, 'mode'>,
  mode: VirtualViewMode,
  target: HostInstance,
}>;

const VirtualViewNativeComponent: typeof VirtualViewClassicNativeComponent =
  ReactNativeFeatureFlags.enableVirtualViewExperimental()
    ? VirtualViewExperimentalNativeComponent
    : VirtualViewClassicNativeComponent;

type VirtualViewComponent = component(
  children?: React.Node,
  hiddenStyle?: (targetRect: Rect) => ViewStyleProp,
  nativeID?: string,
  ref?: ?React.RefSetter<React.ElementRef<typeof VirtualViewNativeComponent>>,
  style?: ?ViewStyleProp,
  onModeChange?: (event: ModeChangeEvent) => void,
  removeClippedSubviews?: boolean,
);

const NotHidden = null;
type HiddenStyle = Exclude<ViewStyleProp, typeof NotHidden>;

type State = HiddenStyle | typeof NotHidden;

function defaultHiddenStyle(targetRect: Rect): ViewStyleProp {
  return {minHeight: targetRect.height, minWidth: targetRect.width};
}

function createVirtualView(initialState: State): VirtualViewComponent {
  const initialHidden = initialState !== NotHidden;

  component VirtualView(
    children?: React.Node,
    hiddenStyle: (targetRect: Rect) => ViewStyleProp = defaultHiddenStyle,
    nativeID?: string,
    ref?: ?React.RefSetter<React.ElementRef<typeof VirtualViewNativeComponent>>,
    style?: ?ViewStyleProp,
    onModeChange?: (event: ModeChangeEvent) => void,
    removeClippedSubviews?: boolean,
  ) {
    const [state, setState] = useState<State>(initialState);
    if (__DEV__) {
      _logs.states?.push(state);
    }
    const isHidden = state !== NotHidden;

    const handleModeChange = (
      event: NativeSyntheticEvent<NativeModeChangeEvent>,
    ) => {
      const mode = nullthrows(VirtualViewMode.cast(event.nativeEvent.mode));
      const emitModeChange =
        onModeChange == null
          ? null
          : onModeChange.bind(null, {
              mode,
              // $FlowFixMe[incompatible-type] - we know this is a HostInstance
              target: event.currentTarget as HostInstance,
              targetRect: event.nativeEvent.targetRect,
              thresholdRect: event.nativeEvent.thresholdRect,
            });

      match (mode) {
        VirtualViewMode.Visible => {
          setState(NotHidden);
          emitModeChange?.();
        }
        VirtualViewMode.Prerender => {
          startTransition(() => {
            setState(NotHidden);
            emitModeChange?.();
          });
        }
        VirtualViewMode.Hidden => {
          startTransition(() => {
            setState(hiddenStyle(event.nativeEvent.targetRect) ?? {});
            emitModeChange?.();
          });
        }
      }
    };

    return (
      <VirtualViewNativeComponent
        initialHidden={initialHidden}
        nativeID={nativeID}
        ref={ref}
        removeClippedSubviews={removeClippedSubviews}
        renderState={
          (isHidden
            ? VirtualViewRenderState.None
            : VirtualViewRenderState.Rendered) as number
        }
        style={
          isHidden
            ? StyleSheet.compose(style, nullthrows(state) as HiddenStyle)
            : style
        }
        onModeChange={handleModeChange}>
        {
          match (ReactNativeFeatureFlags.virtualViewActivityBehavior()) {
            'activity-without-mode' =>
              <Activity>{isHidden ? null : children}</Activity>,
            'activity-with-hidden-mode' =>
              <Activity mode={isHidden ? 'hidden' : 'visible'}>
                {children}
              </Activity>,
            'no-activity' | _ => isHidden ? null : children,
          }
        }
      </VirtualViewNativeComponent>
    );
  }
  return VirtualView;
}

export default createVirtualView(NotHidden) as VirtualViewComponent;

export function createHiddenVirtualView(
  style: ViewStyleProp,
): VirtualViewComponent {
  return createVirtualView((style ?? {}) as HiddenStyle);
}

export const _logs: {states?: Array<State>} = {};
