/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */

export type BlobData = {
  /*
   * Unique id to identify the blob on native side
   */
  blobId: string;
  /*
   * Offset to indicate part of blob, used when sliced
   */
  offset: number;

  size: number;
  type?: string;
  name?: string;
  lastModified?: number;
};


export type BlobOptions = {
  type: string;
  endings: "transparent" | "native";
}
