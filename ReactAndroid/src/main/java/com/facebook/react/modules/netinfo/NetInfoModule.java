/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.modules.netinfo;

import android.os.Build;

import com.facebook.react.bridge.LifecycleEventListener;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.module.annotations.ReactModule;

/**
 * Module that monitors and provides information about the connectivity state of the device.
 */
@ReactModule(name = NetInfoModule.NAME)
public class NetInfoModule extends ReactContextBaseJavaModule implements LifecycleEventListener {
  public static final String NAME = "NetInfo";

  private final ConnectivityReceiver mConnectivityReceiver;

  public NetInfoModule(ReactApplicationContext reactContext) {
    super(reactContext);
    // Create the connectivity receiver based on the API level we are running on
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
      mConnectivityReceiver = new NetworkCallbackConnectivityReceiver(reactContext);
    } else {
      mConnectivityReceiver = new BroadcastReceiverConnectivityReceiver(reactContext);
    }
  }

  @Override
  public void onHostResume() {
    mConnectivityReceiver.register();
  }

  @Override
  public void onHostPause() {
    mConnectivityReceiver.unregister();
  }

  @Override
  public void onHostDestroy() {
  }

  @Override
  public void initialize() {
    getReactApplicationContext().addLifecycleEventListener(this);
  }

  @Override
  public String getName() {
    return NAME;
  }

  @ReactMethod
  public void getCurrentConnectivity(Promise promise) {
    mConnectivityReceiver.getCurrentConnectivity(promise);
  }

  @ReactMethod
  public void isConnectionMetered(Promise promise) {
    mConnectivityReceiver.isConnectionMetered(promise);
  }
}
