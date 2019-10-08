/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the LICENSE
 * file in the root directory of this source tree.
 */
package com.facebook.yoga;

import com.facebook.proguard.annotations.DoNotStrip;
import java.util.ArrayList;
import java.util.List;
import javax.annotation.Nullable;

@DoNotStrip
public abstract class YogaNodeJNIBase extends YogaNode implements Cloneable {

  /* Those flags needs be in sync with YGJNI.cpp */
  private static final byte MARGIN = 1;
  private static final byte PADDING = 2;
  private static final byte BORDER = 4;
  private static final byte DOES_LEGACY_STRETCH_BEHAVIOUR = 8;
  private static final byte HAS_NEW_LAYOUT = 16;

  private static final byte LAYOUT_EDGE_SET_FLAG_INDEX = 0;
  private static final byte LAYOUT_WIDTH_INDEX = 1;
  private static final byte LAYOUT_HEIGHT_INDEX = 2;
  private static final byte LAYOUT_LEFT_INDEX = 3;
  private static final byte LAYOUT_TOP_INDEX = 4;
  private static final byte LAYOUT_DIRECTION_INDEX = 5;
  private static final byte LAYOUT_MARGIN_START_INDEX = 6;
  private static final byte LAYOUT_PADDING_START_INDEX = 10;
  private static final byte LAYOUT_BORDER_START_INDEX = 14;

  @Nullable private YogaNodeJNIBase mOwner;
  @Nullable private List<YogaNodeJNIBase> mChildren;
  @Nullable private YogaMeasureFunction mMeasureFunction;
  @Nullable private YogaBaselineFunction mBaselineFunction;
  protected long mNativePointer;
  @Nullable private Object mData;

  @DoNotStrip
  private @Nullable float[] arr = null;

  @DoNotStrip
  private int mLayoutDirection = 0;

  private boolean mHasNewLayout = true;

  protected boolean useVanillaJNI = false;

  private YogaNodeJNIBase(long nativePointer) {
    if (nativePointer == 0) {
      throw new IllegalStateException("Failed to allocate native memory");
    }
    mNativePointer = nativePointer;
  }

  YogaNodeJNIBase() {
    this(YogaNative.jni_YGNodeNew());
  }

  YogaNodeJNIBase(YogaConfig config) {
    this(YogaNative.jni_YGNodeNewWithConfig(((YogaConfigJNIBase)config).mNativePointer));
    this.useVanillaJNI = config.useVanillaJNI();
  }

  public void reset() {
    mMeasureFunction = null;
    mBaselineFunction = null;
    mData = null;
    arr = null;
    mHasNewLayout = true;
    mLayoutDirection = 0;

    if (useVanillaJNI)
      YogaNative.jni_YGNodeResetJNI(mNativePointer);
    else
      YogaNative.jni_YGNodeReset(mNativePointer);
  }

  public int getChildCount() {
    return mChildren == null ? 0 : mChildren.size();
  }

  public YogaNodeJNIBase getChildAt(int i) {
    if (mChildren == null) {
      throw new IllegalStateException("YogaNode does not have children");
    }
    return mChildren.get(i);
  }

  public void addChildAt(YogaNode c, int i) {
    YogaNodeJNIBase child = (YogaNodeJNIBase) c;
    if (child.mOwner != null) {
      throw new IllegalStateException("Child already has a parent, it must be removed first.");
    }

    if (mChildren == null) {
      mChildren = new ArrayList<>(4);
    }
    mChildren.add(i, child);
    child.mOwner = this;
    if (useVanillaJNI)
      YogaNative.jni_YGNodeInsertChildJNI(mNativePointer, child.mNativePointer, i);
    else
      YogaNative.jni_YGNodeInsertChild(mNativePointer, child.mNativePointer, i);
  }

  public void setIsReferenceBaseline(boolean isReferenceBaseline) {
    if (useVanillaJNI)
      YogaNative.jni_YGNodeSetIsReferenceBaselineJNI(mNativePointer, isReferenceBaseline);
    else
      YogaNative.jni_YGNodeSetIsReferenceBaseline(mNativePointer, isReferenceBaseline);
  }

  public boolean isReferenceBaseline() {
    return useVanillaJNI ? YogaNative.jni_YGNodeIsReferenceBaselineJNI(mNativePointer) : YogaNative.jni_YGNodeIsReferenceBaseline(mNativePointer);
  }

  @Override
  public YogaNodeJNIBase cloneWithoutChildren() {
    try {
      YogaNodeJNIBase clonedYogaNode = (YogaNodeJNIBase) super.clone();
      long clonedNativePointer = useVanillaJNI ? YogaNative.jni_YGNodeCloneJNI(mNativePointer) : YogaNative.jni_YGNodeClone(mNativePointer);;
      clonedYogaNode.mOwner = null;
      clonedYogaNode.mNativePointer = clonedNativePointer;
      clonedYogaNode.clearChildren();
      return clonedYogaNode;
    } catch (CloneNotSupportedException ex) {
      // This class implements Cloneable, this should not happen
      throw new RuntimeException(ex);
    }
  }

  private void clearChildren() {
    mChildren = null;
    if (useVanillaJNI)
      YogaNative.jni_YGNodeClearChildrenJNI(mNativePointer);
    else
      YogaNative.jni_YGNodeClearChildren(mNativePointer);
  }

  public YogaNodeJNIBase removeChildAt(int i) {
    if (mChildren == null) {
      throw new IllegalStateException(
          "Trying to remove a child of a YogaNode that does not have children");
    }
    final YogaNodeJNIBase child = mChildren.remove(i);
    child.mOwner = null;
    if (useVanillaJNI)
      YogaNative.jni_YGNodeRemoveChildJNI(mNativePointer, child.mNativePointer);
    else
      YogaNative.jni_YGNodeRemoveChild(mNativePointer, child.mNativePointer);
    return child;
  }

  /**
   * @returns the {@link YogaNode} that owns this {@link YogaNode}.
   * The owner is used to identify the YogaTree that a {@link YogaNode} belongs
   * to.
   * This method will return the parent of the {@link YogaNode} when the
   * {@link YogaNode} only belongs to one YogaTree or null when the
   * {@link YogaNode} is shared between two or more YogaTrees.
   */
  @Nullable
  public YogaNodeJNIBase getOwner() {
    return mOwner;
  }

  /** @deprecated Use #getOwner() instead. This will be removed in the next version. */
  @Deprecated
  @Nullable
  public YogaNodeJNIBase getParent() {
    return getOwner();
  }

  public int indexOf(YogaNode child) {
    return mChildren == null ? -1 : mChildren.indexOf(child);
  }

  public void calculateLayout(float width, float height) {
    long[] nativePointers = null;
    YogaNodeJNIBase[] nodes = null;

    ArrayList<YogaNodeJNIBase> n = new ArrayList<>();
    n.add(this);
    for (int i = 0; i < n.size(); ++i) {
      List<YogaNodeJNIBase> children  = n.get(i).mChildren;
      if (children != null) {
        n.addAll(children);
      }
    }

    nodes = n.toArray(new YogaNodeJNIBase[n.size()]);
    nativePointers = new long[nodes.length];
    for (int i = 0; i < nodes.length; ++i) {
      nativePointers[i] = nodes[i].mNativePointer;
    }

    YogaNative.jni_YGNodeCalculateLayout(mNativePointer, width, height, nativePointers, nodes);
  }

  public void dirty() {
    if (useVanillaJNI)
      YogaNative.jni_YGNodeMarkDirtyJNI(mNativePointer);
    else
      YogaNative.jni_YGNodeMarkDirty(mNativePointer);
  }

  public void dirtyAllDescendants() {
    if (useVanillaJNI)
      YogaNative.jni_YGNodeMarkDirtyAndPropogateToDescendantsJNI(mNativePointer);
    else
      YogaNative.jni_YGNodeMarkDirtyAndPropogateToDescendants(mNativePointer);
  }

  public boolean isDirty() {
    return useVanillaJNI ? YogaNative.jni_YGNodeIsDirtyJNI(mNativePointer) : YogaNative.jni_YGNodeIsDirty(mNativePointer);
  }

  @Override
  public void copyStyle(YogaNode srcNode) {
    if (useVanillaJNI)
      YogaNative.jni_YGNodeCopyStyleJNI(mNativePointer, ((YogaNodeJNIBase) srcNode).mNativePointer);
    else
      YogaNative.jni_YGNodeCopyStyle(mNativePointer, ((YogaNodeJNIBase) srcNode).mNativePointer);
  }

  public YogaDirection getStyleDirection() {
    return YogaDirection.fromInt(useVanillaJNI ? YogaNative.jni_YGNodeStyleGetDirectionJNI(mNativePointer) : YogaNative.jni_YGNodeStyleGetDirection(mNativePointer));
  }

  public void setDirection(YogaDirection direction) {
    if (useVanillaJNI)
      YogaNative.jni_YGNodeStyleSetDirectionJNI(mNativePointer, direction.intValue());
    else
      YogaNative.jni_YGNodeStyleSetDirection(mNativePointer, direction.intValue());
  }

  public YogaFlexDirection getFlexDirection() {
    return YogaFlexDirection.fromInt(useVanillaJNI ? YogaNative.jni_YGNodeStyleGetFlexDirectionJNI(mNativePointer) : YogaNative.jni_YGNodeStyleGetFlexDirection(mNativePointer));
  }

  public void setFlexDirection(YogaFlexDirection flexDirection) {
    if (useVanillaJNI)
      YogaNative.jni_YGNodeStyleSetFlexDirectionJNI(mNativePointer, flexDirection.intValue());
    else
      YogaNative.jni_YGNodeStyleSetFlexDirection(mNativePointer, flexDirection.intValue());
  }

  public YogaJustify getJustifyContent() {
    return YogaJustify.fromInt(useVanillaJNI ? YogaNative.jni_YGNodeStyleGetJustifyContentJNI(mNativePointer) : YogaNative.jni_YGNodeStyleGetJustifyContent(mNativePointer));
  }

  public void setJustifyContent(YogaJustify justifyContent) {
    if (useVanillaJNI)
      YogaNative.jni_YGNodeStyleSetJustifyContentJNI(mNativePointer, justifyContent.intValue());
    else
      YogaNative.jni_YGNodeStyleSetJustifyContent(mNativePointer, justifyContent.intValue());
  }

  public YogaAlign getAlignItems() {
    return YogaAlign.fromInt(useVanillaJNI ? YogaNative.jni_YGNodeStyleGetAlignItemsJNI(mNativePointer) : YogaNative.jni_YGNodeStyleGetAlignItems(mNativePointer));
  }

  public void setAlignItems(YogaAlign alignItems) {
    if (useVanillaJNI)
      YogaNative.jni_YGNodeStyleSetAlignItemsJNI(mNativePointer, alignItems.intValue());
    else
      YogaNative.jni_YGNodeStyleSetAlignItems(mNativePointer, alignItems.intValue());
  }

  public YogaAlign getAlignSelf() {
    return YogaAlign.fromInt(useVanillaJNI ? YogaNative.jni_YGNodeStyleGetAlignSelfJNI(mNativePointer) : YogaNative.jni_YGNodeStyleGetAlignSelf(mNativePointer));
  }

  public void setAlignSelf(YogaAlign alignSelf) {
    if (useVanillaJNI)
      YogaNative.jni_YGNodeStyleSetAlignSelfJNI(mNativePointer, alignSelf.intValue());
    else
      YogaNative.jni_YGNodeStyleSetAlignSelf(mNativePointer, alignSelf.intValue());
  }

  public YogaAlign getAlignContent() {
    return YogaAlign.fromInt(useVanillaJNI ? YogaNative.jni_YGNodeStyleGetAlignContentJNI(mNativePointer) : YogaNative.jni_YGNodeStyleGetAlignContent(mNativePointer));
  }

  public void setAlignContent(YogaAlign alignContent) {
    if (useVanillaJNI)
      YogaNative.jni_YGNodeStyleSetAlignContentJNI(mNativePointer, alignContent.intValue());
    else
      YogaNative.jni_YGNodeStyleSetAlignContent(mNativePointer, alignContent.intValue());
  }

  public YogaPositionType getPositionType() {
    return YogaPositionType.fromInt(useVanillaJNI ? YogaNative.jni_YGNodeStyleGetPositionTypeJNI(mNativePointer) : YogaNative.jni_YGNodeStyleGetPositionType(mNativePointer));
  }

  public void setPositionType(YogaPositionType positionType) {
    if (useVanillaJNI)
      YogaNative.jni_YGNodeStyleSetPositionTypeJNI(mNativePointer, positionType.intValue());
    else
      YogaNative.jni_YGNodeStyleSetPositionType(mNativePointer, positionType.intValue());
  }

  public YogaWrap getWrap() {
    return YogaWrap.fromInt(useVanillaJNI ? YogaNative.jni_YGNodeStyleGetFlexWrapJNI(mNativePointer) : YogaNative.jni_YGNodeStyleGetFlexWrap(mNativePointer));
  }

  public void setWrap(YogaWrap flexWrap) {
    if (useVanillaJNI)
      YogaNative.jni_YGNodeStyleSetFlexWrapJNI(mNativePointer, flexWrap.intValue());
    else
      YogaNative.jni_YGNodeStyleSetFlexWrap(mNativePointer, flexWrap.intValue());
  }

  public YogaOverflow getOverflow() {
    return YogaOverflow.fromInt(useVanillaJNI ? YogaNative.jni_YGNodeStyleGetOverflowJNI(mNativePointer) : YogaNative.jni_YGNodeStyleGetOverflow(mNativePointer));
  }

  public void setOverflow(YogaOverflow overflow) {
    if (useVanillaJNI)
      YogaNative.jni_YGNodeStyleSetOverflowJNI(mNativePointer, overflow.intValue());
    else
      YogaNative.jni_YGNodeStyleSetOverflow(mNativePointer, overflow.intValue());
  }

  public YogaDisplay getDisplay() {
    return YogaDisplay.fromInt(useVanillaJNI ? YogaNative.jni_YGNodeStyleGetDisplayJNI(mNativePointer) : YogaNative.jni_YGNodeStyleGetDisplay(mNativePointer));
  }

  public void setDisplay(YogaDisplay display) {
    if (useVanillaJNI)
      YogaNative.jni_YGNodeStyleSetDisplayJNI(mNativePointer, display.intValue());
    else
      YogaNative.jni_YGNodeStyleSetDisplay(mNativePointer, display.intValue());
  }

  public float getFlex() {
    return useVanillaJNI ? YogaNative.jni_YGNodeStyleGetFlexJNI(mNativePointer) : YogaNative.jni_YGNodeStyleGetFlex(mNativePointer);
  }

  public void setFlex(float flex) {
    if (useVanillaJNI) {
      YogaNative.jni_YGNodeStyleSetFlexJNI(mNativePointer, flex);
    } else {
      YogaNative.jni_YGNodeStyleSetFlex(mNativePointer, flex);
    }
  }

  public float getFlexGrow() {
    return useVanillaJNI ? YogaNative.jni_YGNodeStyleGetFlexGrowJNI(mNativePointer) : YogaNative.jni_YGNodeStyleGetFlexGrow(mNativePointer);
  }

  public void setFlexGrow(float flexGrow) {
    if (useVanillaJNI)
      YogaNative.jni_YGNodeStyleSetFlexGrowJNI(mNativePointer, flexGrow);
    else
      YogaNative.jni_YGNodeStyleSetFlexGrow(mNativePointer, flexGrow);
  }

  public float getFlexShrink() {
    return useVanillaJNI ? YogaNative.jni_YGNodeStyleGetFlexShrinkJNI(mNativePointer) : YogaNative.jni_YGNodeStyleGetFlexShrink(mNativePointer);
  }

  public void setFlexShrink(float flexShrink) {
    if (useVanillaJNI)
      YogaNative.jni_YGNodeStyleSetFlexShrinkJNI(mNativePointer, flexShrink);
    else
      YogaNative.jni_YGNodeStyleSetFlexShrink(mNativePointer, flexShrink);
  }

  public YogaValue getFlexBasis() {
    return valueFromLong(useVanillaJNI ? YogaNative.jni_YGNodeStyleGetFlexBasisJNI(mNativePointer) : YogaNative.jni_YGNodeStyleGetFlexBasis(mNativePointer));
  }

  public void setFlexBasis(float flexBasis) {
    if (useVanillaJNI)
      YogaNative.jni_YGNodeStyleSetFlexBasisJNI(mNativePointer, flexBasis);
    else
      YogaNative.jni_YGNodeStyleSetFlexBasis(mNativePointer, flexBasis);
  }

  public void setFlexBasisPercent(float percent) {
    if (useVanillaJNI)
      YogaNative.jni_YGNodeStyleSetFlexBasisPercentJNI(mNativePointer, percent);
    else
      YogaNative.jni_YGNodeStyleSetFlexBasisPercent(mNativePointer, percent);
  }

  public void setFlexBasisAuto() {
    if (useVanillaJNI)
      YogaNative.jni_YGNodeStyleSetFlexBasisAutoJNI(mNativePointer);
    else
      YogaNative.jni_YGNodeStyleSetFlexBasisAuto(mNativePointer);
  }

  public YogaValue getMargin(YogaEdge edge) {
    return valueFromLong(useVanillaJNI ? YogaNative.jni_YGNodeStyleGetMarginJNI(mNativePointer, edge.intValue()) : YogaNative.jni_YGNodeStyleGetMargin(mNativePointer, edge.intValue()));
  }

  public void setMargin(YogaEdge edge, float margin) {
    if (useVanillaJNI)
      YogaNative.jni_YGNodeStyleSetMarginJNI(mNativePointer, edge.intValue(), margin);
    else
      YogaNative.jni_YGNodeStyleSetMargin(mNativePointer, edge.intValue(), margin);
  }

  public void setMarginPercent(YogaEdge edge, float percent) {
    if (useVanillaJNI)
      YogaNative.jni_YGNodeStyleSetMarginPercentJNI(mNativePointer, edge.intValue(), percent);
    else
      YogaNative.jni_YGNodeStyleSetMarginPercent(mNativePointer, edge.intValue(), percent);
  }

  public void setMarginAuto(YogaEdge edge) {
    if (useVanillaJNI)
      YogaNative.jni_YGNodeStyleSetMarginAutoJNI(mNativePointer, edge.intValue());
    else
      YogaNative.jni_YGNodeStyleSetMarginAuto(mNativePointer, edge.intValue());
  }

  public YogaValue getPadding(YogaEdge edge) {
    return valueFromLong(useVanillaJNI ? YogaNative.jni_YGNodeStyleGetPaddingJNI(mNativePointer, edge.intValue()) : YogaNative.jni_YGNodeStyleGetPadding(mNativePointer, edge.intValue()));
  }

  public void setPadding(YogaEdge edge, float padding) {
    if (useVanillaJNI)
      YogaNative.jni_YGNodeStyleSetPaddingJNI(mNativePointer, edge.intValue(), padding);
    else
      YogaNative.jni_YGNodeStyleSetPadding(mNativePointer, edge.intValue(), padding);
  }

  public void setPaddingPercent(YogaEdge edge, float percent) {
    if (useVanillaJNI)
      YogaNative.jni_YGNodeStyleSetPaddingPercentJNI(mNativePointer, edge.intValue(), percent);
    else
      YogaNative.jni_YGNodeStyleSetPaddingPercent(mNativePointer, edge.intValue(), percent);
  }

  public float getBorder(YogaEdge edge) {
    return useVanillaJNI ? YogaNative.jni_YGNodeStyleGetBorderJNI(mNativePointer, edge.intValue()) : YogaNative.jni_YGNodeStyleGetBorder(mNativePointer, edge.intValue());
  }

  public void setBorder(YogaEdge edge, float border) {
    if (useVanillaJNI)
      YogaNative.jni_YGNodeStyleSetBorderJNI(mNativePointer, edge.intValue(), border);
    else
      YogaNative.jni_YGNodeStyleSetBorder(mNativePointer, edge.intValue(), border);
  }

  public YogaValue getPosition(YogaEdge edge) {
    return valueFromLong(useVanillaJNI ? YogaNative.jni_YGNodeStyleGetPositionJNI(mNativePointer, edge.intValue()) : YogaNative.jni_YGNodeStyleGetPosition(mNativePointer, edge.intValue()));
  }

  public void setPosition(YogaEdge edge, float position) {
    if (useVanillaJNI)
      YogaNative.jni_YGNodeStyleSetPositionJNI(mNativePointer, edge.intValue(), position);
    else
      YogaNative.jni_YGNodeStyleSetPosition(mNativePointer, edge.intValue(), position);
  }

  public void setPositionPercent(YogaEdge edge, float percent) {
    if (useVanillaJNI)
      YogaNative.jni_YGNodeStyleSetPositionPercentJNI(mNativePointer, edge.intValue(), percent);
    else
      YogaNative.jni_YGNodeStyleSetPositionPercent(mNativePointer, edge.intValue(), percent);
  }

  public YogaValue getWidth() {
    return valueFromLong(useVanillaJNI ? YogaNative.jni_YGNodeStyleGetWidthJNI(mNativePointer) : YogaNative.jni_YGNodeStyleGetWidth(mNativePointer));
  }

  public void setWidth(float width) {
    if (useVanillaJNI)
      YogaNative.jni_YGNodeStyleSetWidthJNI(mNativePointer, width);
    else
      YogaNative.jni_YGNodeStyleSetWidth(mNativePointer, width);
  }

  public void setWidthPercent(float percent) {
    if (useVanillaJNI)
      YogaNative.jni_YGNodeStyleSetWidthPercentJNI(mNativePointer, percent);
    else
      YogaNative.jni_YGNodeStyleSetWidthPercent(mNativePointer, percent);
  }

  public void setWidthAuto() {
    if (useVanillaJNI)
      YogaNative.jni_YGNodeStyleSetWidthAutoJNI(mNativePointer);
    else
      YogaNative.jni_YGNodeStyleSetWidthAuto(mNativePointer);
  }

  public YogaValue getHeight() {
    return valueFromLong(useVanillaJNI ? YogaNative.jni_YGNodeStyleGetHeightJNI(mNativePointer) : YogaNative.jni_YGNodeStyleGetHeight(mNativePointer));
  }

  public void setHeight(float height) {
    if (useVanillaJNI)
      YogaNative.jni_YGNodeStyleSetHeightJNI(mNativePointer, height);
    else
      YogaNative.jni_YGNodeStyleSetHeight(mNativePointer, height);
  }

  public void setHeightPercent(float percent) {
    if (useVanillaJNI)
      YogaNative.jni_YGNodeStyleSetHeightPercentJNI(mNativePointer, percent);
    else
      YogaNative.jni_YGNodeStyleSetHeightPercent(mNativePointer, percent);
  }

  public void setHeightAuto() {
    if (useVanillaJNI)
      YogaNative.jni_YGNodeStyleSetHeightAutoJNI(mNativePointer);
    else
      YogaNative.jni_YGNodeStyleSetHeightAuto(mNativePointer);
  }

  public YogaValue getMinWidth() {
    return valueFromLong(useVanillaJNI ? YogaNative.jni_YGNodeStyleGetMinWidthJNI(mNativePointer) : YogaNative.jni_YGNodeStyleGetMinWidth(mNativePointer));
  }

  public void setMinWidth(float minWidth) {
    if (useVanillaJNI)
      YogaNative.jni_YGNodeStyleSetMinWidthJNI(mNativePointer, minWidth);
    else
      YogaNative.jni_YGNodeStyleSetMinWidth(mNativePointer, minWidth);
  }

  public void setMinWidthPercent(float percent) {
    if (useVanillaJNI)
      YogaNative.jni_YGNodeStyleSetMinWidthPercentJNI(mNativePointer, percent);
    else
      YogaNative.jni_YGNodeStyleSetMinWidthPercent(mNativePointer, percent);
  }

  public YogaValue getMinHeight() {
    return valueFromLong(useVanillaJNI ? YogaNative.jni_YGNodeStyleGetMinHeightJNI(mNativePointer) : YogaNative.jni_YGNodeStyleGetMinHeight(mNativePointer));
  }

  public void setMinHeight(float minHeight) {
    if (useVanillaJNI)
      YogaNative.jni_YGNodeStyleSetMinHeightJNI(mNativePointer, minHeight);
    else
      YogaNative.jni_YGNodeStyleSetMinHeight(mNativePointer, minHeight);
  }

  public void setMinHeightPercent(float percent) {
    if (useVanillaJNI)
      YogaNative.jni_YGNodeStyleSetMinHeightPercentJNI(mNativePointer, percent);
    else
      YogaNative.jni_YGNodeStyleSetMinHeightPercent(mNativePointer, percent);
  }

  public YogaValue getMaxWidth() {
    return valueFromLong(useVanillaJNI ? YogaNative.jni_YGNodeStyleGetMaxWidthJNI(mNativePointer) : YogaNative.jni_YGNodeStyleGetMaxWidth(mNativePointer));
  }

  public void setMaxWidth(float maxWidth) {
    if (useVanillaJNI)
      YogaNative.jni_YGNodeStyleSetMaxWidthJNI(mNativePointer, maxWidth);
    else
      YogaNative.jni_YGNodeStyleSetMaxWidth(mNativePointer, maxWidth);
  }

  public void setMaxWidthPercent(float percent) {
    if (useVanillaJNI)
      YogaNative.jni_YGNodeStyleSetMaxWidthPercentJNI(mNativePointer, percent);
    else
      YogaNative.jni_YGNodeStyleSetMaxWidthPercent(mNativePointer, percent);
  }

  public YogaValue getMaxHeight() {
    return valueFromLong(useVanillaJNI ? YogaNative.jni_YGNodeStyleGetMaxHeightJNI(mNativePointer) : YogaNative.jni_YGNodeStyleGetMaxHeight(mNativePointer));
  }

  public void setMaxHeight(float maxheight) {
    if (useVanillaJNI)
      YogaNative.jni_YGNodeStyleSetMaxHeightJNI(mNativePointer, maxheight);
    else
      YogaNative.jni_YGNodeStyleSetMaxHeight(mNativePointer, maxheight);
  }

  public void setMaxHeightPercent(float percent) {
    if (useVanillaJNI)
      YogaNative.jni_YGNodeStyleSetMaxHeightPercentJNI(mNativePointer, percent);
    else
      YogaNative.jni_YGNodeStyleSetMaxHeightPercent(mNativePointer, percent);
  }

  public float getAspectRatio() {
    return useVanillaJNI ? YogaNative.jni_YGNodeStyleGetAspectRatioJNI(mNativePointer) : YogaNative.jni_YGNodeStyleGetAspectRatio(mNativePointer);
  }

  public void setAspectRatio(float aspectRatio) {
    if (useVanillaJNI)
      YogaNative.jni_YGNodeStyleSetAspectRatioJNI(mNativePointer, aspectRatio);
    else
      YogaNative.jni_YGNodeStyleSetAspectRatio(mNativePointer, aspectRatio);
  }

  public void setMeasureFunction(YogaMeasureFunction measureFunction) {
    mMeasureFunction = measureFunction;
    YogaNative.jni_YGNodeSetHasMeasureFunc(mNativePointer, measureFunction != null);
  }

  // Implementation Note: Why this method needs to stay final
  //
  // We cache the jmethodid for this method in Yoga code. This means that even if a subclass
  // were to override measure, we'd still call this implementation from layout code since the
  // overriding method will have a different jmethodid. This is final to prevent that mistake.
  @DoNotStrip
  public final long measure(float width, int widthMode, float height, int heightMode) {
    if (!isMeasureDefined()) {
      throw new RuntimeException("Measure function isn't defined!");
    }

    return mMeasureFunction.measure(
        this,
        width,
        YogaMeasureMode.fromInt(widthMode),
        height,
        YogaMeasureMode.fromInt(heightMode));
  }

  public void setBaselineFunction(YogaBaselineFunction baselineFunction) {
    mBaselineFunction = baselineFunction;
    YogaNative.jni_YGNodeSetHasBaselineFunc(mNativePointer, baselineFunction != null);
  }

  @DoNotStrip
  public final float baseline(float width, float height) {
    return mBaselineFunction.baseline(this, width, height);
  }

  public boolean isMeasureDefined() {
    return mMeasureFunction != null;
  }

  @Override
  public boolean isBaselineDefined() {
    return mBaselineFunction != null;
  }

  public void setData(Object data) {
    mData = data;
  }

  @Override
  public @Nullable Object getData() {
    return mData;
  }

  /**
   * Use the set logger (defaults to adb log) to print out the styles, children, and computed
   * layout of the tree rooted at this node.
   */
  public void print() {
    if (useVanillaJNI)
      YogaNative.jni_YGNodePrintJNI(mNativePointer);
    else
      YogaNative.jni_YGNodePrint(mNativePointer);
  }

  public void setStyleInputs(float[] styleInputsArray, int size) {
    if (useVanillaJNI)
      YogaNative.jni_YGNodeSetStyleInputsJNI(mNativePointer, styleInputsArray, size);
    else
      YogaNative.jni_YGNodeSetStyleInputs(mNativePointer, styleInputsArray, size);
  }

  /**
   * This method replaces the child at childIndex position with the newNode received by parameter.
   * This is different than calling removeChildAt and addChildAt because this method ONLY replaces
   * the child in the mChildren datastructure. @DoNotStrip: called from JNI
   *
   * @return the nativePointer of the newNode {@linl YogaNode}
   */
  @DoNotStrip
  private final long replaceChild(YogaNodeJNIBase newNode, int childIndex) {
    if (mChildren == null) {
      throw new IllegalStateException("Cannot replace child. YogaNode does not have children");
    }
    mChildren.remove(childIndex);
    mChildren.add(childIndex, newNode);
    newNode.mOwner = this;
    return newNode.mNativePointer;
  }

  private static YogaValue valueFromLong(long raw) {
    return new YogaValue(Float.intBitsToFloat((int) raw), (int) (raw >> 32));
  }

  @Override
  public float getLayoutX() {
    return arr != null ? arr[LAYOUT_LEFT_INDEX] : 0;
  }

  @Override
  public float getLayoutY() {
    return arr != null ? arr[LAYOUT_TOP_INDEX] : 0;
  }

  @Override
  public float getLayoutWidth() {
    return arr != null ? arr[LAYOUT_WIDTH_INDEX] : 0;
  }

  @Override
  public float getLayoutHeight() {
    return arr != null ? arr[LAYOUT_HEIGHT_INDEX] : 0;
  }

  public boolean getDoesLegacyStretchFlagAffectsLayout() {
    return arr != null && (((int) arr[LAYOUT_EDGE_SET_FLAG_INDEX] & DOES_LEGACY_STRETCH_BEHAVIOUR) == DOES_LEGACY_STRETCH_BEHAVIOUR);
  }

  @Override
  public float getLayoutMargin(YogaEdge edge) {
    if (arr != null && ((int) arr[LAYOUT_EDGE_SET_FLAG_INDEX] & MARGIN) == MARGIN) {
      switch (edge) {
        case LEFT:
          return arr[LAYOUT_MARGIN_START_INDEX];
        case TOP:
          return arr[LAYOUT_MARGIN_START_INDEX + 1];
        case RIGHT:
          return arr[LAYOUT_MARGIN_START_INDEX + 2];
        case BOTTOM:
          return arr[LAYOUT_MARGIN_START_INDEX + 3];
        case START:
          return getLayoutDirection() == YogaDirection.RTL ? arr[LAYOUT_MARGIN_START_INDEX + 2] : arr[LAYOUT_MARGIN_START_INDEX];
        case END:
          return getLayoutDirection() == YogaDirection.RTL ? arr[LAYOUT_MARGIN_START_INDEX] : arr[LAYOUT_MARGIN_START_INDEX + 2];
        default:
          throw new IllegalArgumentException("Cannot get layout margins of multi-edge shorthands");
      }
    } else {
      return 0;
    }
  }

  @Override
  public float getLayoutPadding(YogaEdge edge) {
    if (arr != null && ((int) arr[LAYOUT_EDGE_SET_FLAG_INDEX] & PADDING) == PADDING) {
      int paddingStartIndex = LAYOUT_PADDING_START_INDEX - ((((int)arr[LAYOUT_EDGE_SET_FLAG_INDEX] & MARGIN) == MARGIN) ? 0 : 4);
      switch (edge) {
        case LEFT:
          return arr[paddingStartIndex];
        case TOP:
          return arr[paddingStartIndex + 1];
        case RIGHT:
          return arr[paddingStartIndex + 2];
        case BOTTOM:
          return arr[paddingStartIndex + 3];
        case START:
          return getLayoutDirection() == YogaDirection.RTL ? arr[paddingStartIndex + 2] : arr[paddingStartIndex];
        case END:
          return getLayoutDirection() == YogaDirection.RTL ? arr[paddingStartIndex] : arr[paddingStartIndex + 2];
        default:
          throw new IllegalArgumentException("Cannot get layout paddings of multi-edge shorthands");
      }
    } else {
      return 0;
    }
  }

  @Override
  public float getLayoutBorder(YogaEdge edge) {
    if (arr != null && ((int) arr[LAYOUT_EDGE_SET_FLAG_INDEX] & BORDER) == BORDER) {
      int borderStartIndex = LAYOUT_BORDER_START_INDEX - ((((int) arr[LAYOUT_EDGE_SET_FLAG_INDEX] & MARGIN) == MARGIN) ? 0 : 4) - ((((int) arr[LAYOUT_EDGE_SET_FLAG_INDEX] & PADDING) == PADDING) ? 0 : 4);
      switch (edge) {
        case LEFT:
          return arr[borderStartIndex];
        case TOP:
          return arr[borderStartIndex + 1];
        case RIGHT:
          return arr[borderStartIndex + 2];
        case BOTTOM:
          return arr[borderStartIndex + 3];
        case START:
          return getLayoutDirection() == YogaDirection.RTL ? arr[borderStartIndex + 2] : arr[borderStartIndex];
        case END:
          return getLayoutDirection() == YogaDirection.RTL ? arr[borderStartIndex] : arr[borderStartIndex + 2];
        default:
          throw new IllegalArgumentException("Cannot get layout border of multi-edge shorthands");
      }
    } else {
      return 0;
    }
  }

  @Override
  public YogaDirection getLayoutDirection() {
    return YogaDirection.fromInt(arr != null ? (int) arr[LAYOUT_DIRECTION_INDEX] : mLayoutDirection);
  }

  @Override
  public boolean hasNewLayout() {
    if (arr != null) {
      return (((int) arr[LAYOUT_EDGE_SET_FLAG_INDEX]) & HAS_NEW_LAYOUT) == HAS_NEW_LAYOUT;
    } else {
      return mHasNewLayout;
    }
  }

  @Override
  public void markLayoutSeen() {
    if (arr != null) {
      arr[LAYOUT_EDGE_SET_FLAG_INDEX] = ((int) arr[LAYOUT_EDGE_SET_FLAG_INDEX]) & ~(HAS_NEW_LAYOUT);
    }
    mHasNewLayout = false;
  }
}
