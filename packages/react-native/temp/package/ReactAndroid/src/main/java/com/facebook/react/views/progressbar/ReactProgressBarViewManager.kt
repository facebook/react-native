/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.progressbar

import android.content.Context
import android.util.Pair
import android.view.View
import android.widget.ProgressBar
import com.facebook.common.logging.FLog
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.common.ReactConstants
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.uimanager.BaseViewManager
import com.facebook.react.uimanager.PixelUtil.toDIPFromPixel
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.ViewManagerDelegate
import com.facebook.react.uimanager.ViewProps
import com.facebook.react.uimanager.annotations.ReactProp
import com.facebook.react.viewmanagers.AndroidProgressBarManagerDelegate
import com.facebook.react.viewmanagers.AndroidProgressBarManagerInterface
import com.facebook.yoga.YogaMeasureMode
import com.facebook.yoga.YogaMeasureOutput
import java.util.WeakHashMap

/**
 * Manages instances of [ProgressBar]. [ProgressBar] is wrapped in a [ProgressBarContainerView]
 * because the style of the [ProgressBar] can only be set in the constructor, whenever the style of
 * a [ProgressBar] changes, we have to drop the existing [ProgressBar] (if there is one) and create
 * a new one with the style given.
 */
@ReactModule(name = ReactProgressBarViewManager.REACT_CLASS)
public class ReactProgressBarViewManager :
    BaseViewManager<ProgressBarContainerView, ProgressBarShadowNode>(),
    AndroidProgressBarManagerInterface<ProgressBarContainerView> {
  private val measuredStyles = WeakHashMap<Int, Pair<Int, Int>>()

  private val delegate: ViewManagerDelegate<ProgressBarContainerView> =
      AndroidProgressBarManagerDelegate(this)

  public override fun getName(): String = REACT_CLASS

  protected override fun createViewInstance(context: ThemedReactContext): ProgressBarContainerView {
    return ProgressBarContainerView(context)
  }

  @ReactProp(name = PROP_STYLE)
  public override fun setStyleAttr(view: ProgressBarContainerView, styleName: String?) {
    view.setStyle(styleName)
  }

  @ReactProp(name = ViewProps.COLOR, customType = "Color")
  public override fun setColor(view: ProgressBarContainerView, color: Int?) {
    view.color = color
  }

  @ReactProp(name = PROP_INDETERMINATE)
  public override fun setIndeterminate(view: ProgressBarContainerView, indeterminate: Boolean) {
    view.indeterminate = indeterminate
  }

  @ReactProp(name = PROP_PROGRESS)
  public override fun setProgress(view: ProgressBarContainerView, progress: Double) {
    view.progress = progress
  }

  @ReactProp(name = PROP_ANIMATING)
  public override fun setAnimating(view: ProgressBarContainerView, animating: Boolean) {
    view.animating = animating
  }

  public override fun setTestID(view: ProgressBarContainerView, value: String?) {
    super.setTestId(view, value)
  }

  @ReactProp(name = PROP_ATTR)
  public override fun setTypeAttr(view: ProgressBarContainerView, value: String?): Unit = Unit

  public override fun createShadowNodeInstance(): ProgressBarShadowNode = ProgressBarShadowNode()

  public override fun getShadowNodeClass(): Class<ProgressBarShadowNode> =
      ProgressBarShadowNode::class.java

  public override fun updateExtraData(root: ProgressBarContainerView, extraData: Any) {
    // do nothing
  }

  protected override fun onAfterUpdateTransaction(view: ProgressBarContainerView) {
    view.apply()
  }

  protected override fun getDelegate(): ViewManagerDelegate<ProgressBarContainerView> = delegate

  public override fun measure(
      context: Context,
      localData: ReadableMap,
      props: ReadableMap,
      state: ReadableMap,
      width: Float,
      widthMode: YogaMeasureMode,
      height: Float,
      heightMode: YogaMeasureMode,
      attachmentsPositions: FloatArray?
  ): Long {
    val style = getStyleFromString(props.getString(PROP_STYLE))
    val value =
        measuredStyles.getOrPut(style) {
          val progressBar = createProgressBar(context, style)
          val spec = View.MeasureSpec.makeMeasureSpec(0, View.MeasureSpec.UNSPECIFIED)
          progressBar.measure(spec, spec)
          Pair.create(progressBar.measuredWidth, progressBar.measuredHeight)
        }

    return YogaMeasureOutput.make(
        toDIPFromPixel(value.first.toFloat()), toDIPFromPixel(value.second.toFloat()))
  }

  public companion object {
    public const val REACT_CLASS: String = "AndroidProgressBar"

    internal const val PROP_STYLE: String = "styleAttr"
    internal const val PROP_ATTR: String = "typeAttr"
    internal const val PROP_INDETERMINATE: String = "indeterminate"
    internal const val PROP_PROGRESS: String = "progress"
    internal const val PROP_ANIMATING: String = "animating"
    internal const val DEFAULT_STYLE: String = "Normal"

    private val progressBarCtorLock = Any()

    /**
     * We create ProgressBars on both the UI and shadow threads. There is a race condition in the
     * ProgressBar constructor that may cause crashes when two ProgressBars are constructed at the
     * same time on two different threads. This static ctor wrapper protects against that.
     */
    public fun createProgressBar(context: Context?, style: Int): ProgressBar {
      synchronized(progressBarCtorLock) {
        return ProgressBar(context, null, style)
      }
    }

    internal fun getStyleFromString(styleStr: String?): Int {
      when (styleStr) {
        null -> {
          FLog.w(ReactConstants.TAG, "ProgressBar needs to have a style, null received")
          return android.R.attr.progressBarStyle
        }
        "Horizontal" -> return android.R.attr.progressBarStyleHorizontal
        "Small" -> return android.R.attr.progressBarStyleSmall
        "Large" -> return android.R.attr.progressBarStyleLarge
        "Inverse" -> return android.R.attr.progressBarStyleInverse
        "SmallInverse" -> return android.R.attr.progressBarStyleSmallInverse
        "LargeInverse" -> return android.R.attr.progressBarStyleLargeInverse
        "Normal" -> return android.R.attr.progressBarStyle
        else -> {
          FLog.w(ReactConstants.TAG, "Unknown ProgressBar style: $styleStr")
          return android.R.attr.progressBarStyle
        }
      }
    }
  }
}
