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
import android.telephony.TelephonyManager;

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

  // Based on the ConnectionType enum described in the W3C Network Information API spec
  // (https://wicg.github.io/netinfo/).
  private static final String CONNECTION_TYPE_BLUETOOTH = "bluetooth";
  private static final String CONNECTION_TYPE_CELLULAR = "cellular";
  private static final String CONNECTION_TYPE_ETHERNET = "ethernet";
  private static final String CONNECTION_TYPE_NONE = "none";
  private static final String CONNECTION_TYPE_UNKNOWN = "unknown";
  private static final String CONNECTION_TYPE_WIFI = "wifi";
  private static final String CONNECTION_TYPE_WIMAX = "wimax";

  // Based on the EffectiveConnectionType enum described in the W3C Network Information API spec
  // (https://wicg.github.io/netinfo/).
  private static final String EFFECTIVE_CONNECTION_TYPE_UNKNOWN = "unknown";
  private static final String EFFECTIVE_CONNECTION_TYPE_2G = "2g";
  private static final String EFFECTIVE_CONNECTION_TYPE_3G = "3g";
  private static final String EFFECTIVE_CONNECTION_TYPE_4G = "4g";

  private static final String CONNECTION_TYPE_NONE_DEPRECATED = "NONE";
  private static final String CONNECTION_TYPE_UNKNOWN_DEPRECATED = "UNKNOWN";

  private static final String MISSING_PERMISSION_MESSAGE =
      "To use NetInfo on Android, add the following to your AndroidManifest.xml:\n" +
      "<uses-permission android:name=\"android.permission.ACCESS_NETWORK_STATE\" />";

  private static final String ERROR_MISSING_PERMISSION = "E_MISSING_PERMISSION";

  private final ConnectivityManager mConnectivityManager;
  private final ConnectivityBroadcastReceiver mConnectivityBroadcastReceiver;
  private boolean mNoNetworkPermission = false;

  private String mConnectivityDeprecated = CONNECTION_TYPE_UNKNOWN_DEPRECATED;
  private String mConnectionType = CONNECTION_TYPE_UNKNOWN;
  private String mEffectiveConnectionType = EFFECTIVE_CONNECTION_TYPE_UNKNOWN;

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
    updateAndSendConnectionType();
  }

  private void unregisterReceiver() {
    if (mConnectivityBroadcastReceiver.isRegistered()) {
      getReactApplicationContext().unregisterReceiver(mConnectivityBroadcastReceiver);
      mConnectivityBroadcastReceiver.setRegistered(false);
    }
  }

  private void updateAndSendConnectionType() {
    String connectionType = CONNECTION_TYPE_UNKNOWN;
    String effectiveConnectionType = EFFECTIVE_CONNECTION_TYPE_UNKNOWN;

    try {
      NetworkInfo networkInfo = mConnectivityManager.getActiveNetworkInfo();
      if (networkInfo == null || !networkInfo.isConnected()) {
        connectionType = CONNECTION_TYPE_NONE;
      } else {
        int networkType = networkInfo.getType();
        switch (networkType) {
          case ConnectivityManager.TYPE_BLUETOOTH:
            connectionType = CONNECTION_TYPE_BLUETOOTH;
            break;
          case ConnectivityManager.TYPE_ETHERNET:
            connectionType = CONNECTION_TYPE_ETHERNET;
            break;
          case ConnectivityManager.TYPE_MOBILE:
          case ConnectivityManager.TYPE_MOBILE_DUN:
            connectionType = CONNECTION_TYPE_CELLULAR;
            effectiveConnectionType = getEffectiveConnectionType(networkInfo);
            break;
          case ConnectivityManager.TYPE_WIFI:
            connectionType = CONNECTION_TYPE_WIFI;
            break;
          case ConnectivityManager.TYPE_WIMAX:
            connectionType = CONNECTION_TYPE_WIMAX;
            break;
          default:
            connectionType = CONNECTION_TYPE_UNKNOWN;
            break;
        }
      }
    } catch (SecurityException e) {
      mNoNetworkPermission = true;
      connectionType = CONNECTION_TYPE_UNKNOWN;
    }

    String currentConnectivity = getCurrentConnectionType();
    // It is possible to get multiple broadcasts for the same connectivity change, so we only
    // update and send an event when the connectivity has indeed changed.
    if (!connectionType.equalsIgnoreCase(mConnectionType) ||
        !effectiveConnectionType.equalsIgnoreCase(mEffectiveConnectionType) ||
        !currentConnectivity.equalsIgnoreCase(mConnectivityDeprecated)) {
      mConnectionType = connectionType;
      mEffectiveConnectionType = effectiveConnectionType;
      mConnectivityDeprecated = currentConnectivity;
      sendConnectivityChangedEvent();
    }
  }

  private String getCurrentConnectionType() {
    try {
      NetworkInfo networkInfo = mConnectivityManager.getActiveNetworkInfo();
      if (networkInfo == null || !networkInfo.isConnected()) {
        return CONNECTION_TYPE_NONE_DEPRECATED;
      } else if (ConnectivityManager.isNetworkTypeValid(networkInfo.getType())) {
        return networkInfo.getTypeName().toUpperCase();
      } else {
        return CONNECTION_TYPE_UNKNOWN_DEPRECATED;
      }
    } catch (SecurityException e) {
      mNoNetworkPermission = true;
      return CONNECTION_TYPE_UNKNOWN_DEPRECATED;
    }
  }

  private String getEffectiveConnectionType(NetworkInfo networkInfo) {
    switch (networkInfo.getSubtype()) {
      case TelephonyManager.NETWORK_TYPE_1xRTT:
      case TelephonyManager.NETWORK_TYPE_CDMA:
      case TelephonyManager.NETWORK_TYPE_EDGE:
      case TelephonyManager.NETWORK_TYPE_GPRS:
      case TelephonyManager.NETWORK_TYPE_IDEN:
        return EFFECTIVE_CONNECTION_TYPE_2G;
      case TelephonyManager.NETWORK_TYPE_EHRPD:
      case TelephonyManager.NETWORK_TYPE_EVDO_0:
      case TelephonyManager.NETWORK_TYPE_EVDO_A:
      case TelephonyManager.NETWORK_TYPE_EVDO_B:
      case TelephonyManager.NETWORK_TYPE_HSDPA:
      case TelephonyManager.NETWORK_TYPE_HSPA:
      case TelephonyManager.NETWORK_TYPE_HSUPA:
      case TelephonyManager.NETWORK_TYPE_UMTS:
        return EFFECTIVE_CONNECTION_TYPE_3G;
      case TelephonyManager.NETWORK_TYPE_HSPAP:
      case TelephonyManager.NETWORK_TYPE_LTE:
        return EFFECTIVE_CONNECTION_TYPE_4G;
      case TelephonyManager.NETWORK_TYPE_UNKNOWN:
      default:
        return EFFECTIVE_CONNECTION_TYPE_UNKNOWN;
    }
  }

  private void sendConnectivityChangedEvent() {
    getReactApplicationContext().getJSModule(RCTDeviceEventEmitter.class)
        .emit("networkStatusDidChange", createConnectivityEventMap());
  }

  private WritableMap createConnectivityEventMap() {
    WritableMap event = new WritableNativeMap();
    event.putString("network_info", mConnectivityDeprecated);
    event.putString("connectionType", mConnectionType);
    event.putString("effectiveConnectionType", mEffectiveConnectionType);
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
