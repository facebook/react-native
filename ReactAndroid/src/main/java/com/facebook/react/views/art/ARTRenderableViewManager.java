/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.views.art;

import android.view.View;

import com.facebook.react.uimanager.ReactStylesDiffMap;
import com.facebook.react.uimanager.ReactShadowNode;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.ViewManager;

/**
 * ViewManager for all shadowed ART views: Group, Shape and Text. Since these never get rendered
 * into native views and don't need any logic (all the logic is in {@link ARTSurfaceView}), this
 * "stubbed" ViewManager is used for all of them.
 */
public class ARTRenderableViewManager extends ViewManager<View, ReactShadowNode> {

  /* package */ static final String CLASS_GROUP = "ARTGroup";
  /* package */ static final String CLASS_SHAPE = "ARTShape";
  /* package */ static final String CLASS_TEXT = "ARTText";

  private final String mClassName;

  public static ARTRenderableViewManager createARTGroupViewManager() {
    return new ARTRenderableViewManager(CLASS_GROUP);
  }

  public static ARTRenderableViewManager createARTShapeViewManager() {
    return new ARTRenderableViewManager(CLASS_SHAPE);
  }

  public static ARTRenderableViewManager createARTTextViewManager() {
    return new ARTRenderableViewManager(CLASS_TEXT);
  }

  private ARTRenderableViewManager(String className) {
    mClassName = className;
  }

  @Override
  public String getName() {
    return mClassName;
  }

  @Override
  public ReactShadowNode createShadowNodeInstance() {
    if (mClassName == CLASS_GROUP) {
      return new ARTGroupShadowNode();
    } else if (mClassName == CLASS_SHAPE) {
      return new ARTShapeShadowNode();
    } else if (mClassName == CLASS_TEXT) {
      return new ARTTextShadowNode();
    } else {
      throw new IllegalStateException("Unexpected type " + mClassName);
    }
  }

  @Override
  public Class<? extends ReactShadowNode> getShadowNodeClass() {
    if (mClassName == CLASS_GROUP) {
      return ARTGroupShadowNode.class;
    } else if (mClassName == CLASS_SHAPE) {
      return ARTShapeShadowNode.class;
    } else if (mClassName == CLASS_TEXT) {
      return ARTTextShadowNode.class;
    } else {
      throw new IllegalStateException("Unexpected type " + mClassName);
    }
  }

  @Override
  protected View createViewInstance(ThemedReactContext reactContext) {
    throw new IllegalStateException("ARTShape does not map into a native view");
  }

  @Override
  public void updateExtraData(View root, Object extraData) {
    throw new IllegalStateException("ARTShape does not map into a native view");
  }
}
