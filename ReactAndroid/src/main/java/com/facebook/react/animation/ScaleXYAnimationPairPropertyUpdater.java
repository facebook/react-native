/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.animation;

import android.view.View;

/**
 * Subclass of {@link AnimationPropertyUpdater} for animating view's X and Y scale
 */
public class ScaleXYAnimationPairPropertyUpdater extends AbstractFloatPairPropertyUpdater {

  public ScaleXYAnimationPairPropertyUpdater(float toFirst, float toSecond) {
    super(toFirst, toSecond);
  }

  public ScaleXYAnimationPairPropertyUpdater(
      float fromFirst,
      float fromSecond,
      float toFirst,
      float toSecond) {
    super(fromFirst, fromSecond, toFirst, toSecond);
  }

  @Override
  protected void getProperty(View view, float[] returnValues) {
    returnValues[0] = view.getScaleX();
    returnValues[1] = view.getScaleY();
  }

  @Override
  protected void setProperty(View view, float[] propertyValues) {
    view.setScaleX(propertyValues[0]);
    view.setScaleY(propertyValues[1]);
  }
}
