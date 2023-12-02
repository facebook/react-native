/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.yoga;

public abstract class YogaConfig {

  public static int SPACING_TYPE = 1;

  public abstract void setExperimentalFeatureEnabled(YogaExperimentalFeature feature, boolean enabled);

  public abstract void setUseWebDefaults(boolean useWebDefaults);

  public abstract void setPrintTreeFlag(boolean enable);

  public abstract void setPointScaleFactor(float pixelsInPoint);

  public abstract void setErrata(YogaErrata errata);

  public abstract YogaErrata getErrata();

  public abstract void setLogger(YogaLogger logger);

  public abstract YogaLogger getLogger();

  abstract long getNativePointer();
}
