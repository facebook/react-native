// Copyright 2004-present Facebook. All Rights Reserved.

package com.facebook.react.views.imagehelper;

import javax.annotation.Nullable;

import java.util.HashMap;
import java.util.Map;

import android.content.ContentResolver;
import android.content.Context;
import android.graphics.drawable.Drawable;
import android.net.Uri;

/**
 * Helper class for obtaining information about local images.
 */
public class ResourceDrawableIdHelper {

  private Map<String, Integer> mResourceDrawableIdMap;

  private static ResourceDrawableIdHelper sResourceDrawableIdHelper;

  private ResourceDrawableIdHelper() {
    mResourceDrawableIdMap = new HashMap<String, Integer>();
  }

  public static ResourceDrawableIdHelper getInstance() {
    if (sResourceDrawableIdHelper == null) {
      sResourceDrawableIdHelper = new ResourceDrawableIdHelper();
    }
    return sResourceDrawableIdHelper;
  }

  public void clear() {
    mResourceDrawableIdMap.clear();
  }

  public int getResourceDrawableId(Context context, @Nullable String name) {
    if (name == null || name.isEmpty()) {
      return 0;
    }
    name = name.toLowerCase().replace("-", "_");
    if (mResourceDrawableIdMap.containsKey(name)) {
      return mResourceDrawableIdMap.get(name);
    }
    int id = context.getResources().getIdentifier(
      name,
      "drawable",
      context.getPackageName());
    mResourceDrawableIdMap.put(name, id);
    return id;
  }

  public @Nullable Drawable getResourceDrawable(Context context, @Nullable String name) {
    int resId = getResourceDrawableId(context, name);
    return resId > 0 ? context.getResources().getDrawable(resId) : null;
  }

  public Uri getResourceDrawableUri(Context context, @Nullable String name) {
    if (name == null || name.isEmpty()) {
      return null;
    }

    int resId = ResourceDrawableIdHelper.getInstance().getResourceDrawableId(context, name);

    return new Uri.Builder()
      .scheme(ContentResolver.SCHEME_ANDROID_RESOURCE)
      .authority(context.getPackageName())
      .path(String.valueOf(resId))
      .build();
  }
}
