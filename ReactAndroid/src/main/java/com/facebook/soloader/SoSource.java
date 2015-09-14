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
import java.io.IOException;

abstract public class SoSource {

  /**
   * This SoSource doesn't know how to provide the given library.
   */
  public static final int LOAD_RESULT_NOT_FOUND = 0;

  /**
   * This SoSource loaded the given library.
   */
  public static final int LOAD_RESULT_LOADED = 1;

  /**
   * This SoSource did not load the library, but verified that the system loader will load it if
   * some other library depends on it.  Returned only if LOAD_FLAG_ALLOW_IMPLICIT_PROVISION is
   * provided to loadLibrary.
   */
  public static final int LOAD_RESULT_IMPLICITLY_PROVIDED = 2;

  /**
   * Allow loadLibrary to implicitly provide the library instead of actually loading it.
   */
  public static final int LOAD_FLAG_ALLOW_IMPLICIT_PROVISION = 1;

  /**
   * Load a shared library library into this process.  This routine is independent of
   * {@link #loadLibrary}.
   *
   * @param soName Name of library to load
   * @param loadFlags Zero or more of the LOAD_FLAG_XXX constants.
   * @return One of the LOAD_RESULT_XXX constants.
   */
  abstract public int loadLibrary(String soName, int LoadFlags) throws IOException;

  /**
   * Ensure that a shared library exists on disk somewhere.  This routine is independent of
   * {@link #loadLibrary}.
   *
   * @param soName Name of library to load
   * @return File if library found; {@code null} if not.
   */
  abstract public File unpackLibrary(String soName) throws IOException;
}
