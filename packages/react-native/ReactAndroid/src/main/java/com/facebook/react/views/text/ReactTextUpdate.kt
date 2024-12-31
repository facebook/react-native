/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.text

import android.text.Layout
import android.text.Spannable
import com.facebook.react.common.ReactConstants

/**
 * Class that contains the data needed for a text update. Used by both <Text/> and <TextInput/>
 * VisibleForTesting from [TextInputEventsTestCase].
 */
public class ReactTextUpdate(
    public val text: Spannable,
    public val jsEventCounter: Int,
    public val containsImages: Boolean,
    public val paddingLeft: Float,
    public val paddingTop: Float,
    public val paddingRight: Float,
    public val paddingBottom: Float,
    public val textAlign: Int,
    public val textBreakStrategy: Int,
    public val justificationMode: Int
) {

  /**
   * @deprecated Use a non-deprecated constructor for ReactTextUpdate instead. This one remains
   *   because it's being used by a unit test that isn't currently open source.
   */
  public constructor(
      text: Spannable,
      jsEventCounter: Int,
      containsImages: Boolean,
      paddingStart: Float,
      paddingTop: Float,
      paddingEnd: Float,
      paddingBottom: Float,
      textAlign: Int
  ) : this(
      text,
      jsEventCounter,
      containsImages,
      paddingStart,
      paddingTop,
      paddingEnd,
      paddingBottom,
      textAlign,
      Layout.BREAK_STRATEGY_HIGH_QUALITY,
      Layout.JUSTIFICATION_MODE_NONE)

  public constructor(
      text: Spannable,
      jsEventCounter: Int,
      containsImages: Boolean,
      textAlign: Int,
      textBreakStrategy: Int,
      justificationMode: Int
  ) : this(
      text,
      jsEventCounter,
      containsImages,
      ReactConstants.UNSET.toFloat(),
      ReactConstants.UNSET.toFloat(),
      ReactConstants.UNSET.toFloat(),
      ReactConstants.UNSET.toFloat(),
      textAlign,
      textBreakStrategy,
      justificationMode)

  @Deprecated(
      "This is just for backwards compatibility and will be removed some time in the future",
      ReplaceWith("containsImages"))
  public fun containsImages(): Boolean = containsImages

  public companion object {
    @JvmStatic
    public fun buildReactTextUpdateFromState(
        text: Spannable,
        jsEventCounter: Int,
        textAlign: Int,
        textBreakStrategy: Int,
        justificationMode: Int
    ): ReactTextUpdate =
        ReactTextUpdate(
            text, jsEventCounter, false, textAlign, textBreakStrategy, justificationMode)
  }
}
