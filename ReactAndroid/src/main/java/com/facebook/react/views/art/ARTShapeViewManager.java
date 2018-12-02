// Copyright (c) Facebook, Inc. and its affiliates.

// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

package com.facebook.react.views.art;

import com.facebook.react.module.annotations.ReactModule;

/**
 * ViewManager for shadowed ART shape views.
 */
@ReactModule(name = ARTRenderableViewManager.CLASS_SHAPE)
public class ARTShapeViewManager extends ARTRenderableViewManager {

  /* package */ ARTShapeViewManager() {
    super(CLASS_SHAPE);
  }
}
