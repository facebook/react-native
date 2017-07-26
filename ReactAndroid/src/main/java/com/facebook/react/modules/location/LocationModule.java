/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.modules.location;

import android.content.Context;
import android.location.Location;
import android.location.LocationListener;
import android.location.LocationManager;
import android.location.LocationProvider;
import android.os.Bundle;
import android.os.Handler;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.common.SystemClock;
import com.facebook.react.module.annotations.ReactModule;
import com.facebook.react.modules.core.DeviceEventManagerModule.RCTDeviceEventEmitter;

import javax.annotation.Nullable;

/**
 * Native module that exposes Geolocation to JS.
 */
@ReactModule(name = "LocationObserver")
public class LocationModule extends ReactContextBaseJavaModule {

  private @Nullable String mWatchedProvider;
  private static final float RCT_DEFAULT_LOCATION_ACCURACY = 100;

  private final LocationListener mLocationListener = new LocationListener() {
    @Override
    public void onLocationChanged(Location location) {
      getReactApplicationContext().getJSModule(RCTDeviceEventEmitter.class)
          .emit("geolocationDidChange", locationToMap(location));
    }

    @Override
    public void onStatusChanged(String provider, int status, Bundle extras) {
      if (status == LocationProvider.OUT_OF_SERVICE) {
        emitError(PositionError.POSITION_UNAVAILABLE, "Provider " + provider + " is out of service.");
      } else if (status == LocationProvider.TEMPORARILY_UNAVAILABLE) {
        emitError(PositionError.TIMEOUT, "Provider " + provider + " is temporarily unavailable.");
      }
    }

    @Override
    public void onProviderEnabled(String provider) { }

    @Override
    public void onProviderDisabled(String provider) { }
  };

  public LocationModule(ReactApplicationContext reactContext) {
    super(reactContext);
  }

  @Override
  public String getName() {
    return "LocationObserver";
  }

  private static class LocationOptions {
    private final long timeout;
    private final double maximumAge;
    private final boolean highAccuracy;
    private final float distanceFilter;

    private LocationOptions(
      long timeout,
      double maximumAge,
      boolean highAccuracy,
      float distanceFilter) {
      this.timeout = timeout;
      this.maximumAge = maximumAge;
      this.highAccuracy = highAccuracy;
      this.distanceFilter = distanceFilter;
    }

    private static LocationOptions fromReactMap(ReadableMap map) {
      // precision might be dropped on timeout (double -> int conversion), but that's OK
      long timeout =
          map.hasKey("timeout") ? (long) map.getDouble("timeout") : Long.MAX_VALUE;
      double maximumAge =
          map.hasKey("maximumAge") ? map.getDouble("maximumAge") : Double.POSITIVE_INFINITY;
      boolean highAccuracy =
          map.hasKey("enableHighAccuracy") && map.getBoolean("enableHighAccuracy");
      float distanceFilter = map.hasKey("distanceFilter") ?
        (float) map.getDouble("distanceFilter") :
        RCT_DEFAULT_LOCATION_ACCURACY;

      return new LocationOptions(timeout, maximumAge, highAccuracy, distanceFilter);
    }
  }

  /**
   * Get the current position. This can return almost immediately if the location is cached or
   * request an update, which might take a while.
   *
   * @param options map containing optional arguments: timeout (millis), maximumAge (millis) and
   *        highAccuracy (boolean)
   */
  @ReactMethod
  public void getCurrentPosition(
      ReadableMap options,
      final Callback success,
      Callback error) {
    LocationOptions locationOptions = LocationOptions.fromReactMap(options);

    try {
      LocationManager locationManager =
          (LocationManager) getReactApplicationContext().getSystemService(Context.LOCATION_SERVICE);
      String provider = getValidProvider(locationManager, locationOptions.highAccuracy);
      if (provider == null) {
        error.invoke(PositionError.buildError(
                PositionError.PERMISSION_DENIED,
                "No location provider available."));
        return;
      }
      Location location = locationManager.getLastKnownLocation(provider);
      if (location != null &&
          SystemClock.currentTimeMillis() - location.getTime() < locationOptions.maximumAge) {
        success.invoke(locationToMap(location));
        return;
      }
      new SingleUpdateRequest(locationManager, provider, locationOptions.timeout, success, error)
          .invoke();
    } catch (SecurityException e) {
      throwLocationPermissionMissing(e);
    }
  }

  /**
   * Start listening for location updates. These will be emitted via the
   * {@link RCTDeviceEventEmitter} as {@code geolocationDidChange} events.
   *
   * @param options map containing optional arguments: highAccuracy (boolean)
   */
  @ReactMethod
  public void startObserving(ReadableMap options) {
    if (LocationManager.GPS_PROVIDER.equals(mWatchedProvider)) {
      return;
    }
    LocationOptions locationOptions = LocationOptions.fromReactMap(options);

    try {
      LocationManager locationManager =
          (LocationManager) getReactApplicationContext().getSystemService(Context.LOCATION_SERVICE);
      String provider = getValidProvider(locationManager, locationOptions.highAccuracy);
      if (provider == null) {
        emitError(PositionError.PERMISSION_DENIED, "No location provider available.");
        return;
      }
      if (!provider.equals(mWatchedProvider)) {
        locationManager.removeUpdates(mLocationListener);
        locationManager.requestLocationUpdates(
          provider,
          1000,
          locationOptions.distanceFilter,
          mLocationListener);
      }
      mWatchedProvider = provider;
    } catch (SecurityException e) {
      throwLocationPermissionMissing(e);
    }
  }

  /**
   * Stop listening for location updates.
   *
   * NB: this is not balanced with {@link #startObserving}: any number of calls to that method will
   * be canceled by just one call to this one.
   */
  @ReactMethod
  public void stopObserving() {
    LocationManager locationManager =
        (LocationManager) getReactApplicationContext().getSystemService(Context.LOCATION_SERVICE);
    locationManager.removeUpdates(mLocationListener);
    mWatchedProvider = null;
  }

  @Nullable
  private static String getValidProvider(LocationManager locationManager, boolean highAccuracy) {
    String provider =
        highAccuracy ? LocationManager.GPS_PROVIDER : LocationManager.NETWORK_PROVIDER;
    if (!locationManager.isProviderEnabled(provider)) {
      provider = provider.equals(LocationManager.GPS_PROVIDER)
          ? LocationManager.NETWORK_PROVIDER
          : LocationManager.GPS_PROVIDER;
      if (!locationManager.isProviderEnabled(provider)) {
        return null;
      }
    }
    return provider;
  }

  private static WritableMap locationToMap(Location location) {
    WritableMap map = Arguments.createMap();
    WritableMap coords = Arguments.createMap();
    coords.putDouble("latitude", location.getLatitude());
    coords.putDouble("longitude", location.getLongitude());
    coords.putDouble("altitude", location.getAltitude());
    coords.putDouble("accuracy", location.getAccuracy());
    coords.putDouble("heading", location.getBearing());
    coords.putDouble("speed", location.getSpeed());
    map.putMap("coords", coords);
    map.putDouble("timestamp", location.getTime());

    if (android.os.Build.VERSION.SDK_INT >= 18) {
      map.putBoolean("mocked", location.isFromMockProvider());
    }

    return map;
  }

  private void emitError(int code, String message) {
    getReactApplicationContext().getJSModule(RCTDeviceEventEmitter.class)
        .emit("geolocationError", PositionError.buildError(code, message));
  }

  /**
   * Provides a clearer exception message than the default one.
   */
  private static void throwLocationPermissionMissing(SecurityException e) {
    throw new SecurityException(
      "Looks like the app doesn't have the permission to access location.\n" +
      "Add the following line to your app's AndroidManifest.xml:\n" +
      "<uses-permission android:name=\"android.permission.ACCESS_FINE_LOCATION\" />", e);
  }

  private static class SingleUpdateRequest {

    private final Callback mSuccess;
    private final Callback mError;
    private final LocationManager mLocationManager;
    private final String mProvider;
    private final long mTimeout;
    private final Handler mHandler = new Handler();
    private final Runnable mTimeoutRunnable = new Runnable() {
      @Override
      public void run() {
        synchronized (SingleUpdateRequest.this) {
          if (!mTriggered) {
            mError.invoke(PositionError.buildError(PositionError.TIMEOUT, "Location request timed out"));
            mLocationManager.removeUpdates(mLocationListener);
            mTriggered = true;
          }
        }
      }
    };
    private final LocationListener mLocationListener = new LocationListener() {
      @Override
      public void onLocationChanged(Location location) {
        synchronized (SingleUpdateRequest.this) {
          if (!mTriggered) {
            mSuccess.invoke(locationToMap(location));
            mHandler.removeCallbacks(mTimeoutRunnable);
            mTriggered = true;
          }
        }
      }

      @Override
      public void onStatusChanged(String provider, int status, Bundle extras) {}

      @Override
      public void onProviderEnabled(String provider) {}

      @Override
      public void onProviderDisabled(String provider) {}
    };
    private boolean mTriggered;

    private SingleUpdateRequest(
        LocationManager locationManager,
        String provider,
        long timeout,
        Callback success,
        Callback error) {
      mLocationManager = locationManager;
      mProvider = provider;
      mTimeout = timeout;
      mSuccess = success;
      mError = error;
    }

    public void invoke() {
      mLocationManager.requestSingleUpdate(mProvider, mLocationListener, null);
      mHandler.postDelayed(mTimeoutRunnable, mTimeout);
    }
  }
}
