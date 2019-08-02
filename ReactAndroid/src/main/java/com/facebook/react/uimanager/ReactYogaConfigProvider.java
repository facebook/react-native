/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * <p>This source code is licensed under the MIT license found in the LICENSE file in the root
 * directory of this source tree.
 */
package com.facebook.react.uimanager;

import com.facebook.yoga.YogaConfig;

public class ReactYogaConfigProvider {

  private static YogaConfig YOGA_CONFIG;

  public static YogaConfig get() {
    if (YOGA_CONFIG == null) {
      YOGA_CONFIG = new YogaConfig();
      YOGA_CONFIG.setPointScaleFactor(0f);
      YOGA_CONFIG.setUseLegacyStretchBehaviour(true);
    }
    return YOGA_CONFIG;
  }
}
