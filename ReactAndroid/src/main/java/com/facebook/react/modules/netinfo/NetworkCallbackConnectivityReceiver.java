package com.facebook.react.modules.netinfo;

import android.annotation.SuppressLint;
import android.net.ConnectivityManager;
import android.net.LinkProperties;
import android.net.Network;
import android.net.NetworkCapabilities;
import android.net.NetworkInfo;

import com.facebook.react.bridge.ReactApplicationContext;

/**
 * This gets the connectivity status using a NetworkCallback on the system default network. This
 * method was added into Android from API level 24 (N) and we use it for all devices which support
 * it.
 */
class NetworkCallbackConnectivityReceiver extends ConnectivityReceiver {
  private final ConnectivityNetworkCallback mNetworkCallback;
  private Network mNetwork = null;
  private NetworkCapabilities mNetworkCapabilities = null;

  public NetworkCallbackConnectivityReceiver(ReactApplicationContext reactContext) {
    super(reactContext);
    mNetworkCallback = new ConnectivityNetworkCallback();
  }

  @Override
  @SuppressLint("MissingPermission")
  void register() {
    try {
      getConnectivityManager().registerDefaultNetworkCallback(mNetworkCallback);
    } catch (SecurityException e) {
      setNoNetworkPermission();
    }
  }

  @Override
  void unregister() {
    try {
      getConnectivityManager().unregisterNetworkCallback(mNetworkCallback);
    } catch (SecurityException e) {
      setNoNetworkPermission();
    }
  }

  @SuppressLint("MissingPermission")
  private void updateAndSend() {
    String connectionType = CONNECTION_TYPE_UNKNOWN;
    String effectiveConnectionType = EFFECTIVE_CONNECTION_TYPE_UNKNOWN;

    if (mNetworkCapabilities != null) {
      if (mNetworkCapabilities.hasTransport(NetworkCapabilities.TRANSPORT_BLUETOOTH)) {
        connectionType = CONNECTION_TYPE_BLUETOOTH;
      } else if (mNetworkCapabilities.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR)) {
        connectionType = CONNECTION_TYPE_CELLULAR;

        if (mNetwork != null) {
          NetworkInfo networkInfo = getConnectivityManager().getNetworkInfo(mNetwork);
          effectiveConnectionType = getEffectiveConnectionType(networkInfo);
        }
      } else if (mNetworkCapabilities.hasTransport(NetworkCapabilities.TRANSPORT_ETHERNET)) {
        connectionType = CONNECTION_TYPE_ETHERNET;
      } else if (mNetworkCapabilities.hasTransport(NetworkCapabilities.TRANSPORT_WIFI)) {
        connectionType = CONNECTION_TYPE_WIFI;
      }
    }

    updateConnectivity(connectionType, effectiveConnectionType);
  }

  private class ConnectivityNetworkCallback extends ConnectivityManager.NetworkCallback {
    @Override
    public void onAvailable(Network network) {
      mNetwork = network;
      updateAndSend();
    }

    @Override
    public void onLosing(Network network, int maxMsToLive) {
      mNetwork = network;
      updateAndSend();
    }

    @Override
    public void onLost(Network network) {
      mNetwork = null;
      mNetworkCapabilities = null;
      updateAndSend();
    }

    @Override
    public void onUnavailable() {
      mNetwork = null;
      mNetworkCapabilities = null;
      updateAndSend();
    }

    @Override
    public void onCapabilitiesChanged(Network network, NetworkCapabilities networkCapabilities) {
      mNetwork = network;
      mNetworkCapabilities = networkCapabilities;
      updateAndSend();
    }

    @Override
    public void onLinkPropertiesChanged(Network network, LinkProperties linkProperties) {
      mNetwork = network;
      updateAndSend();
    }
  }
}
