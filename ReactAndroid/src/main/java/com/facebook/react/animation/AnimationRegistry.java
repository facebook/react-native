/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.animation;

import android.util.SparseArray;

import com.facebook.react.bridge.UiThreadUtil;

/**
 * Coordinates catalyst animations driven by {@link UIManagerModule} and
 * {@link AnimationManagerModule}
 */
public class AnimationRegistry {

  private final SparseArray<Animation> mRegistry = new SparseArray<Animation>();

  public void registerAnimation(Animation animation) {
    UiThreadUtil.assertOnUiThread();
    mRegistry.put(animation.getAnimationID(), animation);
  }

  public Animation getAnimation(int animationID) {
    UiThreadUtil.assertOnUiThread();
    return mRegistry.get(animationID);
  }

  public Animation removeAnimation(int animationID) {
    UiThreadUtil.assertOnUiThread();
    Animation animation = mRegistry.get(animationID);
    if (animation != null) {
      mRegistry.delete(animationID);
    }
    return animation;
  }

}
