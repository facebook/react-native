/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.textinput

import android.annotation.SuppressLint
import android.text.Layout
import android.util.TypedValue
import android.view.ViewGroup
import android.widget.EditText
import androidx.appcompat.view.ContextThemeWrapper
import androidx.core.view.ViewCompat
import com.facebook.common.logging.FLog
import com.facebook.infer.annotation.Assertions
import com.facebook.react.R
import com.facebook.react.common.ReactConstants
import com.facebook.react.common.annotations.LegacyArchitectureShadowNodeWithCxxImpl
import com.facebook.react.common.annotations.internal.LegacyArchitecture
import com.facebook.react.uimanager.Spacing
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.UIViewOperationQueue
import com.facebook.react.uimanager.annotations.ReactProp
import com.facebook.react.views.text.ReactBaseTextShadowNode
import com.facebook.react.views.text.ReactTextUpdate
import com.facebook.react.views.text.ReactTextViewManagerCallback
import com.facebook.react.views.view.MeasureUtil.getMeasureSpec
import com.facebook.yoga.YogaMeasureFunction
import com.facebook.yoga.YogaMeasureMode
import com.facebook.yoga.YogaMeasureOutput
import com.facebook.yoga.YogaNode

@LegacyArchitecture
@LegacyArchitectureShadowNodeWithCxxImpl
internal class ReactTextInputShadowNode
@JvmOverloads
constructor(reactTextViewManagerCallback: ReactTextViewManagerCallback? = null) :
    ReactBaseTextShadowNode(reactTextViewManagerCallback), YogaMeasureFunction {
  private var mostRecentEventCount = ReactConstants.UNSET
  private var internalEditText: EditText? = null
  private var localData: ReactTextInputLocalData? = null

  // Represents the `text` property only, not possible nested content.
  @set:ReactProp(name = PROP_TEXT)
  var text: String? = null
    set(value) {
      field = value
      markUpdated()
    }

  @set:ReactProp(name = PROP_PLACEHOLDER)
  var placeholder: String? = null
    set(value) {
      field = value
      markUpdated()
    }

  init {
    mTextBreakStrategy = Layout.BREAK_STRATEGY_HIGH_QUALITY
    setMeasureFunction(this)
  }

  @Suppress("DEPRECATION")
  override fun setThemedContext(themedContext: ThemedReactContext) {
    super.setThemedContext(themedContext)

    // [EditText] has by default a border at the bottom of its view
    // called "underline". To have a native look and feel of the TextEdit
    // we have to preserve it at least by default.
    // The border (underline) has its padding set by the background image
    // provided by the system (which vary a lot among versions and vendors
    // of Android), and it cannot be changed.
    // So, we have to enforce it as a default padding.
    // TODO #7120264: Cache this stuff better.
    val editText = createInternalEditText()
    setDefaultPadding(Spacing.START, ViewCompat.getPaddingStart(editText).toFloat())
    setDefaultPadding(Spacing.TOP, editText.paddingTop.toFloat())
    setDefaultPadding(Spacing.END, ViewCompat.getPaddingEnd(editText).toFloat())
    setDefaultPadding(Spacing.BOTTOM, editText.paddingBottom.toFloat())

    internalEditText = editText

    // We must measure the EditText without paddings, so we have to reset them.
    internalEditText?.setPadding(0, 0, 0, 0)

    // This is needed to fix an android bug since 4.4.3 which will throw an NPE in measure,
    // setting the layoutParams fixes it: https://code.google.com/p/android/issues/detail?id=75877
    internalEditText?.layoutParams =
        ViewGroup.LayoutParams(
            ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT)
  }

  override fun measure(
      node: YogaNode,
      width: Float,
      widthMode: YogaMeasureMode,
      height: Float,
      heightMode: YogaMeasureMode
  ): Long {
    // measure() should never be called before setThemedContext()
    val editText = checkNotNull(internalEditText)

    if (localData != null) {
      localData?.apply(editText)
    } else {
      editText.setTextSize(TypedValue.COMPLEX_UNIT_PX, mTextAttributes.effectiveFontSize.toFloat())

      if (mNumberOfLines != ReactConstants.UNSET) {
        editText.setLines(mNumberOfLines)
      }

      @SuppressLint("WrongConstant")
      if (editText.breakStrategy != mTextBreakStrategy) {
        editText.breakStrategy = mTextBreakStrategy
      }
    }

    // make sure the placeholder content is also being measured
    editText.hint = placeholder
    editText.measure(getMeasureSpec(width, widthMode), getMeasureSpec(height, heightMode))

    return YogaMeasureOutput.make(editText.measuredWidth, editText.measuredHeight)
  }

  override fun isVirtualAnchor(): Boolean = true

  override fun isYogaLeafNode(): Boolean = true

  override fun setLocalData(data: Any) {
    Assertions.assertCondition(data is ReactTextInputLocalData)
    localData = data as ReactTextInputLocalData

    // Telling to Yoga that the node should be remeasured on next layout pass.
    dirty()

    // Note: We should NOT mark the node updated (by calling {@code markUpdated}) here
    // because the state remains the same.
  }

  @ReactProp(name = "mostRecentEventCount")
  public fun setMostRecentEventCount(mostRecentEventCount: Int) {
    this.mostRecentEventCount = mostRecentEventCount
  }

  override fun setTextBreakStrategy(textBreakStrategy: String?) {
    when (textBreakStrategy) {
      null,
      "simple" -> mTextBreakStrategy = Layout.BREAK_STRATEGY_SIMPLE
      "highQuality" -> mTextBreakStrategy = Layout.BREAK_STRATEGY_HIGH_QUALITY
      "balanced" -> mTextBreakStrategy = Layout.BREAK_STRATEGY_BALANCED
      else -> {
        FLog.w(ReactConstants.TAG, "Invalid textBreakStrategy: $textBreakStrategy")
        mTextBreakStrategy = Layout.BREAK_STRATEGY_SIMPLE
      }
    }
  }

  override fun onCollectExtraUpdates(uiViewOperationQueue: UIViewOperationQueue) {
    super.onCollectExtraUpdates(uiViewOperationQueue)

    if (mostRecentEventCount != ReactConstants.UNSET) {
      val reactTextUpdate =
          ReactTextUpdate(
              spannedFromShadowNode(
                  this,
                  text, /* supportsInlineViews: */
                  false, /* nativeViewHierarchyOptimizer: */
                  null // only needed to support inline views
                  ),
              mostRecentEventCount,
              mContainsImages,
              getPadding(Spacing.LEFT),
              getPadding(Spacing.TOP),
              getPadding(Spacing.RIGHT),
              getPadding(Spacing.BOTTOM),
              mTextAlign,
              mTextBreakStrategy,
              mJustificationMode)
      uiViewOperationQueue.enqueueUpdateExtraData(reactTag, reactTextUpdate)
    }
  }

  override fun setPadding(spacingType: Int, padding: Float) {
    super.setPadding(spacingType, padding)
    markUpdated()
  }

  /**
   * May be overridden by subclasses that would like to provide their own instance of the internal
   * `EditText` this class uses to determine the expected size of the view.
   */
  private fun createInternalEditText(): EditText {
    // By setting a style which has a background drawable, this EditText will have a different
    // background drawable instance from that on the UI Thread, which maybe has a default background
    // drawable instance.
    // Otherwise, DrawableContainer is not a thread safe class, and it caused the npe in #29452.
    val context =
        ContextThemeWrapper(themedContext, R.style.Theme_ReactNative_TextInput_DefaultBackground)
    return EditText(context)
  }

  companion object {
    const val PROP_TEXT: String = "text"

    const val PROP_PLACEHOLDER: String = "placeholder"
  }
}
