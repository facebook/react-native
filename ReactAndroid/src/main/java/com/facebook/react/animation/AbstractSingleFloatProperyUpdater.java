/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.animation;

import android.view.View;

/**
 * Base class for {@link AnimationPropertyUpdater} subclasses that updates a single float property
 * value. It helps to handle conversion from animation progress to the actual value as well as the
 * quite common case when no starting value is provided.
 */
public abstract class AbstractSingleFloatProperyUpdater implements AnimationPropertyUpdater {

  private float mFromValue, mToValue;
  private boolean mFromSource;

  protected AbstractSingleFloatProperyUpdater(float toValue) {
    mToValue = toValue;
    mFromSource = true;
  }

  protected AbstractSingleFloatProperyUpdater(float fromValue, float toValue) {
    this(toValue);
    mFromValue = fromValue;
    mFromSource = false;
  }

  protected abstract float getProperty(View view);
  protected abstract void setProperty(View view, float propertyValue);

  @Override
  public final void prepare(View view) {
    if (mFromSource) {
      mFromValue = getProperty(view);
    }
  }

  @Override
  public final void onUpdate(View view, float progress) {
    setProperty(view, mFromValue + (mToValue - mFromValue) * progress);
  }

  @Override
  public void onFinish(View view) {
    setProperty(view, mToValue);
  }
}
