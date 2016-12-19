/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.modules.netinfo;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.net.ConnectivityManager;
import android.net.NetworkInfo;
import android.support.v4.net.ConnectivityManagerCompat;

import com.facebook.react.bridge.LifecycleEventListener;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableNativeMap;
import com.facebook.react.module.annotations.ReactModule;

import static com.facebook.react.modules.core.DeviceEventManagerModule.RCTDeviceEventEmitter;

/**
 * Module that monitors and provides information about the connectivity state of the device.
 */
@ReactModule(name = "NetInfo")
public class NetInfoModule extends ReactContextBaseJavaModule
    implements LifecycleEventListener {

  private static final String CONNECTION_TYPE_NONE = "NONE";
  private static final String CONNECTION_TYPE_UNKNOWN = "UNKNOWN";
  private static final String MISSING_PERMISSION_MESSAGE =
      "To use NetInfo on Android, add the following to your AndroidManifest.xml:\n" +
      "<uses-permission android:name=\"android.permission.ACCESS_NETWORK_STATE\" />";

  private static final String ERROR_MISSING_PERMISSION = "E_MISSING_PERMISSION";

  private final ConnectivityManager mConnectivityManager;
  private final ConnectivityBroadcastReceiver mConnectivityBroadcastReceiver;
  private boolean mNoNetworkPermission = false;

  private String mConnectivity = "";

  public NetInfoModule(ReactApplicationContext reactContext) {
    super(reactContext);
    mConnectivityManager =
        (ConnectivityManager) reactContext.getSystemService(Context.CONNECTIVITY_SERVICE);
    mConnectivityBroadcastReceiver = new ConnectivityBroadcastReceiver();
  }

  @Override
  public void onHostResume() {
    registerReceiver();
  }

  @Override
  public void onHostPause() {
    unregisterReceiver();
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
    return "NetInfo";
  }

  @ReactMethod
  public void getCurrentConnectivity(Promise promise) {
    if (mNoNetworkPermission) {
      promise.reject(ERROR_MISSING_PERMISSION, MISSING_PERMISSION_MESSAGE, null);
      return;
    }
    promise.resolve(createConnectivityEventMap());
  }

  @ReactMethod
  public void isConnectionMetered(Promise promise) {
    if (mNoNetworkPermission) {
      promise.reject(ERROR_MISSING_PERMISSION, MISSING_PERMISSION_MESSAGE, null);
      return;
    }
    promise.resolve(ConnectivityManagerCompat.isActiveNetworkMetered(mConnectivityManager));
  }

  private void registerReceiver() {
    IntentFilter filter = new IntentFilter();
    filter.addAction(ConnectivityManager.CONNECTIVITY_ACTION);
    getReactApplicationContext().registerReceiver(mConnectivityBroadcastReceiver, filter);
    mConnectivityBroadcastReceiver.setRegistered(true);
  }

  private void unregisterReceiver() {
    if (mConnectivityBroadcastReceiver.isRegistered()) {
      getReactApplicationContext().unregisterReceiver(mConnectivityBroadcastReceiver);
      mConnectivityBroadcastReceiver.setRegistered(false);
    }
  }

  private void updateAndSendConnectionType() {
    String currentConnectivity = getCurrentConnectionType();
    // It is possible to get multiple broadcasts for the same connectivity change, so we only
    // update and send an event when the connectivity has indeed changed.
    if (!currentConnectivity.equalsIgnoreCase(mConnectivity)) {
      mConnectivity = currentConnectivity;
      sendConnectivityChangedEvent();
    }
  }

  private String getCurrentConnectionType() {
    try {
      NetworkInfo networkInfo = mConnectivityManager.getActiveNetworkInfo();
      if (networkInfo == null || !networkInfo.isConnected()) {
        return CONNECTION_TYPE_NONE;
      } else if (ConnectivityManager.isNetworkTypeValid(networkInfo.getType())) {
        return networkInfo.getTypeName().toUpperCase();
      } else {
        return CONNECTION_TYPE_UNKNOWN;
      }
    } catch (SecurityException e) {
      mNoNetworkPermission = true;
      return CONNECTION_TYPE_UNKNOWN;
    }
  }

  private void sendConnectivityChangedEvent() {
    getReactApplicationContext().getJSModule(RCTDeviceEventEmitter.class)
        .emit("networkStatusDidChange", createConnectivityEventMap());
  }

  private WritableMap createConnectivityEventMap() {
    WritableMap event = new WritableNativeMap();
    event.putString("network_info", mConnectivity);
    return event;
  }

  /**
   * Class that receives intents whenever the connection type changes.
   * NB: It is possible on some devices to receive certain connection type changes multiple times.
   */
  private class ConnectivityBroadcastReceiver extends BroadcastReceiver {

    //TODO: Remove registered check when source of crash is found. t9846865
    private boolean isRegistered = false;

    public void setRegistered(boolean registered) {
      isRegistered = registered;
    }

    public boolean isRegistered() {
      return isRegistered;
    }

    @Override
    public void onReceive(Context context, Intent intent) {
      if (intent.getAction().equals(ConnectivityManager.CONNECTIVITY_ACTION)) {
        updateAndSendConnectionType();
      }
    }
  }
}
