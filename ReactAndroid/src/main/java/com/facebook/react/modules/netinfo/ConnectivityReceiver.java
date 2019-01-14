package com.facebook.react.modules.netinfo;

import android.annotation.SuppressLint;
import android.content.Context;
import android.net.ConnectivityManager;
import android.net.NetworkInfo;
import android.support.v4.net.ConnectivityManagerCompat;
import android.telephony.TelephonyManager;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableNativeMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;

abstract class ConnectivityReceiver {
  // Based on the ConnectionType enum described in the W3C Network Information API spec
  // (https://wicg.github.io/netinfo/).
  static final String CONNECTION_TYPE_BLUETOOTH = "bluetooth";
  static final String CONNECTION_TYPE_CELLULAR = "cellular";
  static final String CONNECTION_TYPE_ETHERNET = "ethernet";
  static final String CONNECTION_TYPE_NONE = "none";
  static final String CONNECTION_TYPE_UNKNOWN = "unknown";
  static final String CONNECTION_TYPE_WIFI = "wifi";
  static final String CONNECTION_TYPE_WIMAX = "wimax";

  // Based on the EffectiveConnectionType enum described in the W3C Network Information API spec
  // (https://wicg.github.io/netinfo/).
  static final String EFFECTIVE_CONNECTION_TYPE_UNKNOWN = "unknown";
  static final String EFFECTIVE_CONNECTION_TYPE_2G = "2g";
  static final String EFFECTIVE_CONNECTION_TYPE_3G = "3g";
  static final String EFFECTIVE_CONNECTION_TYPE_4G = "4g";


  static final String MISSING_PERMISSION_MESSAGE =
    "To use NetInfo on Android, add the following to your AndroidManifest.xml:\n" +
      "<uses-permission android:name=\"android.permission.ACCESS_NETWORK_STATE\" />";

  static final String ERROR_MISSING_PERMISSION = "E_MISSING_PERMISSION";

  private final ConnectivityManager mConnectivityManager;
  private final ReactApplicationContext mReactContext;

  private boolean mNoNetworkPermission = false;
  private String mConnectionType = CONNECTION_TYPE_UNKNOWN;
  private String mEffectiveConnectionType = EFFECTIVE_CONNECTION_TYPE_UNKNOWN;

  ConnectivityReceiver(ReactApplicationContext reactContext) {
    mReactContext = reactContext;
    mConnectivityManager =
      (ConnectivityManager) reactContext.getSystemService(Context.CONNECTIVITY_SERVICE);
  }

  abstract void register();
  abstract void unregister();

  public void getCurrentConnectivity(Promise promise) {
    if (mNoNetworkPermission) {
      promise.reject(ERROR_MISSING_PERMISSION, MISSING_PERMISSION_MESSAGE);
      return;
    }
    promise.resolve(createConnectivityEventMap());
  }

  @SuppressLint("MissingPermission")
  public void isConnectionMetered(Promise promise) {
    if (mNoNetworkPermission) {
      promise.reject(ERROR_MISSING_PERMISSION, MISSING_PERMISSION_MESSAGE);
      return;
    }
    promise.resolve(ConnectivityManagerCompat.isActiveNetworkMetered(getConnectivityManager()));
  }

  public ReactApplicationContext getReactContext() {
    return mReactContext;
  }

  public ConnectivityManager getConnectivityManager() {
    return mConnectivityManager;
  }

  public void setNoNetworkPermission() {
    mNoNetworkPermission = true;
  }

  String getEffectiveConnectionType(NetworkInfo networkInfo) {
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

  void updateConnectivity(String connectionType, String effectiveConnectionType) {
    // It is possible to get multiple broadcasts for the same connectivity change, so we only
    // update and send an event when the connectivity has indeed changed.
    if (!connectionType.equalsIgnoreCase(mConnectionType) ||
      !effectiveConnectionType.equalsIgnoreCase(mEffectiveConnectionType)) {
      mConnectionType = connectionType;
      mEffectiveConnectionType = effectiveConnectionType;
      sendConnectivityChangedEvent();
    }
  }

  private void sendConnectivityChangedEvent() {
    getReactContext().getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
      .emit("networkStatusDidChange", createConnectivityEventMap());
  }

  private WritableMap createConnectivityEventMap() {
    WritableMap event = new WritableNativeMap();
    event.putString("connectionType", mConnectionType);
    event.putString("effectiveConnectionType", mEffectiveConnectionType);
    return event;
  }
}
