// Copyright 2004-present Facebook. All Rights Reserved.

package com.facebook.react.views.art;

import com.facebook.react.module.annotations.ReactModule;

/**
 * ViewManager for shadowed ART group views.
 */
@ReactModule(name = ARTRenderableViewManager.CLASS_GROUP)
public class ARTGroupViewManager extends ARTRenderableViewManager {

  /* package */ ARTGroupViewManager() {
    super(CLASS_GROUP);
  }
}
