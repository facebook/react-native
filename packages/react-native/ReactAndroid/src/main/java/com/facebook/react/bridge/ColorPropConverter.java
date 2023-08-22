/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge;

import android.content.Context;
import android.content.res.Resources;
import android.util.TypedValue;
import androidx.annotation.Nullable;
import androidx.core.content.res.ResourcesCompat;
import com.facebook.common.logging.FLog;
import com.facebook.react.common.ReactConstants;

public class ColorPropConverter {
  private static final String JSON_KEY = "resource_paths";
  private static final String PREFIX_RESOURCE = "@";
  private static final String PREFIX_ATTR = "?";
  private static final String PACKAGE_DELIMITER = ":";
  private static final String PATH_DELIMITER = "/";
  private static final String ATTR = "attr";
  private static final String ATTR_SEGMENT = "attr/";

  public static Integer getColor(Object value, Context context) {
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
