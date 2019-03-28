/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.animation;

import android.view.View;

/**
 * Subclass of {@link AnimationPropertyUpdater} for animating center position of a view
 */
public class PositionAnimationPairPropertyUpdater extends AbstractFloatPairPropertyUpdater {

  public PositionAnimationPairPropertyUpdater(float toFirst, float toSecond) {
    super(toFirst, toSecond);
  }

  public PositionAnimationPairPropertyUpdater(
      float fromFirst,
      float fromSecond,
      float toFirst,
      float toSecond) {
    super(fromFirst, fromSecond, toFirst, toSecond);
  }

  @Override
  protected void getProperty(View view, float[] returnValues) {
    returnValues[0] = view.getX() + 0.5f * view.getWidth();
    returnValues[1] = view.getY() + 0.5f * view.getHeight();
  }

  @Override
  protected void setProperty(View view, float[] propertyValues) {
    view.setX(propertyValues[0] - 0.5f * view.getWidth());
    view.setY(propertyValues[1] - 0.5f * view.getHeight());
  }
}
