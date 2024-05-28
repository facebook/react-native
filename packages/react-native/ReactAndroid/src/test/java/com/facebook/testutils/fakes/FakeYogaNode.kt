/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.testutils.fakes

import com.facebook.yoga.YogaAlign
import com.facebook.yoga.YogaBaselineFunction
import com.facebook.yoga.YogaConstants
import com.facebook.yoga.YogaDirection
import com.facebook.yoga.YogaDisplay
import com.facebook.yoga.YogaEdge
import com.facebook.yoga.YogaFlexDirection
import com.facebook.yoga.YogaGutter
import com.facebook.yoga.YogaJustify
import com.facebook.yoga.YogaMeasureFunction
import com.facebook.yoga.YogaNode
import com.facebook.yoga.YogaOverflow
import com.facebook.yoga.YogaPositionType
import com.facebook.yoga.YogaUnit
import com.facebook.yoga.YogaValue
import com.facebook.yoga.YogaWrap

/** A fake [YogaNode] that allows us to test Yoga without using the real JNI. */
class FakeYogaNode : YogaNode() {
  override fun setWidth(width: Float) = Unit

  override fun setWidthPercent(percent: Float) = Unit

  override fun setMinWidth(minWidth: Float) = Unit

  override fun setMinWidthPercent(percent: Float) = Unit

  override fun setMaxWidth(maxWidth: Float) = Unit

  override fun setMaxWidthPercent(percent: Float) = Unit

  override fun setWidthAuto() = Unit

  override fun setHeight(height: Float) = Unit

  override fun setHeightPercent(percent: Float) = Unit

  override fun setMinHeight(minHeight: Float) = Unit

  override fun setMinHeightPercent(percent: Float) = Unit

  override fun setMaxHeight(maxheight: Float) = Unit

  override fun setMaxHeightPercent(percent: Float) = Unit

  override fun setHeightAuto() = Unit

  override fun setMargin(edge: YogaEdge?, margin: Float) = Unit

  override fun setMarginPercent(edge: YogaEdge?, percent: Float) = Unit

  override fun setMarginAuto(edge: YogaEdge?) = Unit

  override fun setPadding(edge: YogaEdge?, padding: Float) = Unit

  override fun setPaddingPercent(edge: YogaEdge?, percent: Float) = Unit

  override fun setPositionType(positionType: YogaPositionType?) = Unit

  override fun setPosition(edge: YogaEdge?, position: Float) = Unit

  override fun setPositionPercent(edge: YogaEdge?, percent: Float) = Unit

  override fun setAlignContent(alignContent: YogaAlign?) = Unit

  override fun setAlignItems(alignItems: YogaAlign?) = Unit

  override fun setAlignSelf(alignSelf: YogaAlign?) = Unit

  override fun setFlex(flex: Float) = Unit

  override fun setFlexBasisAuto() = Unit

  override fun setFlexBasisPercent(percent: Float) = Unit

  override fun setFlexBasis(flexBasis: Float) = Unit

  override fun setFlexDirection(flexDirection: YogaFlexDirection?) = Unit

  override fun setFlexGrow(flexGrow: Float) = Unit

  override fun setFlexShrink(flexShrink: Float) = Unit

  override fun setJustifyContent(justifyContent: YogaJustify?) = Unit

  override fun setDirection(direction: YogaDirection?) = Unit

  override fun setBorder(edge: YogaEdge?, border: Float) = Unit

  override fun setWrap(flexWrap: YogaWrap?) = Unit

  override fun setAspectRatio(aspectRatio: Float) = Unit

  override fun setIsReferenceBaseline(isReferenceBaseline: Boolean) = Unit

  override fun setMeasureFunction(measureFunction: YogaMeasureFunction?) = Unit

  override fun setBaselineFunction(baselineFunction: YogaBaselineFunction?) = Unit

  override fun setAlwaysFormsContainingBlock(alwaysFormsContainingBlock: Boolean) = Unit

  override fun getWidth(): YogaValue = YogaValue(YogaConstants.UNDEFINED, YogaUnit.UNDEFINED)

  override fun getMinWidth(): YogaValue = YogaValue(YogaConstants.UNDEFINED, YogaUnit.UNDEFINED)

  override fun getMaxWidth(): YogaValue = YogaValue(YogaConstants.UNDEFINED, YogaUnit.UNDEFINED)

  override fun getHeight(): YogaValue = YogaValue(YogaConstants.UNDEFINED, YogaUnit.UNDEFINED)

  override fun getMinHeight(): YogaValue = YogaValue(YogaConstants.UNDEFINED, YogaUnit.UNDEFINED)

  override fun getMaxHeight(): YogaValue = YogaValue(YogaConstants.UNDEFINED, YogaUnit.UNDEFINED)

  override fun getStyleDirection(): YogaDirection = YogaDirection.INHERIT

  override fun getFlexDirection(): YogaFlexDirection = YogaFlexDirection.COLUMN

  override fun getJustifyContent(): YogaJustify = YogaJustify.FLEX_START

  override fun getAlignItems(): YogaAlign = YogaAlign.FLEX_START

  override fun getAlignSelf(): YogaAlign = YogaAlign.FLEX_START

  override fun getAlignContent(): YogaAlign = YogaAlign.FLEX_START

  override fun getPositionType(): YogaPositionType = YogaPositionType.RELATIVE

  override fun getFlexGrow(): Float = 0f

  override fun getFlexShrink(): Float = 0f

  override fun getFlexBasis(): YogaValue = YogaValue(YogaConstants.UNDEFINED, YogaUnit.UNDEFINED)

  override fun getAspectRatio(): Float = 0f

  override fun getMargin(edge: YogaEdge?): YogaValue =
      YogaValue(YogaConstants.UNDEFINED, YogaUnit.UNDEFINED)

  override fun getPadding(edge: YogaEdge?): YogaValue =
      YogaValue(YogaConstants.UNDEFINED, YogaUnit.UNDEFINED)

  override fun getPosition(edge: YogaEdge?): YogaValue =
      YogaValue(YogaConstants.UNDEFINED, YogaUnit.UNDEFINED)

  override fun getBorder(edge: YogaEdge?): Float = 0f

  override fun reset() {
    // no-op
  }

  override fun getChildCount(): Int = 0

  override fun getChildAt(i: Int): YogaNode = FakeYogaNode()

  override fun addChildAt(child: YogaNode?, i: Int) {
    // no-op
  }

  override fun isReferenceBaseline(): Boolean = false

  override fun removeChildAt(i: Int): YogaNode = FakeYogaNode()

  override fun getOwner(): YogaNode? = null

  @Deprecated("Deprecated in Java") override fun getParent(): YogaNode? = null

  override fun indexOf(child: YogaNode?): Int = 0

  override fun calculateLayout(width: Float, height: Float) {
    // no-op
  }

  override fun hasNewLayout(): Boolean = false

  override fun dirty() {
    // no-op
  }

  override fun isDirty(): Boolean = false

  override fun copyStyle(srcNode: YogaNode?) {
    // no-op
  }

  override fun markLayoutSeen() {
    // no-op
  }

  override fun getWrap(): YogaWrap = YogaWrap.WRAP

  override fun getOverflow(): YogaOverflow = YogaOverflow.HIDDEN

  override fun setOverflow(overflow: YogaOverflow?) {
    // no-op
  }

  override fun getDisplay(): YogaDisplay = YogaDisplay.NONE

  override fun setDisplay(display: YogaDisplay?) {
    // no-op
  }

  override fun getFlex(): Float = 0f

  override fun getGap(gutter: YogaGutter?): Float = 0f

  override fun setGap(gutter: YogaGutter?, gapLength: Float) {
    // no-op
  }

  override fun setGapPercent(gutter: YogaGutter?, gapLength: Float) {
    // no-op
  }

  override fun getLayoutX(): Float = 0f

  override fun getLayoutY(): Float = 0f

  override fun getLayoutWidth(): Float = 0f

  override fun getLayoutHeight(): Float = 0f

  override fun getLayoutMargin(edge: YogaEdge?): Float = 0f

  override fun getLayoutPadding(edge: YogaEdge?): Float = 0f

  override fun getLayoutBorder(edge: YogaEdge?): Float = 0f

  override fun getLayoutDirection(): YogaDirection = YogaDirection.INHERIT

  override fun isMeasureDefined(): Boolean = true

  override fun isBaselineDefined(): Boolean = true

  override fun setData(data: Any?) {
    // no-op
  }

  override fun getData(): Any? = null

  override fun cloneWithoutChildren(): YogaNode = FakeYogaNode()

  override fun cloneWithChildren(): YogaNode = FakeYogaNode()
}
