/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

import type {TurboModule} from '../TurboModule/RCTExport';
import * as TurboModuleRegistry from '../TurboModule/TurboModuleRegistry';

export interface Spec extends TurboModule {
  +abortRequest: (requestId: number) => void;
  +getConstants: () => {||};
  +getSize: (uri: string) => Promise<
    $ReadOnly<{
      width: number,
      height: number,
      ...
    }>,
  >;
  +getSizeWithHeaders: (
    uri: string,
    headers: Object,
  ) => Promise<{
    width: number,
    height: number,
    ...
  }>;
  +prefetchImage: (uri: string, requestId: number) => Promise<boolean>;
  +queryCache: (uris: Array<string>) => Promise<Object>;
}

export default (TurboModuleRegistry.getEnforcing<Spec>('ImageLoader'): Spec);
