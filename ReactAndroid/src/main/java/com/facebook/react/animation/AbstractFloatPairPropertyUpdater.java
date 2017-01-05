/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.animation;

import android.view.View;

/**
 * Base class for {@link AnimationPropertyUpdater} subclasses that updates a pair of float property
 * values. It helps to handle convertion from animation progress to the actual values as
 * well as the quite common case when no starting value is provided.
 */
public abstract class AbstractFloatPairPropertyUpdater implements AnimationPropertyUpdater {

  private final float[] mFromValues = new float[2];
  private final float[] mToValues = new float[2];
  private final float[] mUpdateValues = new float[2];
  private boolean mFromSource;

  protected AbstractFloatPairPropertyUpdater(float toFirst, float toSecond) {
    mToValues[0] = toFirst;
    mToValues[1] = toSecond;
    mFromSource = true;
  }

  protected AbstractFloatPairPropertyUpdater(
      float fromFirst,
      float fromSecond,
      float toFirst,
      float toSecond) {
    this(toFirst, toSecond);
    mFromValues[0] = fromFirst;
    mFromValues[1] = fromSecond;
    mFromSource = false;
  }

  protected abstract void getProperty(View view, float[] returnValues);
  protected abstract void setProperty(View view, float[] propertyValues);

  @Override
  public void prepare(View view) {
    if (mFromSource) {
      getProperty(view, mFromValues);
    }
  }

  @Override
  public void onUpdate(View view, float progress) {
    mUpdateValues[0] = mFromValues[0] + (mToValues[0] - mFromValues[0]) * progress;
    mUpdateValues[1] = mFromValues[1] + (mToValues[1] - mFromValues[1]) * progress;
    setProperty(view, mUpdateValues);
  }

  @Override
  public void onFinish(View view) {
    setProperty(view, mToValues);
  }
}
