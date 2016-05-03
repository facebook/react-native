/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.soloader;

import java.util.List;

import android.util.Log;

/**
 * This is the base class for all the classes representing certain native library.
 * For loading native libraries we should always inherit from this class and provide relevant
 * information (libraries to load, code to test native call, dependencies?).
 * <p>
 * This instances should be singletons provided by DI.
 * <p>
 * This is a basic template but could be improved if we find the need.
 */
public abstract class NativeLibrary {
  private static final String TAG = NativeLibrary.class.getName();

  private final Object mLock;
  private List<String> mLibraryNames;
  private Boolean mLoadLibraries;
  private boolean mLibrariesLoaded;
  private volatile UnsatisfiedLinkError mLinkError;

  protected NativeLibrary(List<String> libraryNames) {
    mLock = new Object();
    mLoadLibraries = true;
    mLibrariesLoaded = false;
    mLinkError = null;
    mLibraryNames = libraryNames;
  }

  /**
   * safe loading of native libs
   * @return true if native libs loaded properly, false otherwise
   */
  public boolean loadLibraries() {
    synchronized (mLock) {
      if (mLoadLibraries == false) {
        return mLibrariesLoaded;
      }
      try {
        for (String name: mLibraryNames) {
          SoLoader.loadLibrary(name);
        }
        initialNativeCheck();
        mLibrariesLoaded = true;
        mLibraryNames = null;
      } catch (UnsatisfiedLinkError error) {
        Log.e(TAG, "Failed to load native lib: ", error);
        mLinkError = error;
        mLibrariesLoaded = false;
      }
      mLoadLibraries = false;
      return mLibrariesLoaded;
    }
  }

  /**
   * loads libraries (if not loaded yet), throws on failure
   * @throws UnsatisfiedLinkError
   */

  public void ensureLoaded() throws UnsatisfiedLinkError {
    if (!loadLibraries()) {
      throw mLinkError;
    }
  }

  /**
   * Override this method to make some concrete (quick and harmless) native call.
   * This avoids lazy-loading some phones (LG) use when we call loadLibrary. If there's a problem
   * we'll face an UnsupportedLinkError when first using the feature instead of here.
   * This check force a check right when intended.
   * This way clients of this library can know if it's loaded for sure or not.
   * @throws UnsatisfiedLinkError if there was an error loading native library
   */
  protected void initialNativeCheck() throws UnsatisfiedLinkError {
  }

  public UnsatisfiedLinkError getError() {
    return mLinkError;
  }
}
