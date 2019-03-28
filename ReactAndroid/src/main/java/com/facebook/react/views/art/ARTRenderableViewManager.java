/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.art;

import android.view.View;

import com.facebook.react.uimanager.ReactShadowNode;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.ViewManager;

/**
 * ViewManager for all shadowed ART views: Group, Shape and Text. Since these never get rendered
 * into native views and don't need any logic (all the logic is in {@link ARTSurfaceView}), this
 * "stubbed" ViewManager is used for all of them.
 */
public class ARTRenderableViewManager extends ViewManager<View, ReactShadowNode> {

  public static final String CLASS_GROUP = "ARTGroup";
  public static final String CLASS_SHAPE = "ARTShape";
  public static final String CLASS_TEXT = "ARTText";

  private final String mClassName;

  public static ARTRenderableViewManager createARTGroupViewManager() {
    return new ARTGroupViewManager();
  }

  public static ARTRenderableViewManager createARTShapeViewManager() {
    return new ARTShapeViewManager();
  }

  public static ARTRenderableViewManager createARTTextViewManager() {
    return new ARTTextViewManager();
  }

  /* package */ ARTRenderableViewManager(String className) {
    mClassName = className;
  }

  @Override
  public String getName() {
    return mClassName;
  }

  @Override
  public ReactShadowNode createShadowNodeInstance() {
    if (CLASS_GROUP.equals(mClassName)) {
      return new ARTGroupShadowNode();
    } else if (CLASS_SHAPE.equals(mClassName)) {
      return new ARTShapeShadowNode();
    } else if (CLASS_TEXT.equals(mClassName)) {
      return new ARTTextShadowNode();
    } else {
      throw new IllegalStateException("Unexpected type " + mClassName);
    }
  }

  @Override
  public Class<? extends ReactShadowNode> getShadowNodeClass() {
    if (CLASS_GROUP.equals(mClassName)) {
      return ARTGroupShadowNode.class;
    } else if (CLASS_SHAPE.equals(mClassName)) {
      return ARTShapeShadowNode.class;
    } else if (CLASS_TEXT.equals(mClassName)) {
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
