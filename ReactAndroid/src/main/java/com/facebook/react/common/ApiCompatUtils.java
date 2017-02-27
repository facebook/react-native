package com.facebook.react.common;

import android.app.Activity;
import android.content.Intent;
import android.graphics.drawable.Drawable;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.ViewTreeObserver;

import com.facebook.common.logging.FLog;

import javax.annotation.Nonnull;

/**
 * Utility class for do some android API level compat stuff.
 */
public class ApiCompatUtils {

  private static final String TAG = "ApiCompatUtils";

  /**
   * We may remove this compat strategy and make minSdkVersion 16 after
   * ICS distribution below 0.1%.
   */
  public static boolean isJellyBeanOrHigher() {
    return Build.VERSION.SDK_INT >= Build.VERSION_CODES.JELLY_BEAN;
  }

  public static boolean isJellyBeanMR1OrHigher() {
    return Build.VERSION.SDK_INT >= Build.VERSION_CODES.JELLY_BEAN_MR1;
  }

  public static boolean isKitkatOrHigher() {
    return Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT;
  }

  public static boolean isLollipopOrHigher() {
    return Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP;
  }

  // ------- Compat functions for API 16 ------- //
  public static void removeOnGlobalLayoutListener(ViewTreeObserver observer,
                                                  ViewTreeObserver.OnGlobalLayoutListener listener) {
    if (isJellyBeanOrHigher()) {
      observer.removeOnGlobalLayoutListener(listener);
    } else {
      observer.removeGlobalOnLayoutListener(listener);
    }
  }

  public static void setBackground(View view, Drawable drawable) {
    if (isJellyBeanOrHigher()) {
      view.setBackground(drawable);
    } else {
      view.setBackgroundDrawable(drawable);
    }
  }

  public static boolean startActivityForResult(@Nonnull Activity activity, Intent intent,
                                               int code, Bundle bundle) {
    if (isJellyBeanOrHigher()) {
      activity.startActivityForResult(intent, code, bundle);
    } else {
      if (bundle != null) {
        FLog.w(TAG, "Cannot add bundle on startActivityForResult in android API 15!");
      }
      activity.startActivityForResult(intent, code);
    }
    return true;
  }

  // ------- Compat functions for API 17 ------- //
  public static void setRtl(View view, boolean rtl) {
    if (isJellyBeanMR1OrHigher()) {
      view.setLayoutDirection(rtl ? View.LAYOUT_DIRECTION_RTL : View.LAYOUT_DIRECTION_LTR);
    }
  }

  public static int getPaddingStart(View view) {
    if (isJellyBeanMR1OrHigher()) {
      return view.getPaddingStart();
    } else {
      return view.getPaddingLeft();
    }
  }

  public static int getPaddingEnd(View view) {
    if (isJellyBeanMR1OrHigher()) {
      return view.getPaddingEnd();
    } else {
      return view.getPaddingRight();
    }
  }
}
