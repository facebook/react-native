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
import android.util.DisplayMetrics;
import android.view.WindowManager;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import java.io.File;
import java.util.HashMap;
import java.util.Map;

import javax.annotation.concurrent.ThreadSafe;

/** Helper class for obtaining information about local images. */
@ThreadSafe
public class ResourceDrawableIdHelper {

  private Map<String, Integer> mResourceDrawableIdMap;

  private static final String CACHE_DRAWABLE_DIRECTORY_SCHEME = "otas/app/src/main/res";
  private static final String[] RESOURCE_EXTENSIONS = {
    "xml",
    "png",
    "svg",
    "jpg"
  };
  private static final String LOCAL_RESOURCE_SCHEME = "res";
  private static volatile ResourceDrawableIdHelper sResourceDrawableIdHelper;

  private int densityDpi;

  private ResourceDrawableIdHelper() {
    mResourceDrawableIdMap = new HashMap<>();
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
    name = sanitizeResourceDrawableId(name);

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

  private String sanitizeResourceDrawableId(@NonNull String name) {
    return name.toLowerCase().replace("-", "_");
  }

  public @Nullable Drawable getResourceDrawable(Context context, @Nullable String name) {
    int resId = getResourceDrawableId(context, name);
    return resId > 0 ? context.getResources().getDrawable(resId) : null;
  }

  public Uri getResourceDrawableUri(Context context, @Nullable String name) {
    // Checks to see if we have an ota version of the file, otherwise default to normal behavior.
    File otaFile = getSourceFile(context, name);
    if (otaFile != null) {
      return Uri.fromFile(otaFile);
    }

    int resId = getResourceDrawableId(context, name);
    return resId > 0
        ? new Uri.Builder().scheme(LOCAL_RESOURCE_SCHEME).path(String.valueOf(resId)).build()
        : Uri.EMPTY;
  }

  /**
   * Returns the proper density suffix (e.g.: xxhdpi) for the phone screen.
   * For phones in between density sizes, we round up.
   */
  private File getSourceFile(Context context, @Nullable String fileName) {
    if (fileName == null || fileName.isEmpty()) {
      return null;
    }

    File file = null;
    int densityDpi = getDensityDpi(context);
    PhoneDensity[] phoneDensities = PhoneDensity.values();

    for (PhoneDensity phoneDensity : phoneDensities) {
      String drawableFileParent = String.format("drawable-%s", phoneDensity.fileParentSuffix);
      String mipMapFileParent = String.format("mipmap-%s", phoneDensity.fileParentSuffix);

      String[] parentFileNames = { drawableFileParent, mipMapFileParent };

      File resourceFile = checkFiles(context, parentFileNames, fileName);

      if (resourceFile != null) {
        file = resourceFile;
      }

      if (densityDpi <= phoneDensity.density) {
        if (file != null) {
          return file;
        }
      }
    }

    String[] parentFileNames = { "drawable", "raw" };

    // As a last resort, check the drawable/raw files.
    return checkFiles(context, parentFileNames, fileName);
  }

  private File checkFiles(Context context, String[] parentFileNames, String fileName) {
    for(String parentFileName : parentFileNames) {
      for (String extension : RESOURCE_EXTENSIONS) {
        File file = getFile(context, parentFileName, fileName, extension);
        if (file.exists()) {
          return file;
        }
      }
    }

    return null;
  }

  private File getFile(Context context, String parentFileName, String fileName, String extension) {
    String fullDrawableFileName = String.format(
      "%s/%s/%s.%s",
      CACHE_DRAWABLE_DIRECTORY_SCHEME,
      parentFileName,
      fileName,
      extension
    );

    return new File(context.getCacheDir(), fullDrawableFileName);
  }

  private int getDensityDpi(Context context) {
    if (densityDpi == 0) {
      DisplayMetrics metrics = new DisplayMetrics();

      WindowManager windowManager = (WindowManager) context.getSystemService(Context.WINDOW_SERVICE);
      windowManager.getDefaultDisplay().getMetrics(metrics);

      densityDpi = metrics.densityDpi;
    }

    return densityDpi;
  }

  enum PhoneDensity {
    Medium(DisplayMetrics.DENSITY_MEDIUM, "mdpi"),
    High(DisplayMetrics.DENSITY_HIGH, "hdpi"),
    XHigh(DisplayMetrics.DENSITY_XHIGH, "xhdpi"),
    XXHigh(DisplayMetrics.DENSITY_XXHIGH, "xxhdpi"),
    XXXHigh(DisplayMetrics.DENSITY_XXXHIGH, "xxxhdpi");

    int density;

    @NonNull
    String fileParentSuffix;

    PhoneDensity(
      int density,
      @NonNull String fileParentSuffix
    ) {
      this.density = density;
      this.fileParentSuffix = fileParentSuffix;
    }
  }
}
