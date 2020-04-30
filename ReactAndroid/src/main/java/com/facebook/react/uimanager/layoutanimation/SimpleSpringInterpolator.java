/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager.layoutanimation;

import android.view.animation.Interpolator;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.ReadableType;

/** Simple spring interpolator */
// TODO(7613736): Improve spring interpolator with friction and damping variable support
/* package */ class SimpleSpringInterpolator implements Interpolator {

  private static final float FACTOR = 0.5f;
  public static final String PARAM_SPRING_DAMPING = "springDamping";
  private final float mSpringDamping;

  public static float getSpringDamping(ReadableMap params) {
    if (params.getType(PARAM_SPRING_DAMPING).equals(ReadableType.Number)) {
      return (float) params.getDouble(PARAM_SPRING_DAMPING);
    } else {
      return FACTOR;
    }
  }

  public SimpleSpringInterpolator() {
    mSpringDamping = FACTOR;
  }

  public SimpleSpringInterpolator(float springDamping) {
    mSpringDamping = springDamping;
  }

  @Override
  public float getInterpolation(float input) {
    // Using mSpringDamping in this equation is not really the exact mathematical springDamping, but
    // a good approximation
    // We need to replace this equation with the right Factor that accounts for damping and friction
    return (float)
        (1
            + Math.pow(2, -10 * input)
                * Math.sin((input - mSpringDamping / 4) * Math.PI * 2 / mSpringDamping));
  }
}
