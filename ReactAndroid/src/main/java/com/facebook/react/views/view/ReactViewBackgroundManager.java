// Copyright 2004-present Facebook. All Rights Reserved.

package com.facebook.react.views.view;

import android.graphics.Color;
import android.graphics.drawable.Drawable;
import android.graphics.drawable.LayerDrawable;
import android.view.View;
import com.facebook.react.views.common.ViewHelper;
import javax.annotation.Nullable;

/** Class that manages the background for views and borders. */
public class ReactViewBackgroundManager {

  private @Nullable ReactViewBackgroundDrawable mReactBackgroundDrawable;
  private View mView;

  public ReactViewBackgroundManager(View view) {
    this.mView = view;
  }

  private ReactViewBackgroundDrawable getOrCreateReactViewBackground() {
    if (mReactBackgroundDrawable == null) {
      mReactBackgroundDrawable = new ReactViewBackgroundDrawable();
      Drawable backgroundDrawable = mView.getBackground();
      ViewHelper.setBackground(
          mView, null); // required so that drawable callback is cleared before we add the
      // drawable back as a part of LayerDrawable
      if (backgroundDrawable == null) {
        ViewHelper.setBackground(mView, mReactBackgroundDrawable);
      } else {
        LayerDrawable layerDrawable =
            new LayerDrawable(new Drawable[] {mReactBackgroundDrawable, backgroundDrawable});
        ViewHelper.setBackground(mView, layerDrawable);
      }
    }
    return mReactBackgroundDrawable;
  }

  public void setBackgroundColor(int color) {
    if (color == Color.TRANSPARENT && mReactBackgroundDrawable == null) {
      // don't do anything, no need to allocate ReactBackgroundDrawable for transparent background
    } else {
      getOrCreateReactViewBackground().setColor(color);
    }
  }

  public void setBorderWidth(int position, float width) {
    getOrCreateReactViewBackground().setBorderWidth(position, width);
  }

  public void setBorderColor(int position, float color, float alpha) {
    getOrCreateReactViewBackground().setBorderColor(position, color, alpha);
  }

  public void setBorderRadius(float borderRadius) {
    getOrCreateReactViewBackground().setRadius(borderRadius);
  }

  public void setBorderRadius(float borderRadius, int position) {
    getOrCreateReactViewBackground().setRadius(borderRadius, position);
  }

  public void setBorderStyle(@Nullable String style) {
    getOrCreateReactViewBackground().setBorderStyle(style);
  }
}
