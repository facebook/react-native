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

/**
 * {@link SoSource} that finds shared libraries in a given directory.
 */
public class DirectorySoSource extends SoSource {

  public static final int RESOLVE_DEPENDENCIES = 1;
  public static final int ON_LD_LIBRARY_PATH = 2;

  protected final File soDirectory;
  private final int flags;

  /**
   * Make a new DirectorySoSource.  If {@code flags} contains {@code RESOLVE_DEPENDENCIES},
   * recursively load dependencies for shared objects loaded from this directory.  (We shouldn't
   * need to resolve dependencies for libraries loaded from system directories: the dynamic linker
   * is smart enough to do it on its own there.)
   */
  public DirectorySoSource(File soDirectory, int flags) {
    this.soDirectory = soDirectory;
    this.flags = flags;
  }

  @Override
  public int loadLibrary(String soName, int loadFlags) throws IOException {
    File soFile = new File(soDirectory, soName);
    if (!soFile.exists()) {
      return LOAD_RESULT_NOT_FOUND;
    }

    if ((loadFlags & LOAD_FLAG_ALLOW_IMPLICIT_PROVISION) != 0 &&
        (flags & ON_LD_LIBRARY_PATH) != 0) {
      return LOAD_RESULT_IMPLICITLY_PROVIDED;
    }

    if ((flags & RESOLVE_DEPENDENCIES) != 0) {
      String dependencies[] = MinElf.extract_DT_NEEDED(soFile);
      for (int i = 0; i < dependencies.length; ++i) {
        String dependency = dependencies[i];
        if (dependency.startsWith("/")) {
          continue;
        }

        SoLoader.loadLibraryBySoName(
            dependency,
            (loadFlags | LOAD_FLAG_ALLOW_IMPLICIT_PROVISION));
      }
    }

    System.load(soFile.getAbsolutePath());
    return LOAD_RESULT_LOADED;
  }

  @Override
  public File unpackLibrary(String soName) throws IOException {
    File soFile = new File(soDirectory, soName);
    if (soFile.exists()) {
      return soFile;
    }

    return null;
  }
}
