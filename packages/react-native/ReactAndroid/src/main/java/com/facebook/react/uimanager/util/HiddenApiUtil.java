package com.facebook.react.uimanager.util;

import android.annotation.SuppressLint;
import android.graphics.Matrix;
import android.os.Build;
import android.view.View;

import androidx.annotation.DoNotInline;
import androidx.annotation.RequiresApi;

/**
 * @see <a href="https://cs.android.com/androidx/platform/frameworks/support/+/androidx-main:transition/transition/src/main/java/androidx/transition/ViewUtilsApi21.java">
 * AdnroidX transition library</a>
 */
public class HiddenApiUtil {

  /**
   * False when linking of the hidden setAnimationMatrix method has previously failed.
   */
  private static boolean sTryHiddenSetAnimationMatrix = true;

  private HiddenApiUtil() {
    // This class is not instantiable.
  }

  @SuppressLint("NewApi") // Lint doesn't know about the hidden method.
  public static boolean setAnimationMatrix(View view, Matrix matrix) {
    if (sTryHiddenSetAnimationMatrix) {
      // Since this was an @hide method made public, we can link directly against it with
      // a try/catch for its absence instead of doing the same through reflection.
      try {
        setAnimationMatrixApi29(view, matrix);
        return true;
      } catch (NoSuchMethodError e) {
        sTryHiddenSetAnimationMatrix = false;
      }
    }
    return false;
  }

  @DoNotInline
  @RequiresApi(api = Build.VERSION_CODES.Q)
  private static void setAnimationMatrixApi29(View view, Matrix matrix) {
    view.setAnimationMatrix(matrix);
  }
}
