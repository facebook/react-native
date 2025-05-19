/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

/**
 * A capability flag disables a specific feature/hack in the InspectorProxy
 * layer by indicating that the target supports one or more modern CDP features.
 */
export type TargetCapabilityFlags = $ReadOnly<{
  /**
   * The target supports a stable page representation across reloads.
   *
   * In the proxy, this disables legacy page reload emulation and the
   * additional 'React Native Experimental' target in `/json/list`.
   *
   * In the launch flow, this allows targets to be matched directly by
   * `logicalDeviceId`.
   */
  nativePageReloads?: boolean,

  /**
   * The target supports fetching source code and source maps.
   *
   * In the proxy, this disables source fetching emulation and host rewrites.
   */
  nativeSourceCodeFetching?: boolean,

  /**
   * The target supports the modern `rn_fusebox.html` entry point.
   *
   * In the launch flow, this controls the Chrome DevTools entrypoint that is used.
   */
  prefersFuseboxFrontend?: boolean,
}>;

// Page information received from the device. New page is created for
// each new instance of VM and can appear when user reloads React Native
// application.

export type PageFromDevice = $ReadOnly<{
  id: string,
  title: string,
  /** Sent from modern targets only */
  description?: string,
  /** @deprecated This is sent from legacy targets only */
  vm?: string,
  app: string,
  capabilities?: TargetCapabilityFlags,
}>;

export type Page = $ReadOnly<{
  ...PageFromDevice,
  capabilities: $NonMaybeType<PageFromDevice['capabilities']>,
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
  payload: $ReadOnlyArray<PageFromDevice>,
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
  title: string,
  appId: string,
  description: string,
  type: string,
  devtoolsFrontendUrl: string,
  webSocketDebuggerUrl: string,

  // React Native specific fields
  /** @deprecated Prefer `title` */
  deviceName: string,
  /** @deprecated This is sent from legacy targets only */
  vm?: string,

  // React Native specific metadata
  reactNative: $ReadOnly<{
    logicalDeviceId: string,
    capabilities: Page['capabilities'],
  }>,
}>;

export type JsonPagesListResponse = Array<PageDescription>;

// Response to /json/version HTTP request from the debugger specifying browser type and
// Chrome protocol version.
export type JsonVersionResponse = $ReadOnly<{
  Browser: string,
  'Protocol-Version': string,
}>;

export type JSONSerializable =
  | boolean
  | number
  | string
  | null
  | $ReadOnlyArray<JSONSerializable>
  | {+[string]: JSONSerializable};

export type DeepReadOnly<T> =
  T extends $ReadOnlyArray<infer V>
    ? $ReadOnlyArray<DeepReadOnly<V>>
    : T extends {...}
      ? {+[K in keyof T]: DeepReadOnly<T[K]>}
      : T;
