/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.yoga;

public interface YogaBaselineFunction {
  /**
   * Return the baseline of the node in points. When no baseline function is set the baseline
   * default to the computed height of the node.
   */
  float baseline(YogaNode node, float width, float height);
}
