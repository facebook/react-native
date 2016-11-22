/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.views.text.frescosupport;

import javax.annotation.Nullable;

import java.util.Locale;

import android.content.Context;
import android.content.res.Resources;
import android.net.Uri;

import com.facebook.common.util.UriUtil;
import com.facebook.drawee.controller.AbstractDraweeControllerBuilder;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.uimanager.annotations.ReactProp;
import com.facebook.react.views.text.ReactTextInlineImageShadowNode;
import com.facebook.react.views.text.TextInlineImageSpan;

/**
 * Shadow node that represents an inline image. Loading is done using Fresco.
 *
 */
public class FrescoBasedReactTextInlineImageShadowNode extends ReactTextInlineImageShadowNode {

  private @Nullable Uri mUri;
  private final AbstractDraweeControllerBuilder mDraweeControllerBuilder;
  private final @Nullable Object mCallerContext;

  public FrescoBasedReactTextInlineImageShadowNode(
    AbstractDraweeControllerBuilder draweeControllerBuilder,
    @Nullable Object callerContext) {
    mDraweeControllerBuilder = draweeControllerBuilder;
    mCallerContext = callerContext;
  }

  @ReactProp(name = "src")
  public void setSource(@Nullable ReadableArray sources) {
    final String source =
      (sources == null || sources.size() == 0) ? null : sources.getMap(0).getString("uri");
    Uri uri = null;
    if (source != null) {
      try {
        uri = Uri.parse(source);
        // Verify scheme is set, so that relative uri (used by static resources) are not handled.
        if (uri.getScheme() == null) {
          uri = null;
        }
      } catch (Exception e) {
        // ignore malformed uri, then attempt to extract resource ID.
      }
      if (uri == null) {
        uri = getResourceDrawableUri(getThemedContext(), source);
      }
    }
    if (uri != mUri) {
      markUpdated();
    }
    mUri = uri;
  }

  public @Nullable Uri getUri() {
    return mUri;
  }

  // TODO: t9053573 is tracking that this code should be shared
  private static @Nullable Uri getResourceDrawableUri(Context context, @Nullable String name) {
    if (name == null || name.isEmpty()) {
      return null;
    }
    name = name.toLowerCase(Locale.getDefault()).replace("-", "_");
    int resId = context.getResources().getIdentifier(
      name,
      "drawable",
      context.getPackageName());
    return new Uri.Builder()
      .scheme(UriUtil.LOCAL_RESOURCE_SCHEME)
      .path(String.valueOf(resId))
      .build();
  }

  @Override
  public boolean isVirtual() {
    return true;
  }

  @Override
  public TextInlineImageSpan buildInlineImageSpan() {
    Resources resources = getThemedContext().getResources();
    int height = (int) Math.ceil(getStyleHeight());
    int width = (int) Math.ceil(getStyleWidth());
    return new FrescoBasedReactTextInlineImageSpan(
      resources,
      height,
      width,
      getUri(),
      getDraweeControllerBuilder(),
      getCallerContext());
  }

  public AbstractDraweeControllerBuilder getDraweeControllerBuilder() {
    return mDraweeControllerBuilder;
  }

  public @Nullable Object getCallerContext() {
    return mCallerContext;
  }
}
