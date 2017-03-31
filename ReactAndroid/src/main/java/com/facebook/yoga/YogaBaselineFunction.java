/**
 * Copyright (c) 2014-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
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
  float baseline(YogaNodeAPI node, float width, float height);
}
