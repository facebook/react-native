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

  private int mLastFocusedViewId = View.NO_ID;

  private ReactRootView mReactRootView;

  public ReactAndroidTVRootViewHelper(ReactRootView reactRootView) {
    mReactRootView = reactRootView;
  }

  public void handleKeyEvent(KeyEvent ev, RCTDeviceEventEmitter emitter) {
    int eventKeyCode = ev.getKeyCode();
    int eventKeyAction = ev.getAction();
    View targetView = findFocusedView(mReactRootView);
    if (targetView != null) {
      if (KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE == eventKeyCode && eventKeyAction == KeyEvent.ACTION_UP) {
        handlePlayPauseEvent(emitter);
      } else if (PRESS_KEY_EVENTS.contains(eventKeyCode) && eventKeyAction == KeyEvent.ACTION_UP) {
        handleSelectEvent(targetView, emitter);
      }
    }
  }

  public void onFocusChanged(View newFocusedView, RCTDeviceEventEmitter emitter) {
    if (mLastFocusedViewId == newFocusedView.getId()) {
      return;
    }
    if (mLastFocusedViewId != View.NO_ID) {
      dispatchEvent("blur", mLastFocusedViewId, emitter);
    }
    mLastFocusedViewId = newFocusedView.getId();
    dispatchEvent("focus", newFocusedView.getId(), emitter);
  }

  public void clearFocus(RCTDeviceEventEmitter emitter) {
    if (mLastFocusedViewId != View.NO_ID) {
      dispatchEvent("blur", mLastFocusedViewId, emitter);
    }
    mLastFocusedViewId = View.NO_ID;
  }

  private void handlePlayPauseEvent(RCTDeviceEventEmitter emitter) {
    dispatchEvent("playPause", emitter);
  }

  private void handleSelectEvent(View targetView, RCTDeviceEventEmitter emitter) {
    dispatchEvent("select", targetView.getId(), emitter);
  }

  private void dispatchEvent(String eventType, RCTDeviceEventEmitter emitter) {
    dispatchEvent(eventType, View.NO_ID, emitter);
  }

  private void dispatchEvent(String eventType, int targetViewId, RCTDeviceEventEmitter emitter) {
    WritableMap event = new WritableNativeMap();
    event.putString("eventType", eventType);
    if (targetViewId != View.NO_ID) {
      event.putInt("tag", targetViewId);
    }
    emitter.emit("onTVNavEvent", event);
  }

  private View findFocusedView(ViewGroup viewGroup) {
    int childrenCount = viewGroup.getChildCount();
    for (int i = childrenCount - 1; i >= 0; i--) {
      View view = viewGroup.getChildAt(i);
      if (view.isFocused()) {
        return view;
      }
      if (view instanceof ViewGroup) {
        View nestedView = findFocusedView((ViewGroup) view);
        if (nestedView != null) {
          return nestedView;
        }
      }
    }
    return null;
  }
}
