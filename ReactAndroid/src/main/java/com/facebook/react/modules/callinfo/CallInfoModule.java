/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.modules.callinfo;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
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
 * Module that monitors and provides information about the call state of the device.
 */
@ReactModule(name = "CallInfo")
public class CallInfoModule extends ReactContextBaseJavaModule
    implements LifecycleEventListener {

  private static final String MISSING_PERMISSION_MESSAGE =
      "To use CallInfo on Android, add the following to your AndroidManifest.xml:\n" +
      "<uses-permission android:name=\"android.permission.READ_PHONE_STATE\" />";

  private static final String ERROR_MISSING_PERMISSION = "E_MISSING_PERMISSION";

  private static final String ACTION_PHONE_STATE = "android.intent.action.PHONE_STATE";

  private static final String PHONE_STATE_UNKNOWN = "unknown";
  private static final String PHONE_STATE_RINGING = "ringing";
  private static final String PHONE_STATE_OFFHOOK = "offhook";
  private static final String PHONE_STATE_IDLE = "idle";

  private final CallBroadcastReceiver mCallBroadcastReceiver;
  private boolean mNoCallInfoPermission = false;

  private String mPhoneState = PHONE_STATE_UNKNOWN;

  public CallInfoModule(ReactApplicationContext reactContext) {
    super(reactContext);
    mCallBroadcastReceiver = new CallBroadcastReceiver();
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
    return "CallInfo";
  }

  @ReactMethod
  public void getCurrentState(Promise promise) {
    if (mNoCallInfoPermission) {
      promise.reject(ERROR_MISSING_PERMISSION, MISSING_PERMISSION_MESSAGE, null);
      return;
    }
    promise.resolve(createCallInfoEventMap());
  }

  private void registerReceiver() {
    IntentFilter filter = new IntentFilter();
    filter.addAction(ACTION_PHONE_STATE);
    getReactApplicationContext().registerReceiver(mCallBroadcastReceiver, filter);
    mCallBroadcastReceiver.setRegistered(true);
  }

  private void unregisterReceiver() {
    if (mCallBroadcastReceiver.isRegistered()) {
      getReactApplicationContext().unregisterReceiver(mCallBroadcastReceiver);
      mCallBroadcastReceiver.setRegistered(false);
    }
  }

  private void sendCallStateChangedEvent() {
    getReactApplicationContext().getJSModule(RCTDeviceEventEmitter.class)
        .emit("callStateDidChange", createCallInfoEventMap());
  }

  private WritableMap createCallInfoEventMap() {
    WritableMap event = new WritableNativeMap();
    event.putString("phone_state", mPhoneState);
    return event;
  }

  /**
   * Class that receives intents whenever the call state changes.
   */
  private class CallBroadcastReceiver extends BroadcastReceiver {
    private boolean isRegistered = false;

    public void setRegistered(boolean registered) {
      isRegistered = registered;
    }

    public boolean isRegistered() {
      return isRegistered;
    }

    @Override
    public void onReceive(Context context, Intent intent) {
      String phoneState = intent.getStringExtra("state");

      if (phoneState.equals(TelephonyManager.EXTRA_STATE_RINGING)) {
        mPhoneState = PHONE_STATE_RINGING;
      } else if (phoneState.equals(TelephonyManager.EXTRA_STATE_OFFHOOK)) {
        mPhoneState = PHONE_STATE_OFFHOOK;
      } else if (phoneState.equals(TelephonyManager.EXTRA_STATE_IDLE)) {
        mPhoneState = PHONE_STATE_IDLE;
      }

      sendCallStateChangedEvent();
    }
  }
}
