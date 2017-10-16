package com.facebook.react.views.androidtv;

import android.view.KeyEvent;
import android.view.View;
import android.view.ViewGroup;

import com.facebook.react.ReactRootView;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableNativeMap;
import com.facebook.react.modules.core.DeviceEventManagerModule.RCTDeviceEventEmitter;

import java.util.Arrays;
import java.util.List;

public class ReactAndroidTVRootViewHelper {

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

  private View mLastFocusedView = null;

  private ReactRootView mReactRootView;

  public ReactAndroidTVRootViewHelper(ReactRootView mReactRootView) {
    this.mReactRootView = mReactRootView;
  }

  public void handleKeyEvent(KeyEvent ev, RCTDeviceEventEmitter emitter) {
    int eventKeyCode = ev.getKeyCode();
    int eventKeyAction = ev.getAction();
    View targetView = getFocusedView(mReactRootView);
    if (targetView != null) {
      if (KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE == eventKeyCode && eventKeyAction == KeyEvent.ACTION_UP) {
        handlePlayPauseEvent(emitter);
      } else if (PRESS_KEY_EVENTS.contains(eventKeyCode) && eventKeyAction == KeyEvent.ACTION_UP) {
        handleSelectEvent(targetView, emitter);
      } else if (NAVIGATION_KEY_EVENTS.contains(eventKeyCode)) {
        handleFocusChangeEvent(targetView, emitter);
      }
    }
  }

  private void handlePlayPauseEvent(RCTDeviceEventEmitter emitter) {
    dispatchEvent("playPause", emitter);
  }

  private void handleSelectEvent(View targetView, RCTDeviceEventEmitter emitter) {
    dispatchEvent("select", targetView, emitter);
  }

  private void handleFocusChangeEvent(View targetView, RCTDeviceEventEmitter emitter) {
    if (mLastFocusedView == targetView) {
      return;
    }
    if (mLastFocusedView != null) {
      dispatchEvent("blur", mLastFocusedView, emitter);
    }
    mLastFocusedView = targetView;
    dispatchEvent("focus", targetView, emitter);
  }

  private void dispatchEvent(String eventType, RCTDeviceEventEmitter emitter) {
    dispatchEvent(eventType, null, emitter);
  }

  private void dispatchEvent(String eventType, View targetView, RCTDeviceEventEmitter emitter) {
    WritableMap event = new WritableNativeMap();
    event.putString("eventType", eventType);
    if (targetView != null) {
      event.putInt("tag", targetView.getId());
    }
    emitter.emit("onTVNavEvent", event);
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
}
