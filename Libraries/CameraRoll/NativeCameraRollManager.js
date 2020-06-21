/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

import type {TurboModule} from '../TurboModule/RCTExport';
import * as TurboModuleRegistry from '../TurboModule/TurboModuleRegistry';

export type PhotoIdentifier = {|
  node: {|
    image: PhotoIdentifierImage,
    type: string,
    group_name: string,
    timestamp: number,
    location: {|
      longitude: number,
      latitude: number,

      // iOS Only
      altitude: ?number,
      heading: ?number,
      speed: ?number,
    |},
  |},
|};

export type PhotoIdentifierImage = {|
  uri: string,
  playableDuration: number,
  width: number,
  height: number,
  isStored: ?boolean,
  filename: ?string,
|};

export type PhotoIdentifiersPage = {|
  edges: Array<PhotoIdentifier>,
  page_info: {|
    has_next_page: boolean,
    start_cursor?: ?string,
    end_cursor?: ?string,
  |},
|};

export type GetPhotosParams = {|
  first: number,
  after?: ?string,
  groupName?: ?string,
  groupTypes?: ?string,
  assetType?: ?string,
  maxSize?: ?number,
  mimeTypes?: ?Array<string>,
|};

export interface Spec extends TurboModule {
  +getConstants: () => {||};
  +getPhotos: (params: GetPhotosParams) => Promise<PhotoIdentifiersPage>;
  +saveToCameraRoll: (uri: string, type: string) => Promise<string>;

  // iOS Only
  +deletePhotos: (assets: Array<string>) => Promise<boolean>;
}

export default (TurboModuleRegistry.getEnforcing<Spec>(
  'CameraRollManager',
): Spec);
