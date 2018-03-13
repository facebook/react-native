/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.animation;

import android.view.View;

/**
 * Empty {@link AnimationPropertyUpdater} that can be used as a stub for unsupported property types
 */
public class NoopAnimationPropertyUpdater implements AnimationPropertyUpdater {

  @Override
  public void prepare(View view) {
  }

  @Override
  public void onUpdate(View view, float value) {
  }

  @Override
  public void onFinish(View view) {
  }
}
