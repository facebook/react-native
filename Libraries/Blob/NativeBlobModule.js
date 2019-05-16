/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

'use strict';

import type {TurboModule} from 'RCTExport';
import * as TurboModuleRegistry from 'TurboModuleRegistry';

export interface Spec extends TurboModule {
  +getConstants: () => {|BLOB_URI_SCHEME: string, BLOB_URI_HOST: ?string|};
  +addNetworkingHandler: () => void;
  +addWebSocketHandler: (id: number | string) => void;
  +removeWebSocketHandler: (id: number | string) => void;
  +sendOverSocket: (blob: Object, id: number | string) => void;
  +createFromParts: (parts: Array<Object>, blobId: number | string) => void;
  +release: (blobId: number | string) => void;
}

export default TurboModuleRegistry.getEnforcing<Spec>('BlobModule');
