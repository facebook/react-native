/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.imagehelper;

import android.content.Context;
import android.graphics.drawable.Drawable;
import android.net.Uri;
import androidx.annotation.Nullable;
import java.util.HashMap;
import java.util.Map;
import javax.annotation.concurrent.ThreadSafe;

/** Helper class for obtaining information about local images. */
@ThreadSafe
public class ResourceDrawableIdHelper {

  private Map<String, Integer> mResourceDrawableIdMap;

  private static final String LOCAL_RESOURCE_SCHEME = "res";
  private static volatile ResourceDrawableIdHelper sResourceDrawableIdHelper;

  private ResourceDrawableIdHelper() {
    mResourceDrawableIdMap = new HashMap<String, Integer>();
  }

  public static ResourceDrawableIdHelper getInstance() {
    if (sResourceDrawableIdHelper == null) {
      synchronized (ResourceDrawableIdHelper.class) {
        if (sResourceDrawableIdHelper == null) {
          sResourceDrawableIdHelper = new ResourceDrawableIdHelper();
        }
      }
    }
    return sResourceDrawableIdHelper;
  }

  public synchronized void clear() {
    mResourceDrawableIdMap.clear();
  }

  public int getResourceDrawableId(Context context, @Nullable String name) {
    if (name == null || name.isEmpty()) {
      return 0;
    }
    name = name.toLowerCase().replace("-", "_");

    // name could be a resource id.
    try {
      return Integer.parseInt(name);
    } catch (NumberFormatException e) {
      // Do nothing.
    }

    synchronized (this) {
      if (mResourceDrawableIdMap.containsKey(name)) {
        return mResourceDrawableIdMap.get(name);
      }
      int id = context.getResources().getIdentifier(name, "drawable", context.getPackageName());
      mResourceDrawableIdMap.put(name, id);
      return id;
    }
  }

  public @Nullable Drawable getResourceDrawable(Context context, @Nullable String name) {
    int resId = getResourceDrawableId(context, name);
    return resId > 0 ? context.getResources().getDrawable(resId) : null;
  }

  public Uri getResourceDrawableUri(Context context, @Nullable String name) {
    int resId = getResourceDrawableId(context, name);
    return resId > 0
        ? new Uri.Builder().scheme(LOCAL_RESOURCE_SCHEME).path(String.valueOf(resId)).build()
        : Uri.EMPTY;
  }
}
