/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge;

import android.content.Context;
import android.content.res.Resources;
import android.graphics.Color;
import android.graphics.ColorSpace;
import android.os.Build;
import android.util.TypedValue;
import androidx.annotation.ColorLong;
import androidx.annotation.Nullable;
import androidx.core.content.res.ResourcesCompat;
import com.facebook.common.logging.FLog;
import com.facebook.react.common.ReactConstants;

public class ColorPropConverter {

  private static boolean supportWideGamut() {
    return Build.VERSION.SDK_INT >= Build.VERSION_CODES.O;
  }

  private static final String JSON_KEY = "resource_paths";
  private static final String PREFIX_RESOURCE = "@";
  private static final String PREFIX_ATTR = "?";
  private static final String PACKAGE_DELIMITER = ":";
  private static final String PATH_DELIMITER = "/";
  private static final String ATTR = "attr";
  private static final String ATTR_SEGMENT = "attr/";

  @Nullable
  private static Integer getColorInteger(Object value, Context context) {
    if (value == null) {
      return null;
    }

    if (value instanceof Double) {
      return ((Double) value).intValue();
    }

    if (context == null) {
      throw new RuntimeException("Context may not be null.");
    }

    if (value instanceof ReadableMap) {
      ReadableMap map = (ReadableMap) value;

      if (map.hasKey("space")) {
        int r = (int) ((float) map.getDouble("r") * 255);
        int g = (int) ((float) map.getDouble("g") * 255);
        int b = (int) ((float) map.getDouble("b") * 255);
        int a = (int) ((float) map.getDouble("a") * 255);

        return Color.argb(a, r, g, b);
      }

      ReadableArray resourcePaths = map.getArray(JSON_KEY);

      if (resourcePaths == null) {
        throw new JSApplicationCausedNativeException(
            "ColorValue: The `" + JSON_KEY + "` must be an array of color resource path strings.");
      }

      for (int i = 0; i < resourcePaths.size(); i++) {
        Integer result = resolveResourcePath(context, resourcePaths.getString(i));
        if (result != null) {
          return result;
        }
      }

      throw new JSApplicationCausedNativeException(
          "ColorValue: None of the paths in the `"
              + JSON_KEY
              + "` array resolved to a color resource.");
    }

    throw new JSApplicationCausedNativeException(
        "ColorValue: the value must be a number or Object.");
  }

  @Nullable
  public static Color getColorInstance(Object value, Context context) {
    if (value == null) {
      return null;
    }

    if (supportWideGamut() && value instanceof Double) {
      return Color.valueOf(((Double) value).intValue());
    }

    if (context == null) {
      throw new RuntimeException("Context may not be null.");
    }

    if (value instanceof ReadableMap) {
      ReadableMap map = (ReadableMap) value;

      if (supportWideGamut() && map.hasKey("space")) {
        String rawColorSpace = map.getString("space");
        boolean isDisplayP3 = rawColorSpace != null && rawColorSpace.equals("display-p3");
        ColorSpace space =
            ColorSpace.get(isDisplayP3 ? ColorSpace.Named.DISPLAY_P3 : ColorSpace.Named.SRGB);
        float r = (float) map.getDouble("r");
        float g = (float) map.getDouble("g");
        float b = (float) map.getDouble("b");
        float a = (float) map.getDouble("a");

        @ColorLong long color = Color.pack(r, g, b, a, space);
        return Color.valueOf(color);
      }

      ReadableArray resourcePaths = map.getArray(JSON_KEY);
      if (resourcePaths == null) {
        throw new JSApplicationCausedNativeException(
            "ColorValue: The `" + JSON_KEY + "` must be an array of color resource path strings.");
      }

      for (int i = 0; i < resourcePaths.size(); i++) {
        Integer result = resolveResourcePath(context, resourcePaths.getString(i));
        if (supportWideGamut() && result != null) {
          return Color.valueOf(result);
        }
      }

      throw new JSApplicationCausedNativeException(
          "ColorValue: None of the paths in the `"
              + JSON_KEY
              + "` array resolved to a color resource.");
    }
    throw new JSApplicationCausedNativeException(
        "ColorValue: the value must be a number or Object.");
  }

  public static Integer getColor(Object value, Context context) {
    try {
      if (supportWideGamut()) {
        Color color = getColorInstance(value, context);
        if (color != null) {
          return color.toArgb();
        }
      }
    } catch (JSApplicationCausedNativeException ex) {
      FLog.w(ReactConstants.TAG, ex, "Error extracting color from WideGamut");
    }
    return getColorInteger(value, context);
  }

  public static Integer getColor(Object value, Context context, int defaultInt) {
    try {
      return getColor(value, context);
    } catch (JSApplicationCausedNativeException e) {
      FLog.w(ReactConstants.TAG, e, "Error converting ColorValue");
      return defaultInt;
    }
  }

  public static Integer resolveResourcePath(Context context, @Nullable String resourcePath) {
    if (resourcePath == null || resourcePath.isEmpty()) {
      return null;
    }

    boolean isResource = resourcePath.startsWith(PREFIX_RESOURCE);
    boolean isThemeAttribute = resourcePath.startsWith(PREFIX_ATTR);

    resourcePath = resourcePath.substring(1);

    try {
      if (isResource) {
        return resolveResource(context, resourcePath);
      } else if (isThemeAttribute) {
        return resolveThemeAttribute(context, resourcePath);
      }
    } catch (Resources.NotFoundException exception) {
      // The resource could not be found so do nothing to allow the for loop to continue and
      // try the next fallback resource in the array.  If none of the fallbacks are
      // found then the exception immediately after the for loop will be thrown.
    }
    return null;
  }

  private static int resolveResource(Context context, String resourcePath) {
    String[] pathTokens = resourcePath.split(PACKAGE_DELIMITER);

    String packageName = context.getPackageName();
    String resource = resourcePath;

    if (pathTokens.length > 1) {
      packageName = pathTokens[0];
      resource = pathTokens[1];
    }

    String[] resourceTokens = resource.split(PATH_DELIMITER);
    String resourceType = resourceTokens[0];
    String resourceName = resourceTokens[1];

    int resourceId = context.getResources().getIdentifier(resourceName, resourceType, packageName);

    return ResourcesCompat.getColor(context.getResources(), resourceId, context.getTheme());
  }

  private static int resolveThemeAttribute(Context context, String resourcePath) {
    String path = resourcePath.replaceAll(ATTR_SEGMENT, "");
    String[] pathTokens = path.split(PACKAGE_DELIMITER);

    String packageName = context.getPackageName();
    String resourceName = path;

    if (pathTokens.length > 1) {
      packageName = pathTokens[0];
      resourceName = pathTokens[1];
    }

    int resourceId = context.getResources().getIdentifier(resourceName, ATTR, packageName);

    TypedValue outValue = new TypedValue();
    Resources.Theme theme = context.getTheme();

    if (theme.resolveAttribute(resourceId, outValue, true)) {
      return outValue.data;
    }

    throw new Resources.NotFoundException();
  }
}
