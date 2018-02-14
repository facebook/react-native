/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.flat;

import javax.annotation.Nullable;

import android.content.res.Resources;
import android.graphics.drawable.Drawable;

import com.facebook.drawee.controller.AbstractDraweeControllerBuilder;
import com.facebook.drawee.controller.ControllerListener;
import com.facebook.drawee.generic.GenericDraweeHierarchy;
import com.facebook.drawee.generic.GenericDraweeHierarchyBuilder;
import com.facebook.drawee.interfaces.DraweeController;
import com.facebook.imagepipeline.request.ImageRequest;
import com.facebook.infer.annotation.Assertions;

/* package */ final class DraweeRequestHelper {

  private static GenericDraweeHierarchyBuilder sHierarchyBuilder;
  private static AbstractDraweeControllerBuilder sControllerBuilder;

  /* package */ static void setResources(Resources resources) {
    sHierarchyBuilder = new GenericDraweeHierarchyBuilder(resources);
  }

  /* package */ static void setDraweeControllerBuilder(AbstractDraweeControllerBuilder builder) {
    sControllerBuilder = builder;
  }

  private final DraweeController mDraweeController;
  private int mAttachCounter;

  /* package */ DraweeRequestHelper(
      ImageRequest imageRequest,
      @Nullable ImageRequest cachedImageRequest,
      ControllerListener listener) {
    AbstractDraweeControllerBuilder controllerBuilder = sControllerBuilder
        .setImageRequest(imageRequest)
        .setCallerContext(RCTImageView.getCallerContext())
        .setControllerListener(listener);

    if (cachedImageRequest != null) {
      controllerBuilder.setLowResImageRequest(cachedImageRequest);
    }
    DraweeController controller = controllerBuilder.build();

    controller.setHierarchy(sHierarchyBuilder.build());

    mDraweeController = controller;
  }

  /* package */ void attach(FlatViewGroup.InvalidateCallback callback) {
    ++mAttachCounter;
    if (mAttachCounter == 1) {
      getDrawable().setCallback(callback.get());
      mDraweeController.onAttach();
    }
  }

  /* package */ void detach() {
    --mAttachCounter;
    if (mAttachCounter == 0) {
      mDraweeController.onDetach();
    }
  }

  /* package */ GenericDraweeHierarchy getHierarchy() {
    return (GenericDraweeHierarchy) Assertions.assumeNotNull(mDraweeController.getHierarchy());
  }

  /* package */ Drawable getDrawable() {
    return getHierarchy().getTopLevelDrawable();
  }
}
