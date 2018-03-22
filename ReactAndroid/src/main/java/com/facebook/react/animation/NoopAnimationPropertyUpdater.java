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
