/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.devsupport;

import com.facebook.react.bridge.JavaScriptModule;

/**
 * JS module interface for HMRClient
 *
 * <p>The HMR(Hot Module Replacement)Client allows for the application to receive updates from Metro
 * (over a web socket), allowing for injection of JavaScript to the running application (without a
 * refresh).
 */
public interface HMRClient extends JavaScriptModule {

  /**
   * Enable the HMRClient so that the client will receive updates from Metro.
   *
   * @param platform The platform in which HMR updates will be enabled. Should be "android".
   * @param bundleEntry The path to the bundle entry file (e.g. index.ios.bundle).
   * @param host The host that the HMRClient should communicate with.
   * @param port The port that the HMRClient should communicate with on the host.
   * @param isEnabled Whether HMR is enabled initially.
   */
  void setup(String platform, String bundleEntry, String host, int port, boolean isEnabled);

  /** Registers an additional JS bundle with HMRClient. */
  void registerBundle(String bundleUrl);

  /**
   * Sets up a connection to the packager when called the first time. Ensures code updates received
   * from the packager are applied.
   */
  void enable();

  /** Turns off the HMR client so it doesn't process updates from the packager. */
  void disable();
}
