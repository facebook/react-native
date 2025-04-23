/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 * @oncall react_native
 */

import type {HostInstance} from '../../src/private/types/HostInstance';

export type InstanceFromReactDevTools =
  | HostInstance
  | {
      canonical?:
        | HostInstance
        | {
            publicInstance?: HostInstance,
          },
    };

export type ReactDevToolsAgentEvents = {
  drawTraceUpdates: [Array<{node: InstanceFromReactDevTools, color: string}>],
  disableTraceUpdates: [],

  showNativeHighlight: [nodes: Array<InstanceFromReactDevTools>],
  hideNativeHighlight: [],
  shutdown: [],
  startInspectingNative: [],
  stopInspectingNative: [],
};

export type ReactDevToolsAgent = {
  selectNode(node: mixed): void,
  stopInspectingNative(value: boolean): void,
  addListener<Event: $Keys<ReactDevToolsAgentEvents>>(
    event: Event,
    listener: (...ReactDevToolsAgentEvents[Event]) => void,
  ): void,
  removeListener(
    event: $Keys<ReactDevToolsAgentEvents>,
    listener: () => void,
  ): void,
};

export type ReactDevToolsGlobalHook = {
  on: (eventName: string, (agent: ReactDevToolsAgent) => void) => void,
  off: (eventName: string, (agent: ReactDevToolsAgent) => void) => void,
  reactDevtoolsAgent?: ReactDevToolsAgent,
  resolveRNStyle?: mixed,
  nativeStyleEditorValidAttributes?: Array<string>,
};
