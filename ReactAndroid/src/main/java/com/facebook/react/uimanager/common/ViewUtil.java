/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager.common;

import static com.facebook.react.uimanager.common.UIManagerType.FABRIC;
import static com.facebook.react.uimanager.common.UIManagerType.DEFAULT;

public class ViewUtil {

  /**
   * Counter for uniquely identifying views.
   * - % 2 === 0 means it is a Fabric tag.
   * See https://github.com/facebook/react/pull/12587
   *
   * @param reactTag {@link }
   */
  @UIManagerType
  public static int getUIManagerType(int reactTag) {
    if (reactTag % 2 == 0) return FABRIC;
    return DEFAULT;
  }

  /**
   * @param reactTag {@link int} react tag
   * @return if the react tag received by parameter is a RootTag or not.
   */
  @Deprecated
  public static boolean isRootTag(int reactTag) {
    return reactTag % 10 == 1;
  }

}
