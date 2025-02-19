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

// We need to pass through the downloaded files and only keep the ones highlighted here.
// We can delete the rest of the files.
export type FilesToKeep = $ReadOnly<{
  headers: Folder | $ReadOnlyArray<string>,
  sources: $ReadOnlyArray<string>,
}>;


export type Dependency = $ReadOnly<{
  name: string,
  version: string,
  url: URL,
  prepareScript?: string,
  filesToKeep: FilesToKeep,
  copyHeaderRule?: 'skipFirstFolder', // We can use this field to handle specifics of 3rd party libraries
}>;
*/

const dependencies /*: $ReadOnlyArray<Dependency> */ = [
  {
    name: 'glog',
    version: '0.3.5',
    url: new URL(
      'https://github.com/google/glog/archive/refs/tags/v0.3.5.tar.gz',
    ),
    prepareScript: './packages/react-native/scripts/ios-configure-glog.sh',
    filesToKeep: {
      headers: /src(\/(glog|base))?\/[a-zA-Z0-9_-]+\.h$/, // Keep all headers in src, src/glog and src/base
      sources: [
        'src/demangle.cc',
        'src/logging.cc',
        'src/raw_logging.cc',
        'src/signalhandler.cc',
        'src/symbolize.cc',
        'src/utilities.cc',
        'src/vlog_is_on.cc',
      ],
    },
    copyHeaderRule: 'skipFirstFolder',
  },
];

module.exports = dependencies;
