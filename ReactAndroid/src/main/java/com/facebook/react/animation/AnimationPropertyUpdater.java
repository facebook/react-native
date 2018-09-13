/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.animation;

import android.view.View;

/**
 * Interface used to update particular property types during animation. While animation is in
 * progress {@link Animation} instance will call {@link #onUpdate} several times with a value
 * representing animation progress. Normally value will be from 0..1 range, but for spring animation
 * it can slightly exceed that limit due to bounce effect at the start/end of animation.
 */
public interface AnimationPropertyUpdater {

  /**
   * This method will be called before animation starts.
   *
   * @param view view that will be animated
   */
  public void prepare(View view);

  /**
   * This method will be called for each animation frame
   *
   * @param view view to update property
   * @param progress animation progress from 0..1 range (may slightly exceed that limit in case of
   * spring engine) retrieved from {@link Animation} engine.
   */
  public void onUpdate(View view, float progress);

  /**
   * This method will be called at the end of animation. It should be used to set the final values
   * for animated properties in order to avoid floating point inaccuracy calculated in
   * {@link #onUpdate} by passing value close to 1.0 or in a case some frames got dropped.
   *
   * @param view view to update property
   */
  public void onFinish(View view);
}
