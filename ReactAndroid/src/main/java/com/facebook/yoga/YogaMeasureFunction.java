/*
 *  Copyright (c) 2014-present, Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */
package com.facebook.yoga;

import com.facebook.proguard.annotations.DoNotStrip;

@DoNotStrip
public interface YogaMeasureFunction {
  /**
   * Return a value created by YogaMeasureOutput.make(width, height);
   */
  @DoNotStrip
  long measure(
      YogaNode node,
      float width,
      YogaMeasureMode widthMode,
      float height,
      YogaMeasureMode heightMode);
}
