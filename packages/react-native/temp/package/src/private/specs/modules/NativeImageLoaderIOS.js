/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

import type {RootTag} from '../../../../Libraries/TurboModule/RCTExport';
import type {TurboModule} from '../../../../Libraries/TurboModule/RCTExport';

import * as TurboModuleRegistry from '../../../../Libraries/TurboModule/TurboModuleRegistry';

export interface Spec extends TurboModule {
  +getConstants: () => {||};
  // Return [width, height] of image uri
  +getSize: (uri: string) => Promise<$ReadOnlyArray<number>>;
  +getSizeWithHeaders: (
    uri: string,
    headers: Object,
  ) => Promise<{
    width: number,
    height: number,
    ...
  }>;
  +prefetchImage: (uri: string) => Promise<boolean>;
  +prefetchImageWithMetadata?: (
    uri: string,
    queryRootName: string,
    rootTag: RootTag,
  ) => Promise<boolean>;
  +queryCache: (uris: Array<string>) => Promise<Object>;
}

export default (TurboModuleRegistry.getEnforcing<Spec>('ImageLoader'): Spec);
