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
public interface YogaBaselineFunction {
  /**
   * Return the baseline of the node in points. When no baseline function is set the baseline
   * default to the computed height of the node.
   */
  @DoNotStrip
  float baseline(YogaNode node, float width, float height);
}
