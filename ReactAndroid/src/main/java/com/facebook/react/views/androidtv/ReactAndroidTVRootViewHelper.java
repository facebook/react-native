/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

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

/**
 * Responsible for dispatching events specific for Android TV to support D-PAD navigation/selection.
 * This is similar to AppleTV implementation and uses the same emitter events.
 */
public class ReactAndroidTVRootViewHelper {

  /**
   * Android TV remote control sends a DPAD_CENTER event when clicking on a focused item.
   * We add ENTER and SPACE to facilitate navigating on Android TV emulator.
   */
  private static final List<Integer> PRESS_KEY_EVENTS = Arrays.asList(
    KeyEvent.KEYCODE_DPAD_CENTER,
    KeyEvent.KEYCODE_ENTER,
    KeyEvent.KEYCODE_SPACE
  );

  /**
   * We keep reference to the last focused view id so that we can send a blur event when focus changes.
   */
  private int mLastFocusedViewId = View.NO_ID;

  private ReactRootView mReactRootView;

  public ReactAndroidTVRootViewHelper(ReactRootView reactRootView) {
    mReactRootView = reactRootView;
  }

  /**
   * Called from {@link ReactRootView}.
   * This is the main place the Android TV remote key events are handled.
   */
  public void handleKeyEvent(KeyEvent ev, RCTDeviceEventEmitter emitter) {
    int eventKeyCode = ev.getKeyCode();
    int eventKeyAction = ev.getAction();
    View targetView = findFocusedView(mReactRootView);
    if (targetView != null) {
      if (KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE == eventKeyCode && eventKeyAction == KeyEvent.ACTION_UP) {
        dispatchEvent("playPause", emitter);
      } else if (PRESS_KEY_EVENTS.contains(eventKeyCode) && eventKeyAction == KeyEvent.ACTION_UP) {
        dispatchEvent("select", targetView.getId(), emitter);
      }
    }
  }

  /**
   * Called from {@link ReactRootView} when focused view changes.
   */
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

  /**
   * Called from {@link ReactRootView} when the whole view hierarchy looses focus.
   */
  public void clearFocus(RCTDeviceEventEmitter emitter) {
    if (mLastFocusedViewId != View.NO_ID) {
      dispatchEvent("blur", mLastFocusedViewId, emitter);
    }
    mLastFocusedViewId = View.NO_ID;
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
