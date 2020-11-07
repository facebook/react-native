/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

'use strict';

export opaque type BlobCollector: {...} = {...};

// **Temporary workaround**
// TODO(#24654): Use turbomodules for the Blob module.
// Blob collector is a jsi::HostObject that is used by native to know
// when the a Blob instance is deallocated. This allows to free the
// underlying native resources. This is a hack to workaround the fact
// that the current bridge infra doesn't allow to track js objects
// deallocation. Ideally the whole Blob object should be a jsi::HostObject.
export function createBlobCollector(blobId: string): BlobCollector {
  if (global.__blobCollectorProvider == null) {
    return {};
  } else {
    return global.__blobCollectorProvider(blobId);
  }
}

export type BlobData = {
  blobId: string,
  offset: number,
  size: number,
  name?: string,
  type?: string,
  lastModified?: number,
  __collector?: ?BlobCollector,
  ...
};

export type BlobOptions = {
  type: string,
  lastModified: number,
  ...
};
