/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.testutils.shadows;

import android.content.Context;
import com.facebook.soloader.SoLoader;
import org.robolectric.annotation.Implementation;
import org.robolectric.annotation.Implements;

@Implements(SoLoader.class)
public class ShadowSoLoader {
  @Implementation
  public static void init(Context context, int flags) {}

  @Implementation
  public static boolean loadLibrary(String shortName) {
    return true;
  }
}
