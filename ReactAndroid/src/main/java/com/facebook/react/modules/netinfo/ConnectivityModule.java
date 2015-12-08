// Copyright 2004-present Facebook. All Rights Reserved.

package com.facebook.react.modules.netinfo;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.net.ConnectivityManager;
import android.net.NetworkInfo;
import android.support.v4.net.ConnectivityManagerCompat;

import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.LifecycleEventListener;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableNativeMap;

import static com.facebook.react.modules.core.DeviceEventManagerModule.RCTDeviceEventEmitter;

/**
 * Module that monitors and provides information about the connectivity state of the device.
 */
public class ConnectivityModule extends ReactContextBaseJavaModule
    implements LifecycleEventListener {

  private static final String CONNECTION_TYPE_NONE = "NONE";
  private static final String CONNECTION_TYPE_UNKNOWN = "UNKNOWN";

  private final ConnectivityManager mConnectivityManager;
  private final ConnectivityManagerCompat mConnectivityManagerCompat;
  private final ConnectivityBroadcastReceiver mConnectivityBroadcastReceiver;

  private String mConnectivity = "";

  public ConnectivityModule(ReactApplicationContext reactContext) {
    super(reactContext);
    mConnectivityManager =
        (ConnectivityManager) reactContext.getSystemService(Context.CONNECTIVITY_SERVICE);
    mConnectivityManagerCompat = new ConnectivityManagerCompat();
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
  public void getCurrentConnectivity(Callback successCallback, Callback errorCallback) {
    successCallback.invoke(createConnectivityEventMap());
  }

  @ReactMethod
  public void isConnectionMetered(Callback successCallback) {
    successCallback.invoke(mConnectivityManagerCompat.isActiveNetworkMetered(mConnectivityManager));
  }

  private void registerReceiver() {
    IntentFilter filter = new IntentFilter();
    filter.addAction(ConnectivityManager.CONNECTIVITY_ACTION);
    getReactApplicationContext().registerReceiver(mConnectivityBroadcastReceiver, filter);
  }

  private void unregisterReceiver() {
    getReactApplicationContext().unregisterReceiver(mConnectivityBroadcastReceiver);
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
    NetworkInfo networkInfo = mConnectivityManager.getActiveNetworkInfo();
    if (networkInfo == null || !networkInfo.isConnected()) {
      return CONNECTION_TYPE_NONE;
    } else if (ConnectivityManager.isNetworkTypeValid(networkInfo.getType())) {
      return networkInfo.getTypeName().toUpperCase();
    } else {
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

    @Override
    public void onReceive(Context context, Intent intent) {
      if (intent.getAction().equals(ConnectivityManager.CONNECTIVITY_ACTION)) {
        updateAndSendConnectionType();
      }
    }
  }
}
