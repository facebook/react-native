/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.cxxbridge;

/**
 * Bundle loader using optimized bundle API
 */
public class OptimizedJSBundleLoader extends JSBundleLoader {
  private String mPath;
  private String mSourceURL;
  private int mLoadFlags;

  public OptimizedJSBundleLoader(String path, String sourceURL, int loadFlags) {
    mLoadFlags = loadFlags;
    mSourceURL = sourceURL;
    mPath = path;
  }

  @Override
  public void loadScript(CatalystInstanceImpl instance) {
    instance.loadScriptFromOptimizedBundle(mPath, mSourceURL, mLoadFlags);
  }

  @Override
  public String getSourceUrl() {
    return mSourceURL;
  }
}
