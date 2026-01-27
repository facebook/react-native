/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.view

import android.view.View
import com.facebook.react.R
import com.facebook.react.uimanager.PointerEvents

/**
 * Helper class for managing the important_for_interaction view tag. This tag determines how a view
 * participates in interaction handling.
 *
 * The important_for_interaction value is a bitfield that can contain combinations of:
 * - [IMPORTANT_FOR_INTERACTION_YES]: The view is important for interaction
 * - [IMPORTANT_FOR_INTERACTION_NO]: The view is not important for interaction
 * - [IMPORTANT_FOR_INTERACTION_EXCLUDE_DESCENDANTS]: Descendants should be excluded from
 *   interaction
 */
internal object ImportantForInteractionHelper {
  /** The view is important for interaction. */
  const val IMPORTANT_FOR_INTERACTION_YES: Int = 0x1

  /** The view is not important for interaction. */
  const val IMPORTANT_FOR_INTERACTION_NO: Int = 0x2

  /** Descendants of this view should be excluded from interaction handling. */
  const val IMPORTANT_FOR_INTERACTION_EXCLUDE_DESCENDANTS: Int = 0x4

  /**
   * Sets the important_for_interaction tag on a view based on the given [PointerEvents] value.
   *
   * Note: The pointer events value alone does not determine if a view is important for interaction.
   * A view with pointerEvents=auto or pointerEvents=box-only is only important for interaction if
   * it is also clickable. Therefore, for these cases we let the view's own state determine whether
   * it's important for interaction rather than setting the tag.
   *
   * The mapping is as follows:
   * - [PointerEvents.AUTO] -> No tag set (i.e. the view's own state determines importance)
   * - [PointerEvents.NONE] -> [IMPORTANT_FOR_INTERACTION_NO] |
   *   [IMPORTANT_FOR_INTERACTION_EXCLUDE_DESCENDANTS]
   * - [PointerEvents.BOX_ONLY] -> [IMPORTANT_FOR_INTERACTION_EXCLUDE_DESCENDANTS] (i.e. the view's
   *   own state determines importance but its descendants are excluded)
   * - [PointerEvents.BOX_NONE] -> [IMPORTANT_FOR_INTERACTION_NO]
   *
   * @param view The view to set the tag on
   * @param pointerEvents The pointer events value to convert and set
   */
  @JvmStatic
  fun setImportantForInteraction(view: View, pointerEvents: PointerEvents) {
    val value =
        when (pointerEvents) {
          PointerEvents.AUTO -> return
          PointerEvents.NONE ->
              IMPORTANT_FOR_INTERACTION_NO or IMPORTANT_FOR_INTERACTION_EXCLUDE_DESCENDANTS
          PointerEvents.BOX_ONLY -> IMPORTANT_FOR_INTERACTION_EXCLUDE_DESCENDANTS
          PointerEvents.BOX_NONE -> IMPORTANT_FOR_INTERACTION_NO
        }
    view.setTag(R.id.important_for_interaction, value)
  }
}
