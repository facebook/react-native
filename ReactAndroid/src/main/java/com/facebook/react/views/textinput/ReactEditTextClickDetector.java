package com.facebook.react.views.textinput;

import android.view.MotionEvent;
import android.view.View;

import androidx.annotation.Nullable;

class ReactEditTextClickDetector {

  private static final long MAX_CLICK_DURATION_MS = 250L;
  private static final int MAX_CLICK_DISTANCE_DP = 12;

  private final float screenDensity;

  @Nullable
  private TimestampedMotionEvent currentDownEvent;

  public ReactEditTextClickDetector(final View view) {
    screenDensity = view.getResources().getDisplayMetrics().density;
  }

  void handleDown(final MotionEvent downEvent) {
    currentDownEvent = new TimestampedMotionEvent(System.currentTimeMillis(), downEvent);
  }

  void cancelPress() {
    currentDownEvent = null;
  }

  /**
   * @return true if the event was a click.
   */
  boolean handleUp(final MotionEvent upEvent) {
    if (currentDownEvent == null) {
      return false;
    }

    final TimestampedMotionEvent downEvent = currentDownEvent;
    currentDownEvent = null;

    // make sure the press event was close enough in time
    final long now = System.currentTimeMillis();
    final long timeDelta = now - downEvent.timestamp;
    if (timeDelta > MAX_CLICK_DURATION_MS) {
      return false;
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
    return distanceDp <= MAX_CLICK_DISTANCE_DP;
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
