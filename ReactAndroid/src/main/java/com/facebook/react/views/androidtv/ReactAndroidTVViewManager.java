package com.facebook.react.views.androidtv;

import android.content.Context;
import android.os.Bundle;
import android.view.KeyEvent;
import android.view.View;
import android.view.ViewGroup;

import com.facebook.react.ReactInstanceManager;
import com.facebook.react.ReactRootView;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableNativeMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;

import java.util.Arrays;
import java.util.List;

import javax.annotation.Nullable;

public class ReactAndroidTVViewManager extends ReactRootView {

  private static final List<Integer> PRESS_KEY_EVENTS = Arrays.asList(
    KeyEvent.KEYCODE_DPAD_CENTER,
    KeyEvent.KEYCODE_ENTER,
    KeyEvent.KEYCODE_SPACE
  );

  private static final List<Integer> NAVIGATION_KEY_EVENTS = Arrays.asList(
    KeyEvent.KEYCODE_DPAD_DOWN,
    KeyEvent.KEYCODE_DPAD_LEFT,
    KeyEvent.KEYCODE_DPAD_UP,
    KeyEvent.KEYCODE_DPAD_RIGHT
  );

  private
  @Nullable ReactInstanceManager mReactInstanceManager;

  private View mLastFocusedView = null;

  public ReactAndroidTVViewManager(Context context) {
    super(context);
  }

  @Override
  public boolean dispatchKeyEvent(KeyEvent ev) {
    int eventKeyCode = ev.getKeyCode();
    int eventKeyAction = ev.getAction();
    View targetView = getFocusedView(this);
    if (targetView != null) {
      if (KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE == eventKeyCode && eventKeyAction == KeyEvent.ACTION_UP) {
        handlePlayPauseEvent();
      } else if (PRESS_KEY_EVENTS.contains(eventKeyCode) && eventKeyAction == KeyEvent.ACTION_UP) {
        handleSelectEvent(targetView);
      } else if (NAVIGATION_KEY_EVENTS.contains(eventKeyCode)) {
        handleFocusChangeEvent(targetView);
      }
    }
    return super.dispatchKeyEvent(ev);
  }

  private void handlePlayPauseEvent() {
    dispatchEvent("playPause");
  }

  private void handleSelectEvent(View targetView) {
    dispatchEvent("select", targetView);
  }

  private void handleFocusChangeEvent(View targetView) {
    if (mLastFocusedView == targetView) {
      return;
    }
    if (mLastFocusedView != null) {
      dispatchEvent("blur", mLastFocusedView);
    }
    mLastFocusedView = targetView;
    dispatchEvent("focus", targetView);
  }

  private void dispatchEvent(String eventType) {
    dispatchEvent(eventType, null);
  }

  private void dispatchEvent(String eventType, View targetView) {
    WritableMap event = new WritableNativeMap();
    event.putString("eventType", eventType);
    if (targetView != null) {
      event.putInt("tag", targetView.getId());
    }
    getEmitter().emit("onTVNavEvent", event);
  }

  private DeviceEventManagerModule.RCTDeviceEventEmitter getEmitter() {
    return mReactInstanceManager
      .getCurrentReactContext()
      .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class);
  }

  private View getFocusedView(ViewGroup viewGroup) {
    int childrenCount = viewGroup.getChildCount();
    for (int i = childrenCount - 1; i >= 0; i--) {
      View view = viewGroup.getChildAt(i);
      if (view.isFocused()) {
        return view;
      }
      if (view instanceof ViewGroup) {
        View nestedView = getFocusedView((ViewGroup) view);
        if (nestedView != null) {
          return nestedView;
        }
      }
    }
    return null;
  }

  @Override
  public void startReactApplication(
    ReactInstanceManager reactInstanceManager,
    String moduleName,
    @Nullable Bundle initialProperties
  ) {
    super.startReactApplication(reactInstanceManager, moduleName, initialProperties);
    mReactInstanceManager = reactInstanceManager;
  }

  @Override
  public void unmountReactApplication() {
    mReactInstanceManager = null;
    super.unmountReactApplication();
  }

}
