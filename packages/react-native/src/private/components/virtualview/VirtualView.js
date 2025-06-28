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
import type ReadOnlyElement from '../../webapis/dom/nodes/ReadOnlyElement';
import type {NativeModeChangeEvent} from './VirtualViewNativeComponent';

import StyleSheet from '../../../../Libraries/StyleSheet/StyleSheet';
import VirtualViewNativeComponent from './VirtualViewNativeComponent';
import nullthrows from 'nullthrows';
import * as React from 'react';
import {startTransition, useState} from 'react';

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
  target: ReadOnlyElement,
}>;

type VirtualViewComponent = component(
  children?: React.Node,
  nativeID?: string,
  ref?: ?React.RefSetter<React.ElementRef<typeof VirtualViewNativeComponent>>,
  style?: ?ViewStyleProp,
  onModeChange?: (event: ModeChangeEvent) => void,
);

type HiddenHeight = number;
const NotHidden = null;

type State = HiddenHeight | typeof NotHidden;

function createVirtualView(initialState: State): VirtualViewComponent {
  const initialHidden = initialState !== NotHidden;

  component VirtualView(
    children?: React.Node,
    nativeID?: string,
    ref?: ?React.RefSetter<React.ElementRef<typeof VirtualViewNativeComponent>>,
    style?: ?ViewStyleProp,
    onModeChange?: (event: ModeChangeEvent) => void,
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
              // $FlowIgnore[incompatible-cast]
              target: event.currentTarget as ReadOnlyElement,
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
          const {height} = event.nativeEvent.targetRect;
          startTransition(() => {
            setState(height as HiddenHeight);
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
        renderState={
          (isHidden
            ? VirtualViewRenderState.None
            : VirtualViewRenderState.Rendered) as number
        }
        style={
          isHidden
            ? StyleSheet.compose(style, {
                height: Math.abs(nullthrows(state) as HiddenHeight),
              })
            : style
        }
        onModeChange={handleModeChange}>
        {isHidden ? null : children}
      </VirtualViewNativeComponent>
    );
  }
  return VirtualView;
}

export default createVirtualView(NotHidden) as VirtualViewComponent;

export function createHiddenVirtualView(height: number): VirtualViewComponent {
  return createVirtualView(height as HiddenHeight);
}

export const _logs: {states?: Array<State>} = {};
