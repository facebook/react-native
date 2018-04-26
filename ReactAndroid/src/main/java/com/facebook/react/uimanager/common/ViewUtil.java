/**
 * Copyright (c) 2014-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager.common;

import static com.facebook.react.uimanager.common.ViewType.FABRIC;
import static com.facebook.react.uimanager.common.ViewType.PAPER;

public class ViewUtil {

  /**
   * Counter for uniquely identifying views.
   * - % 10 === 1 means it is a rootTag.
   * - % 2 === 0 means it is a Fabric tag.
   * See https://github.com/facebook/react/pull/12587
   *
   * @param reactTag {@link }
   */
  @ViewType
  public static int getViewType(int reactTag) {
    if (reactTag % 2 == 0) return FABRIC;
    return PAPER;
  }

}
