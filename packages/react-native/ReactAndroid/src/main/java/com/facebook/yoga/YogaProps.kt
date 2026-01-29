/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.yoga

public interface YogaProps {

  /* Width properties */

  public fun setWidth(width: Float)

  public fun setWidthPercent(percent: Float)

  public fun setWidthAuto()

  public fun setWidthMaxContent()

  public fun setWidthFitContent()

  public fun setWidthStretch()

  public fun setMinWidth(minWidth: Float)

  public fun setMinWidthPercent(percent: Float)

  public fun setMinWidthMaxContent()

  public fun setMinWidthFitContent()

  public fun setMinWidthStretch()

  public fun setMaxWidth(maxWidth: Float)

  public fun setMaxWidthPercent(percent: Float)

  public fun setMaxWidthMaxContent()

  public fun setMaxWidthFitContent()

  public fun setMaxWidthStretch()

  /* Height properties */

  public fun setHeight(height: Float)

  public fun setHeightPercent(percent: Float)

  public fun setHeightAuto()

  public fun setHeightMaxContent()

  public fun setHeightFitContent()

  public fun setHeightStretch()

  public fun setMinHeight(minHeight: Float)

  public fun setMinHeightPercent(percent: Float)

  public fun setMinHeightMaxContent()

  public fun setMinHeightFitContent()

  public fun setMinHeightStretch()

  public fun setMaxHeight(maxHeight: Float)

  public fun setMaxHeightPercent(percent: Float)

  public fun setMaxHeightMaxContent()

  public fun setMaxHeightFitContent()

  public fun setMaxHeightStretch()

  /* Margin properties */

  public fun setMargin(edge: YogaEdge, margin: Float)

  public fun setMarginPercent(edge: YogaEdge, percent: Float)

  public fun setMarginAuto(edge: YogaEdge)

  /* Padding properties */

  public fun setPadding(edge: YogaEdge, padding: Float)

  public fun setPaddingPercent(edge: YogaEdge, percent: Float)

  /* Position properties */

  public fun setPositionType(positionType: YogaPositionType)

  public fun setPosition(edge: YogaEdge, position: Float)

  public fun setPositionPercent(edge: YogaEdge, percent: Float)

  /* Alignment properties */

  public fun setAlignContent(alignContent: YogaAlign)

  public fun setAlignItems(alignItems: YogaAlign)

  public fun setAlignSelf(alignSelf: YogaAlign)

  /* Flex properties */

  public fun setFlex(flex: Float)

  public fun setFlexBasisAuto()

  public fun setFlexBasisPercent(percent: Float)

  public fun setFlexBasis(flexBasis: Float)

  public fun setFlexBasisMaxContent()

  public fun setFlexBasisFitContent()

  public fun setFlexBasisStretch()

  public fun setFlexDirection(direction: YogaFlexDirection)

  public fun setFlexGrow(flexGrow: Float)

  public fun setFlexShrink(flexShrink: Float)

  /* Other properties */

  public fun setJustifyContent(justifyContent: YogaJustify)

  public fun setDirection(direction: YogaDirection)

  public fun setBorder(edge: YogaEdge, value: Float)

  public fun setWrap(wrap: YogaWrap)

  public fun setAspectRatio(aspectRatio: Float)

  public fun setIsReferenceBaseline(isReferenceBaseline: Boolean)

  public fun setMeasureFunction(measureFunction: YogaMeasureFunction)

  public fun setBaselineFunction(yogaBaselineFunction: YogaBaselineFunction)

  public fun setBoxSizing(boxSizing: YogaBoxSizing)

  /* Getters */

  public fun getWidth(): YogaValue

  public fun getMinWidth(): YogaValue

  public fun getMaxWidth(): YogaValue

  public fun getHeight(): YogaValue

  public fun getMinHeight(): YogaValue

  public fun getMaxHeight(): YogaValue

  public fun getStyleDirection(): YogaDirection

  public fun getFlexDirection(): YogaFlexDirection

  public fun getJustifyContent(): YogaJustify

  public fun getAlignItems(): YogaAlign

  public fun getAlignSelf(): YogaAlign

  public fun getAlignContent(): YogaAlign

  public fun getPositionType(): YogaPositionType

  public fun getFlexGrow(): Float

  public fun getFlexShrink(): Float

  public fun getFlexBasis(): YogaValue

  public fun getAspectRatio(): Float

  public fun getMargin(edge: YogaEdge): YogaValue

  public fun getPadding(edge: YogaEdge): YogaValue

  public fun getPosition(edge: YogaEdge): YogaValue

  public fun getBorder(edge: YogaEdge): Float

  public fun getBoxSizing(): YogaBoxSizing
}
