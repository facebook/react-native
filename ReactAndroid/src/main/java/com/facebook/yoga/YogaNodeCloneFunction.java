/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the LICENSE
 * file in the root directory of this source tree.
 */
package com.facebook.yoga;

import com.facebook.proguard.annotations.DoNotStrip;

@DoNotStrip
public interface YogaNodeCloneFunction {

  @DoNotStrip
  YogaNode cloneNode(YogaNode oldNode, YogaNode parent, int childIndex);
}
