/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react;

import android.view.KeyEvent;
import android.view.View;

import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableNativeMap;
import com.facebook.react.common.MapBuilder;

import java.util.Map;

/**
 * Responsible for dispatching events specific for hardware inputs.
 */
public class ReactAndroidHWInputDeviceHelper {

  /**
   * Contains a mapping between handled KeyEvents and the corresponding navigation event
   * that should be fired when the KeyEvent is received.
   */
  private static final Map<Integer, String> KEY_EVENTS_ACTIONS = MapBuilder.of(
    KeyEvent.KEYCODE_DPAD_CENTER,
    "select",
    KeyEvent.KEYCODE_ENTER,
    "select",
    KeyEvent.KEYCODE_SPACE,
    "select",
    KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE,
    "playPause",
    KeyEvent.KEYCODE_MEDIA_REWIND,
    "rewind",
    KeyEvent.KEYCODE_MEDIA_FAST_FORWARD,
    "fastForward"
  );

  /**
   * We keep a reference to the last focused view id
   * so that we can send it as a target for key events
   * and be able to send a blur event when focus changes.
   */
  private int mLastFocusedViewId = View.NO_ID;

  private final ReactRootView mReactRootView;

  ReactAndroidHWInputDeviceHelper(ReactRootView mReactRootView) {
    this.mReactRootView = mReactRootView;
  }

  /**
   * Called from {@link ReactRootView}.
   * This is the main place the key events are handled.
   */
  public void handleKeyEvent(KeyEvent ev) {
    int eventKeyCode = ev.getKeyCode();
    int eventKeyAction = ev.getAction();
    if (eventKeyAction == KeyEvent.ACTION_UP && KEY_EVENTS_ACTIONS.containsKey(eventKeyCode)) {
      dispatchEvent(KEY_EVENTS_ACTIONS.get(eventKeyCode), mLastFocusedViewId);
    }
  }

  /**
   * Called from {@link ReactRootView} when focused view changes.
   */
  public void onFocusChanged(View newFocusedView) {
    if (mLastFocusedViewId == newFocusedView.getId()) {
      return;
    }
    if (mLastFocusedViewId != View.NO_ID) {
      dispatchEvent("blur", mLastFocusedViewId);
    }
    mLastFocusedViewId = newFocusedView.getId();
    dispatchEvent("focus", newFocusedView.getId());
  }

  /**
   * Called from {@link ReactRootView} when the whole view hierarchy looses focus.
   */
  public void clearFocus() {
    if (mLastFocusedViewId != View.NO_ID) {
      dispatchEvent("blur", mLastFocusedViewId);
    }
    mLastFocusedViewId = View.NO_ID;
  }

  private void dispatchEvent(String eventType, int targetViewId) {
    WritableMap event = new WritableNativeMap();
    event.putString("eventType", eventType);
    if (targetViewId != View.NO_ID) {
      event.putInt("tag", targetViewId);
    }
    mReactRootView.sendEvent("onHWKeyEvent", event);
  }
}
