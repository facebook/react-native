/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 * @oncall react_native
 */

/*::
export type Folder = RegExp;

export type Files = $ReadOnly<{
  headers: $ReadOnlyArray<string>,
  sources: $ReadOnlyArray<string>,
  resources?: $ReadOnlyArray<string>,
  // Relative path from target root to where the header files should be copied.
  // Can be used to ensure header search paths like <double-conversion/double-conversion.h>
  // are correctly resolved.
  headerTargetFolder?: string,
  headerSkipFolderNames?: string,
}>;

export type Define = $ReadOnly<{
  name: string,
  value?: string,
}>;

export type Settings = $ReadOnly<{
  headerSearchPaths?: $ReadOnlyArray<string>,
  defines?: $ReadOnlyArray<Define>,
  cCompilerFlags?: $ReadOnlyArray<string>,
  cxxCompilerFlags?: $ReadOnlyArray<string>,
  linkedLibraries?: $ReadOnlyArray<string>,
  publicHeaderFiles: string,
  linkerSettings?: $ReadOnlyArray<string>
}>;

export type Dependency = $ReadOnly<{
  name: string,
  version: string,
  url: URL,
  prepareScript?: string,
  files: Files,
  settings: Settings,
  disabled?: boolean,
  dependencies?: $ReadOnlyArray<string>,
}>;

export type Platform =
  'ios' |
  'ios-simulator' |
  'macos' |
  'mac-catalyst' |
  'tvos' |
  'tvos-simulator' |
  'xros' |
  'xros-simulator';

export type Destination =
  'iOS' |
  'iOS Simulator' |
  'macOS' |
  'macOS,variant=Mac Catalyst' |
  'tvOS' |
  'tvOS Simulator' |
  'visionOS' |
  'visionOS Simulator';
*/

module.exports = {};
