// Copyright 2004-present Facebook. All Rights Reserved.

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
