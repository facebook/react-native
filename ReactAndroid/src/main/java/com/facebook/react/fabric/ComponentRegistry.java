/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.fabric;

import com.facebook.jni.HybridData;
import com.facebook.proguard.annotations.DoNotStrip;

/**
 * This class is responsible for registrering a set of RN Android view managers into a {@link
 * ComponentFactory}.
 */
public class ComponentRegistry {

  @DoNotStrip private final HybridData mHybridData;

  @DoNotStrip
  private native HybridData initHybrid(ComponentFactory componentFactory);

  public ComponentRegistry(ComponentFactory componentFactory) {
    mHybridData = initHybrid(componentFactory);
  }
}
