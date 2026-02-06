/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

export type PlatformOSType =
  | 'ios'
  | 'android'
  | 'macos'
  | 'windows'
  | 'web'
  | 'native';

type OptionalPlatformSelectSpec<T> = {
  [key in PlatformOSType]?: T, // eslint-disable-line no-unused-vars
};

export type PlatformSelectSpec<T> =
  | {
      ...OptionalPlatformSelectSpec<T>,
      default: T,
    }
  | OptionalPlatformSelectSpec<T>;

type IOSPlatform = {
  __constants: null,
  OS: 'ios',
  // $FlowFixMe[unsafe-getters-setters]
  get Version(): string,
  // $FlowFixMe[unsafe-getters-setters]
  get constants(): {
    forceTouchAvailable: boolean,
    interfaceIdiom: string,
    isTesting: boolean,
    isDisableAnimations?: boolean,
    osVersion: string,
    reactNativeVersion: {
      major: number,
      minor: number,
      patch: number,
      prerelease: ?string,
    },
    systemName: string,
    isMacCatalyst?: boolean,
  },
  // $FlowFixMe[unsafe-getters-setters]
  get isPad(): boolean,
  // $FlowFixMe[unsafe-getters-setters]
  get isTV(): boolean,
  // $FlowFixMe[unsafe-getters-setters]
  get isVision(): boolean,
  // $FlowFixMe[unsafe-getters-setters]
  get isTesting(): boolean,
  // $FlowFixMe[unsafe-getters-setters]
  get isDisableAnimations(): boolean,
  // $FlowFixMe[unsafe-getters-setters]
  get isMacCatalyst(): boolean,
  select: <T>(spec: PlatformSelectSpec<T>) => T,
};

type AndroidPlatform = {
  __constants: null,
  OS: 'android',
  // $FlowFixMe[unsafe-getters-setters]
  get Version(): number,
  // $FlowFixMe[unsafe-getters-setters]
  get constants(): {
    isTesting: boolean,
    isDisableAnimations?: boolean,
    reactNativeVersion: {
      major: number,
      minor: number,
      patch: number,
      prerelease: ?string,
    },
    Version: number,
    Release: string,
    Serial: string,
    Fingerprint: string,
    Model: string,
    ServerHost?: string,
    uiMode: string,
    Brand: string,
    Manufacturer: string,
  },
  // $FlowFixMe[unsafe-getters-setters]
  get isTV(): boolean,
  // $FlowFixMe[unsafe-getters-setters]
  get isVision(): boolean,
  // $FlowFixMe[unsafe-getters-setters]
  get isTesting(): boolean,
  // $FlowFixMe[unsafe-getters-setters]
  get isDisableAnimations(): boolean,
  select: <T>(spec: PlatformSelectSpec<T>) => T,
};

type WindowsPlatform = {
  __constants: null,
  OS: 'windows',
  // $FlowFixMe[unsafe-getters-setters]
  get Version(): number,
  // $FlowFixMe[unsafe-getters-setters]
  get constants(): {
  // [Windows]
    isTesting: boolean,
    isDisableAnimations?: boolean,
    reactNativeVersion: {
      major: number,
      minor: number,
      patch: number,
      prerelease: ?string,
    },
    reactNativeWindowsVersion: {
      major: number,
      minor: number,
      patch: number,
    },
    osVersion: number,
  },
  // $FlowFixMe[unsafe-getters-setters]
  get isTesting(): boolean,
  // $FlowFixMe[unsafe-getters-setters]
  get isDisableAnimations(): boolean,
  // $FlowFixMe[unsafe-getters-setters]
  get isTV(): boolean,
  select: <T>(spec: PlatformSelectSpec<T>) => T,
};

type MacOSPlatform = {
  __constants: null,
  OS: 'macos',
  // $FlowFixMe[unsafe-getters-setters]
  get Version(): string,
  // $FlowFixMe[unsafe-getters-setters]
  get constants(): {
    isTesting: boolean,
    osVersion: string,
    reactNativeVersion: {
      major: number,
      minor: number,
      patch: number,
      prerelease: ?number,
    },
    systemName: string,
  },
  // $FlowFixMe[unsafe-getters-setters]
  get isTV(): boolean,
  // $FlowFixMe[unsafe-getters-setters]
  get isVision(): boolean,
  // $FlowFixMe[unsafe-getters-setters]
  get isTesting(): boolean,
  // $FlowFixMe[unsafe-getters-setters]
  get isDisableAnimations(): boolean,
  select: <T>(spec: PlatformSelectSpec<T>) => T,
};

type WebPlatform = {
  OS: 'web',
  // $FlowFixMe[unsafe-getters-setters]
  get Version(): string,
  // $FlowFixMe[unsafe-getters-setters]
  get constants(): {
    reactNativeVersion: {
      major: number,
      minor: number,
      patch: number,
      prerelease: ?string,
    },
  },
  // $FlowFixMe[unsafe-getters-setters]
  get isTV(): boolean,
  // $FlowFixMe[unsafe-getters-setters]
  get isTesting(): boolean,
  // $FlowFixMe[unsafe-getters-setters]
  get isDisableAnimations(): boolean,
  select: <T>(spec: PlatformSelectSpec<T>) => T,
};

export type PlatformType =
  | IOSPlatform
  | AndroidPlatform
  | WindowsPlatform
  | MacOSPlatform
  | WebPlatform;
