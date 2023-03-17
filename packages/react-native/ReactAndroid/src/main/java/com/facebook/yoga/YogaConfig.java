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
  /**
   * Yoga previously had an error where containers would take the maximum space possible instead of the minimum
   * like they are supposed to. In practice this resulted in implicit behaviour similar to align-self: stretch;
   * Because this was such a long-standing bug we must allow legacy users to switch back to this behaviour.
   */
  public abstract void setUseLegacyStretchBehaviour(boolean useLegacyStretchBehaviour);

  public abstract void setLogger(YogaLogger logger);

  public abstract YogaLogger getLogger();

  abstract long getNativePointer();
}
