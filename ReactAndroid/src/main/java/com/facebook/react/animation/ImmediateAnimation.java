/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.animation;

/**
 * Ignores duration and immediately jump to the end of animation. This is a temporal solution for
 * the lack of real animation engines implemented.
 */
public class ImmediateAnimation extends Animation {

  public ImmediateAnimation(int animationID, AnimationPropertyUpdater propertyUpdater) {
    super(animationID, propertyUpdater);
  }

  @Override
  public void run() {
    onUpdate(1.0f);
    finish();
  }

}
