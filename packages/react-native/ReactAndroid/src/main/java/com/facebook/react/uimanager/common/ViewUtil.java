/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager.common;

import static com.facebook.react.uimanager.common.UIManagerType.DEFAULT;
import static com.facebook.react.uimanager.common.UIManagerType.FABRIC;

import com.facebook.infer.annotation.Nullsafe;

@Nullsafe(Nullsafe.Mode.LOCAL)
public class ViewUtil {

  public static final int NO_SURFACE_ID = -1;

  /**
   * Counter for uniquely identifying views. - % 2 === 0 means it is a Fabric tag. See
   * https://github.com/facebook/react/pull/12587
   *
   * @param viewTag {@link int} tag of the view this is event is dispatched to
   */
  @UIManagerType
  public static int getUIManagerType(int viewTag) {
    if (viewTag % 2 == 0) return FABRIC;
    return DEFAULT;
  }

  /**
   * Version of getUIManagerType that uses both surfaceId and viewTag heuristics
   *
   * @param viewTag {@link int} tag of the view this is event is dispatched to
   * @param surfaceId {@link int} ID of the corresponding surface
   */
  @UIManagerType
  public static int getUIManagerType(int viewTag, int surfaceId) {
    // We have a contract that Fabric events *always* have a SurfaceId passed in, and non-Fabric
    // events NEVER have a SurfaceId passed in (the default/placeholder of -1 is passed in instead).
    //
    // Why does this matter?
    // Events can be sent to Views that are part of the View hierarchy *but not directly managed
    // by React Native*. For example, embedded custom hierarchies, Litho hierarchies, etc.
    // In those cases it's important to know that the Event should be sent to the Fabric or
    // non-Fabric UIManager, and we cannot use the ViewTag for inference since it's not controlled
    // by RN and is essentially a random number.
    // At some point it would be great to pass the SurfaceContext here instead.
    @UIManagerType int uiManagerType = (surfaceId == -1 ? DEFAULT : FABRIC);
    if (uiManagerType == DEFAULT && !ViewUtil.isRootTag(viewTag)) {
      // TODO (T123064648): Some events for Fabric still didn't have the surfaceId set, so if it's
      // not a React RootView, double check if the tag belongs to Fabric.
      if (viewTag % 2 == 0) return FABRIC;
    }
    return uiManagerType;
  }

  /**
   * @param viewTag {@link int} react tag
   * @return if the react tag received by parameter is a RootTag or not.
   */
  @Deprecated
  public static boolean isRootTag(int viewTag) {
    return viewTag % 10 == 1;
  }
}
