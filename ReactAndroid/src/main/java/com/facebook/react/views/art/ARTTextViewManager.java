// Copyright 2004-present Facebook. All Rights Reserved.

package com.facebook.react.views.art;

import com.facebook.react.module.annotations.ReactModule;

/**
 * ViewManager for shadowed ART text views.
 */
@ReactModule(name = ARTRenderableViewManager.CLASS_TEXT)
public class ARTTextViewManager extends ARTRenderableViewManager {

  /* package */ ARTTextViewManager() {
    super(CLASS_TEXT);
  }
}
