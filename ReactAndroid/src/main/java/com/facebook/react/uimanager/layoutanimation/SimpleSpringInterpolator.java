// Copyright 2004-present Facebook. All Rights Reserved.

package com.facebook.react.uimanager.layoutanimation;

import android.view.animation.Interpolator;

/**
 * Simple spring interpolator
 */
//TODO(7613736): Improve spring interpolator with friction and damping variable support
/* package */  class SimpleSpringInterpolator implements Interpolator {

  private static final float FACTOR = 0.5f;

  @Override
  public float getInterpolation(float input) {
    return (float)
        (1 + Math.pow(2, -10 * input) * Math.sin((input - FACTOR / 4) * Math.PI * 2 / FACTOR));
  }
}
