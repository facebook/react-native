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
  +getConstants: () => {|BLOB_URI_SCHEME: ?string, BLOB_URI_HOST: ?string|};
  +addNetworkingHandler: () => void;
  +addWebSocketHandler: (id: number) => void;
  +removeWebSocketHandler: (id: number) => void;
  +sendOverSocket: (blob: Object, socketID: number) => void;
  +createFromParts: (parts: Array<Object>, withId: string) => void;
  +release: (blobId: string) => void;
}

const NativeModule = TurboModuleRegistry.get<Spec>('BlobModule');

let constants = null;
let NativeBlobModule = null;

if (NativeModule != null) {
  NativeBlobModule = {
    getConstants(): {|BLOB_URI_SCHEME: ?string, BLOB_URI_HOST: ?string|} {
      if (constants == null) {
        constants = NativeModule.getConstants();
      }
      return constants;
    },
    addNetworkingHandler(): void {
      NativeModule.addNetworkingHandler();
    },
    addWebSocketHandler(id: number): void {
      NativeModule.addWebSocketHandler(id);
    },
    removeWebSocketHandler(id: number): void {
      NativeModule.removeWebSocketHandler(id);
    },
    sendOverSocket(blob: Object, socketID: number): void {
      NativeModule.sendOverSocket(blob, socketID);
    },
    createFromParts(parts: Array<Object>, withId: string): void {
      NativeModule.createFromParts(parts, withId);
    },
    release(blobId: string): void {
      NativeModule.release(blobId);
    },
  };
}

export default (NativeBlobModule: ?Spec);
