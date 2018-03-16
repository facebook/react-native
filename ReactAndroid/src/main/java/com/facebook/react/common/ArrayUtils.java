package com.facebook.react.common;

import java.util.Arrays;

public class ArrayUtils {

  public static float[] copyArray(float[] array) {
    return array == null ? null : Arrays.copyOf(array, array.length);
  }

}
