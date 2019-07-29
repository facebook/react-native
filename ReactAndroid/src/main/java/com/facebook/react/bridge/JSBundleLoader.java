/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * <p>This source code is licensed under the MIT license found in the LICENSE file in the root
 * directory of this source tree.
 */
package com.facebook.react.bridge;

import android.content.Context;
import com.facebook.react.common.DebugServerException;

/**
 * A class that stores JS bundle information and allows a {@link JSBundleLoaderDelegate} (e.g.
 * {@link CatalystInstance}) to load a correct bundle through {@link ReactBridge}.
 */
public abstract class JSBundleLoader {

  /**
   * This loader is recommended one for release version of your app. In that case local JS executor
   * should be used. JS bundle will be read from assets in native code to save on passing large
   * strings from java to native memory.
   */
  public static JSBundleLoader createAssetLoader(
      final Context context, final String assetUrl, final boolean loadSynchronously) {
    return new JSBundleLoader() {
      @Override
      public String loadScript(JSBundleLoaderDelegate delegate) {
        delegate.loadScriptFromAssets(context.getAssets(), assetUrl, loadSynchronously);
        return assetUrl;
      }
    };
  }

  /**
   * This loader loads bundle from file system. The bundle will be read in native code to save on
   * passing large strings from java to native memory.
   */
  public static JSBundleLoader createFileLoader(final String fileName) {
    return createFileLoader(fileName, fileName, false);
  }

  public static JSBundleLoader createFileLoader(
      final String fileName, final String assetUrl, final boolean loadSynchronously) {
    return new JSBundleLoader() {
      @Override
      public String loadScript(JSBundleLoaderDelegate delegate) {
        delegate.loadScriptFromFile(fileName, assetUrl, loadSynchronously);
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
      final String sourceURL, final String cachedFileLocation) {
    return new JSBundleLoader() {
      @Override
      public String loadScript(JSBundleLoaderDelegate delegate) {
        try {
          delegate.loadScriptFromFile(cachedFileLocation, sourceURL, false);
          return sourceURL;
        } catch (Exception e) {
          throw DebugServerException.makeGeneric(sourceURL, e.getMessage(), e);
        }
      }
    };
  }

  /**
   * This loader is used to load delta bundles from the dev server. We pass each delta message to
   * the loader and process it in C++. Passing it as a string leads to inefficiencies due to memory
   * copies, which will have to be addressed in a follow-up.
   *
   * @param nativeDeltaClient
   */
  public static JSBundleLoader createDeltaFromNetworkLoader(
      final String sourceURL, final NativeDeltaClient nativeDeltaClient) {
    return new JSBundleLoader() {
      @Override
      public String loadScript(JSBundleLoaderDelegate delegate) {
        try {
          delegate.loadScriptFromDeltaBundle(sourceURL, nativeDeltaClient, false);
          return sourceURL;
        } catch (Exception e) {
          throw DebugServerException.makeGeneric(sourceURL, e.getMessage(), e);
        }
      }
    };
  }

  /**
   * This loader is used when proxy debugging is enabled. In that case there is no point in fetching
   * the bundle from device as remote executor will have to do it anyway.
   */
  public static JSBundleLoader createRemoteDebuggerBundleLoader(
      final String proxySourceURL, final String realSourceURL) {
    return new JSBundleLoader() {
      @Override
      public String loadScript(JSBundleLoaderDelegate delegate) {
        delegate.setSourceURLs(realSourceURL, proxySourceURL);
        return realSourceURL;
      }
    };
  }

  /** Loads the script, returning the URL of the source it loaded. */
  public abstract String loadScript(JSBundleLoaderDelegate delegate);
}
