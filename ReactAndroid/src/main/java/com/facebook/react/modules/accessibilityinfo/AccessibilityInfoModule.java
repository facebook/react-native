// Copyright 2004-present Facebook. All Rights Reserved.

package com.facebook.react.modules.accessibilityinfo;

import javax.annotation.Nullable;

import android.annotation.TargetApi;
import android.content.Context;
import android.os.Build;
import android.view.accessibility.AccessibilityManager;

import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.LifecycleEventListener;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.module.annotations.ReactModule;
import com.facebook.react.modules.core.DeviceEventManagerModule;

/**
 * Module that monitors and provides information about the state of Touch Exploration service
 * on the device. For API >= 19.
 */
@ReactModule(name = "AccessibilityInfo")
public class AccessibilityInfoModule extends ReactContextBaseJavaModule
        implements LifecycleEventListener {

    @TargetApi(19)
    private class ReactTouchExplorationStateChangeListener
            implements AccessibilityManager.TouchExplorationStateChangeListener {

        @Override
        public void onTouchExplorationStateChanged(boolean enabled) {
            updateAndSendChangeEvent(enabled);
        }
    }

    private @Nullable AccessibilityManager mAccessibilityManager;
    private @Nullable ReactTouchExplorationStateChangeListener mTouchExplorationStateChangeListener;
    private boolean mEnabled = false;

    private static final String EVENT_NAME = "touchExplorationDidChange";

    public AccessibilityInfoModule(ReactApplicationContext context) {
        super(context);
        Context appContext = context.getApplicationContext();
        mAccessibilityManager = (AccessibilityManager) appContext.getSystemService(Context.ACCESSIBILITY_SERVICE);
        mEnabled = mAccessibilityManager.isTouchExplorationEnabled();
        if (Build.VERSION.SDK_INT >= 19) {
            mTouchExplorationStateChangeListener = new ReactTouchExplorationStateChangeListener();
        }
    }

    @Override
    public String getName() {
        return "AccessibilityInfo";
    }

    @ReactMethod
    public void isTouchExplorationEnabled(Callback successCallback) {
        successCallback.invoke(mEnabled);
    }

    private void updateAndSendChangeEvent(boolean enabled) {
        if (mEnabled != enabled) {
            mEnabled = enabled;
            getReactApplicationContext().getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                    .emit(EVENT_NAME, mEnabled);
        }
    }

    @Override
    public void onHostResume() {
        if (Build.VERSION.SDK_INT >= 19) {
            mAccessibilityManager.addTouchExplorationStateChangeListener(
                    mTouchExplorationStateChangeListener);
        }
        updateAndSendChangeEvent(mAccessibilityManager.isTouchExplorationEnabled());
    }

    @Override
    public void onHostPause() {
        if (Build.VERSION.SDK_INT >= 19) {
            mAccessibilityManager.removeTouchExplorationStateChangeListener(
                    mTouchExplorationStateChangeListener);
        }
    }

    @Override
    public void initialize() {
        getReactApplicationContext().addLifecycleEventListener(this);
        updateAndSendChangeEvent(mAccessibilityManager.isTouchExplorationEnabled());
    }

    @Override
    public void onCatalystInstanceDestroy() {
        super.onCatalystInstanceDestroy();
        getReactApplicationContext().removeLifecycleEventListener(this);
    }

    @Override
    public void onHostDestroy() {
    }
}
