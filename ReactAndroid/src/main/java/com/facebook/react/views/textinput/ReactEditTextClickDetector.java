package com.facebook.react.views.textinput;

import android.os.Build;
import android.view.MotionEvent;
import android.view.View;

import androidx.annotation.Nullable;

class ReactEditTextClickDetector {

  private static final long MAX_CLICK_DURATION_MS = 250L;
  private static final int MAX_CLICK_DISTANCE_DP = 12;

  private final ReactEditText reactEditText;
  private final float screenDensity;

  @Nullable
  private TimestampedMotionEvent currentDownEvent;

  public ReactEditTextClickDetector(final ReactEditText reactEditText) {
    this.reactEditText = reactEditText;
    screenDensity = reactEditText.getResources().getDisplayMetrics().density;
  }

  void handleDown(final MotionEvent downEvent) {
    currentDownEvent = new TimestampedMotionEvent(downEvent);
  }

  void cancelPress() {
    currentDownEvent = null;
  }

  void handleUp(final MotionEvent upEvent) {
    if (currentDownEvent == null) {
      return;
    }

    final TimestampedMotionEvent downEvent = currentDownEvent;
    currentDownEvent = null;

    // for now, if we're not forcing showing the keyboard on clicks, we don't care if it was a
    // click. we also early return if the view is not enabled.
    if (!(forceShowKeyboardOnClicks() && reactEditText.isEnabled())) {
      return;
    }

    // make sure the press event was close enough in time
    final long now = System.currentTimeMillis();
    final long timeDelta = now - downEvent.timestamp;
    if (timeDelta > MAX_CLICK_DURATION_MS) {
      return;
    }

    // make sure the press event was close enough in distance
    final float oldX = downEvent.motionEvent.getRawX();
    final float oldY = downEvent.motionEvent.getRawY();
    final float newX = upEvent.getRawX();
    final float newY = upEvent.getRawY();

    // distance = sqrt((x2 − x1)^2 + (y2 − y1)^2)
    final double distancePx = Math.sqrt(
      Math.pow((newX - oldX), 2) + Math.pow((newY - oldY), 2)
    );

    double distanceDp = distancePx / screenDensity;
    if (distanceDp > MAX_CLICK_DISTANCE_DP) {
      return;
    }

    reactEditText.showSoftKeyboard();
  }

  /**
   * There is a bug on Android 7/8/9 where clicking the view while it is already
   * focused does not show the keyboard. On those API levels, we force showing
   * the keyboard when we detect a click.
   */
  private static boolean forceShowKeyboardOnClicks() {
    return Build.VERSION.SDK_INT <= Build.VERSION_CODES.P;
  }

  private static class TimestampedMotionEvent {

    final long timestamp;
    final MotionEvent motionEvent;

    TimestampedMotionEvent(final long timestamp, final MotionEvent motionEvent) {
      this.timestamp = timestamp;
      this.motionEvent = motionEvent;
    }
  }
}
