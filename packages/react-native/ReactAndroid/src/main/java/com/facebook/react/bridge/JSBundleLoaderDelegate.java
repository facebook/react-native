/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge;

import android.content.Context;
import android.content.res.AssetManager;

/** An interface for classes that initialize JavaScript using {@link JSBundleLoader} */
public interface JSBundleLoaderDelegate {

  /**
   * Load a JS bundle from Android assets. See {@link JSBundleLoader#createAssetLoader(Context,
   * String, boolean)}
   *
   * @param assetManager
   * @param assetURL
   * @param loadSynchronously
   */
  void loadScriptFromAssets(AssetManager assetManager, String assetURL, boolean loadSynchronously);

  /**
   * Load a JS bundle from the filesystem. See {@link JSBundleLoader#createFileLoader(String)} and
   * {@link JSBundleLoader#createCachedBundleFromNetworkLoader(String, String)}
   *
   * @param fileName
   * @param sourceURL
   * @param loadSynchronously
   */
  void loadScriptFromFile(String fileName, String sourceURL, boolean loadSynchronously);

  /**
   * Load a split JS bundle from the filesystem. See {@link
   * JSBundleLoader#createCachedSplitBundleFromNetworkLoader(String, String)}.
   */
  void loadSplitBundleFromFile(String fileName, String sourceURL);

  /**
   * This API is used in situations where the JS bundle is being executed not on the device, but on
   * a host machine. In that case, we must provide two source URLs for the JS bundle: One to be used
   * on the device, and one to be used on the remote debugging machine.
   *
   * @param deviceURL A source URL that is accessible from this device.
   * @param remoteURL A source URL that is accessible from the remote machine executing the JS.
   */
  void setSourceURLs(String deviceURL, String remoteURL);
}
