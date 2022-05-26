/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.text.frescosupport;

import android.content.Context;
import android.content.res.Resources;
import android.net.Uri;
import androidx.annotation.Nullable;
import com.facebook.common.util.UriUtil;
import com.facebook.drawee.controller.AbstractDraweeControllerBuilder;
import com.facebook.react.bridge.Dynamic;
import com.facebook.react.bridge.JSApplicationIllegalArgumentException;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.ReadableType;
import com.facebook.react.uimanager.ViewProps;
import com.facebook.react.uimanager.annotations.ReactProp;
import com.facebook.react.views.text.ReactTextInlineImageShadowNode;
import com.facebook.react.views.text.TextInlineImageSpan;
import com.facebook.yoga.YogaConstants;
import java.util.Locale;

/** Shadow node that represents an inline image. Loading is done using Fresco. */
public class FrescoBasedReactTextInlineImageShadowNode extends ReactTextInlineImageShadowNode {

  private @Nullable Uri mUri;
  private ReadableMap mHeaders;
  private final AbstractDraweeControllerBuilder mDraweeControllerBuilder;
  private final @Nullable Object mCallerContext;
  private float mWidth = YogaConstants.UNDEFINED;
  private @Nullable String mResizeMode;
  private float mHeight = YogaConstants.UNDEFINED;
  private int mTintColor = 0;

  public FrescoBasedReactTextInlineImageShadowNode(
      AbstractDraweeControllerBuilder draweeControllerBuilder, @Nullable Object callerContext) {
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

  @ReactProp(name = "headers")
  public void setHeaders(ReadableMap headers) {
    mHeaders = headers;
  }

  @ReactProp(name = "tintColor", customType = "Color")
  public void setTintColor(int tintColor) {
    mTintColor = tintColor;
  }

  /** Besides width/height, all other layout props on inline images are ignored */
  @Override
  public void setWidth(Dynamic width) {
    if (width.getType() == ReadableType.Number) {
      mWidth = (float) width.asDouble();
    } else {
      throw new JSApplicationIllegalArgumentException(
          "Inline images must not have percentage based width");
    }
  }

  @Override
  public void setHeight(Dynamic height) {
    if (height.getType() == ReadableType.Number) {
      mHeight = (float) height.asDouble();
    } else {
      throw new JSApplicationIllegalArgumentException(
          "Inline images must not have percentage based height");
    }
  }

  @ReactProp(name = ViewProps.RESIZE_MODE)
  public void setResizeMode(@Nullable String resizeMode) {
    mResizeMode = resizeMode;
  }

  public @Nullable Uri getUri() {
    return mUri;
  }

  public ReadableMap getHeaders() {
    return mHeaders;
  }

  // TODO: t9053573 is tracking that this code should be shared
  private static @Nullable Uri getResourceDrawableUri(Context context, @Nullable String name) {
    if (name == null || name.isEmpty()) {
      return null;
    }
    name = name.toLowerCase(Locale.getDefault()).replace("-", "_");
    int resId = context.getResources().getIdentifier(name, "drawable", context.getPackageName());
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
    int width = (int) Math.ceil(mWidth);
    int height = (int) Math.ceil(mHeight);
    return new FrescoBasedReactTextInlineImageSpan(
        resources,
        height,
        width,
        mTintColor,
        getUri(),
        getHeaders(),
        getDraweeControllerBuilder(),
        getCallerContext(),
        mResizeMode);
  }

  public AbstractDraweeControllerBuilder getDraweeControllerBuilder() {
    return mDraweeControllerBuilder;
  }

  public @Nullable Object getCallerContext() {
    return mCallerContext;
  }
}
