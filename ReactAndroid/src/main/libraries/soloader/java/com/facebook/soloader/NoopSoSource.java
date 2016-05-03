/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.soloader;

import java.io.File;

/**
 * {@link SoSource} that does nothing and pretends to successfully load all libraries.
 */
public class NoopSoSource extends SoSource {
  @Override
  public int loadLibrary(String soName, int loadFlags) {
    return LOAD_RESULT_LOADED;
  }

  @Override
  public File unpackLibrary(String soName) {
    throw new UnsupportedOperationException(
        "unpacking not supported in test mode");
  }
}
