/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the LICENSE
 * file in the root directory of this source tree.
 */
package com.facebook.yoga;

import com.facebook.jni.DestructorThread;

public class YogaNodeJNIPhantomRefs extends YogaNodeJNIBase {
  public YogaNodeJNIPhantomRefs() {
    super();
    registerPhantomRef(this, mNativePointer);
  }

  public YogaNodeJNIPhantomRefs(YogaConfig config) {
    super(config);
    registerPhantomRef(this, mNativePointer);
  }

  @Override
  public YogaNodeJNIPhantomRefs cloneWithoutChildren() {
    YogaNodeJNIPhantomRefs clone = (YogaNodeJNIPhantomRefs) super.cloneWithoutChildren();
    registerPhantomRef(clone, clone.mNativePointer);
    return clone;
  }

  private static final void registerPhantomRef(YogaNode node, final long nativePointer) {
    new DestructorThread.Destructor(node) {
      private long mNativePointer = nativePointer;
      @Override
      protected void destruct() {
        if (mNativePointer != 0) {
          YogaNative.jni_YGNodeFree(mNativePointer);
          mNativePointer = 0;
        }
      }
    };
  }
}
