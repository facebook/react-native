/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.bridge;

import android.content.Context;

import com.facebook.react.common.DebugServerException;

/**
 * A class that stores JS bundle information and allows {@link CatalystInstance} to load a correct
 * bundle through {@link ReactBridge}.
 */
public abstract class JSBundleLoader {

  /**
   * This loader is recommended one for release version of your app. In that case local JS executor
   * should be used. JS bundle will be read from assets in native code to save on passing large
   * strings from java to native memory.
   */
  public static JSBundleLoader createAssetLoader(
      final Context context,
      final String assetUrl,
      final boolean loadSynchronously) {
    return new JSBundleLoader() {
      @Override
      public String loadScript(CatalystInstanceImpl instance) {
        instance.loadScriptFromAssets(context.getAssets(), assetUrl, loadSynchronously);
        return assetUrl;
      }
    };
  }

  /**
   * This loader loads bundle from file system. The bundle will be read in native code to save on
   * passing large strings from java to native memorory.
   */
  public static JSBundleLoader createFileLoader(final String fileName) {
    return createFileLoader(fileName, fileName, false);
  }

  public static JSBundleLoader createFileLoader(
      final String fileName,
      final String assetUrl,
      final boolean loadSynchronously) {
    return new JSBundleLoader() {
      @Override
      public String loadScript(CatalystInstanceImpl instance) {
        instance.loadScriptFromFile(fileName, assetUrl, loadSynchronously);
        return fileName;
      }
    };
  }

  /**
   * This loader is used when bundle gets reloaded from dev server. In that case loader expect JS
   * bundle to be prefetched and stored in local file. We do that to avoid passing large strings
   * between java and native code and avoid allocating memory in java to fit whole JS bundle in it.
   * Providing correct {@param sourceURL} of downloaded bundle is required for JS stacktraces to
   * work correctly and allows for source maps to correctly symbolize those.
   */
  public static JSBundleLoader createCachedBundleFromNetworkLoader(
      final String sourceURL,
      final String cachedFileLocation) {
    return new JSBundleLoader() {
      @Override
      public String loadScript(CatalystInstanceImpl instance) {
        try {
          instance.loadScriptFromFile(cachedFileLocation, sourceURL, false);
          return sourceURL;
        } catch (Exception e) {
          throw DebugServerException.makeGeneric(e.getMessage(), e);
        }
      }
    };
  }

  /**
   * This loader is used when proxy debugging is enabled. In that case there is no point in fetching
   * the bundle from device as remote executor will have to do it anyway.
   */
  public static JSBundleLoader createRemoteDebuggerBundleLoader(
      final String proxySourceURL,
      final String realSourceURL) {
    return new JSBundleLoader() {
      @Override
      public String loadScript(CatalystInstanceImpl instance) {
        instance.setSourceURLs(realSourceURL, proxySourceURL);
        return realSourceURL;
      }
    };
  }

  /**
   * Loads the script, returning the URL of the source it loaded.
   */
  public abstract String loadScript(CatalystInstanceImpl instance);
}
