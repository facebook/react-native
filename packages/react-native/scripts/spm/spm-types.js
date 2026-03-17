/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

/*::
// ---------------------------------------------------------------------------
// setup-ios-spm.js
// ---------------------------------------------------------------------------

export type SetupArgs = {
  version: string | null,
  localXcframework: string | null,
  artifactsDir: string | null,
  flavor: string,
  init: boolean,
  clean: boolean,
  skipCodegen: boolean,
  skipDownload: boolean,
  forceDownload: boolean,
  skipXcodeproj: boolean,
  bundleIdentifier: string | null,
  productName: string | null,
  entryFile: string | null,
};

// ---------------------------------------------------------------------------
// download-spm-artifacts.js
// ---------------------------------------------------------------------------

export type DownloadArgs = {
  version: string | null,
  flavor: string,
  output: string | null,
};

export type ResolvedArtifact = {
  url: string,
  version: string,
};

export type ProcessResult = {
  label: string,
  version: string,
  xcframeworkPath: string,
  url: string,
};

export type ArtifactResultEntry =
  | {name: string, error: void, label: string, version: string, xcframeworkPath: string, url: string}
  | {name: string, error: string};

// ---------------------------------------------------------------------------
// generate-spm-autolinking.js
// ---------------------------------------------------------------------------

export type AutolinkingArgs = {
  appRoot: string,
  reactNativeRoot: string | null,
  autolinkingJson: string | null,
  output: string | null,
  xcframeworksPath: string | null,
};

export type SpmTarget = {
  name: string,
  path: string,
  exclude: Array<string>,
  publicHeadersPath: string | null,
  resources?: Array<string>,
  extraCxxAbsHeaderPaths?: Array<string>,
  _appRoot?: string | null,
};


// ---------------------------------------------------------------------------
// generate-spm-package.js
// ---------------------------------------------------------------------------

export type GeneratePackageArgs = {
  appRoot: string,
  reactNativeRoot: string | null,
  version: string | null,
  localXcframework: string | null,
  artifactsDir: string | null,
  appName: string | null,
  targetName: string | null,
  sourcePath: string | null,
  iosVersion: string,
  output: string | null,
  init: boolean,
};

export type ScanResult = {
  swiftFiles: Array<string>,
  hasObjC: boolean,
};

// ---------------------------------------------------------------------------
// generate-spm-xcodeproj.js
// ---------------------------------------------------------------------------

export type GenerateXcodeprojArgs = {
  appRoot: string,
  reactNativeRoot: string | null,
  appName: string | null,
  sourcePath: string | null,
  iosVersion: string,
  bundleIdentifier: string | null,
  entryFile: string | null,
};

// ---------------------------------------------------------------------------
// spm-pbxproj.js
// ---------------------------------------------------------------------------

export type ProjectFiles = {
  sources: Array<string>,
  headers: Array<string>,
  resources: Array<string>,
  plists: Array<string>,
};

export type PbxprojEntry = {
  uuid: string,
  comment: string,
  fields: {[string]: string},
};

export type PbxprojSections = {[string]: Array<PbxprojEntry>};

export type GeneratePackageOpts = {
  appName: string,
  targetName: string,
  sourcePath: string,
  iosVersion: string,
  version: string,
  localXcframework: string | null,
  localArtifacts: {[string]: {xcframeworkPath: string, url: string}} | null,
  xcframeworksPackagePath: string | null,
  xcframeworkHeadersPath: string | null,
  depsXcfwHeadersPath: string | null,
  extraCxxAbsHeaderPaths: Array<string>,
  appRoot: string,
  codegenPackagePath: string,
  autolinkedPackagePath: string,
  swiftFiles: Array<string>,
  hasObjC: boolean,
};
*/

module.exports = {};
