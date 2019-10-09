/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the LICENSE
 * file in the root directory of this source tree.
 */
package com.facebook.yoga;

public class YogaConfigJNIFinalizer extends YogaConfigJNIBase {
  public YogaConfigJNIFinalizer() {
    super();
  }

  public YogaConfigJNIFinalizer(boolean useVanillaJNI) {
    super(useVanillaJNI);
  }

  @Override
  protected void finalize() throws Throwable {
    try {
      freeNatives();
    } finally {
      super.finalize();
    }
   }

  public void freeNatives() {
    if (mNativePointer != 0) {
      long nativePointer = mNativePointer;
      mNativePointer = 0;
      if (useVanillaJNI)
        YogaNative.jni_YGConfigFreeJNI(nativePointer);
      else
        YogaNative.jni_YGConfigFree(nativePointer);
    }
  }
}
