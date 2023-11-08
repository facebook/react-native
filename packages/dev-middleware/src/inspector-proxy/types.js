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

// Page information received from the device. New page is created for
// each new instance of VM and can appear when user reloads React Native
// application.
export type Page = $ReadOnly<{
  id: string,
  title: string,
  vm: string,
  app: string,
}>;

// Chrome Debugger Protocol message/event passed between device and debugger.
export type WrappedEvent = $ReadOnly<{
  event: 'wrappedEvent',
  payload: $ReadOnly<{
    pageId: string,
    wrappedEvent: string,
  }>,
}>;

// Request sent from Inspector Proxy to Device when new debugger is connected
// to particular page.
export type ConnectRequest = $ReadOnly<{
  event: 'connect',
  payload: $ReadOnly<{pageId: string}>,
}>;

// Request sent from Inspector Proxy to Device to notify that debugger is
// disconnected.
export type DisconnectRequest = $ReadOnly<{
  event: 'disconnect',
  payload: $ReadOnly<{pageId: string}>,
}>;

// Request sent from Inspector Proxy to Device to get a list of pages.
export type GetPagesRequest = {event: 'getPages'};

// Response to GetPagesRequest containing a list of page infos.
export type GetPagesResponse = {
  event: 'getPages',
  payload: $ReadOnlyArray<Page>,
};

// Union type for all possible messages sent from device to Inspector Proxy.
export type MessageFromDevice =
  | GetPagesResponse
  | WrappedEvent
  | DisconnectRequest;

// Union type for all possible messages sent from Inspector Proxy to device.
export type MessageToDevice =
  | GetPagesRequest
  | WrappedEvent
  | ConnectRequest
  | DisconnectRequest;

// Page description object that is sent in response to /json HTTP request from debugger.
export type PageDescription = $ReadOnly<{
  id: string,
  description: string,
  title: string,
  faviconUrl: string,
  devtoolsFrontendUrl: string,
  type: string,
  webSocketDebuggerUrl: string,
  deviceName: string,
  vm: string,
  // Metadata specific to React Native
  reactNative: $ReadOnly<{
    logicalDeviceId: string,
  }>,
}>;

export type JsonPagesListResponse = $ReadOnlyArray<PageDescription>;

// Response to /json/version HTTP request from the debugger specifying browser type and
// Chrome protocol version.
export type JsonVersionResponse = $ReadOnly<{
  Browser: string,
  'Protocol-Version': string,
}>;

/**
 * Types were exported from https://github.com/ChromeDevTools/devtools-protocol/blob/master/types/protocol.d.ts
 */

export type SetBreakpointByUrlRequest = $ReadOnly<{
  id: number,
  method: 'Debugger.setBreakpointByUrl',
  params: $ReadOnly<{
    lineNumber: number,
    url?: string,
    urlRegex?: string,
    scriptHash?: string,
    columnNumber?: number,
    condition?: string,
  }>,
}>;

export type GetScriptSourceRequest = $ReadOnly<{
  id: number,
  method: 'Debugger.getScriptSource',
  params: {
    scriptId: string,
  },
}>;

export type GetScriptSourceResponse = $ReadOnly<{
  scriptSource: string,
  /**
   * Wasm bytecode.
   */
  bytecode?: string,
}>;

export type ErrorResponse = $ReadOnly<{
  error: $ReadOnly<{
    message: string,
  }>,
}>;

export type DebuggerRequest =
  | SetBreakpointByUrlRequest
  | GetScriptSourceRequest;

export type JSONSerializable =
  | boolean
  | number
  | string
  | null
  | $ReadOnlyArray<JSONSerializable>
  | {+[string]: JSONSerializable};
