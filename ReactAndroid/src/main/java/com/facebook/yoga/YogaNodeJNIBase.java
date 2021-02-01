/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.yoga;

import com.facebook.proguard.annotations.DoNotStrip;
import java.util.ArrayList;
import java.util.List;
import javax.annotation.Nullable;

@DoNotStrip
public abstract class YogaNodeJNIBase extends YogaNode implements Cloneable {

  /* Those flags needs be in sync with YGJNI.h */
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

  @DoNotStrip private @Nullable float[] arr = null;

  @DoNotStrip private int mLayoutDirection = 0;

  private boolean mHasNewLayout = true;

  private YogaNodeJNIBase(long nativePointer) {
    if (nativePointer == 0) {
      throw new IllegalStateException("Failed to allocate native memory");
    }
    mNativePointer = nativePointer;
  }

  YogaNodeJNIBase() {
    this(YogaNative.jni_YGNodeNewJNI());
  }

  YogaNodeJNIBase(YogaConfig config) {
    this(YogaNative.jni_YGNodeNewWithConfigJNI(((YogaConfigJNIBase) config).mNativePointer));
  }

  public void reset() {
    mMeasureFunction = null;
    mBaselineFunction = null;
    mData = null;
    arr = null;
    mHasNewLayout = true;
    mLayoutDirection = 0;

    YogaNative.jni_YGNodeResetJNI(mNativePointer);
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
    YogaNative.jni_YGNodeInsertChildJNI(mNativePointer, child.mNativePointer, i);
  }

  public void setIsReferenceBaseline(boolean isReferenceBaseline) {
    YogaNative.jni_YGNodeSetIsReferenceBaselineJNI(mNativePointer, isReferenceBaseline);
  }

  public boolean isReferenceBaseline() {
    return YogaNative.jni_YGNodeIsReferenceBaselineJNI(mNativePointer);
  }

  public void swapChildAt(YogaNode newChild, int position) {
    YogaNodeJNIBase child = (YogaNodeJNIBase) newChild;
    mChildren.remove(position);
    mChildren.add(position, child);
    child.mOwner = this;
    YogaNative.jni_YGNodeSwapChildJNI(mNativePointer, child.mNativePointer, position);
  }

  @Override
  public YogaNodeJNIBase cloneWithChildren() {
    try {
      YogaNodeJNIBase clonedYogaNode = (YogaNodeJNIBase) super.clone();
      if (clonedYogaNode.mChildren != null) {
        clonedYogaNode.mChildren = new ArrayList<>(clonedYogaNode.mChildren);
      }
      long clonedNativePointer = YogaNative.jni_YGNodeCloneJNI(mNativePointer);
      clonedYogaNode.mOwner = null;
      clonedYogaNode.mNativePointer = clonedNativePointer;
      for (int i = 0; i < clonedYogaNode.getChildCount(); i++) {
        clonedYogaNode.swapChildAt(clonedYogaNode.getChildAt(i).cloneWithChildren(), i);
      }

      return clonedYogaNode;
    } catch (CloneNotSupportedException ex) {
      // This class implements Cloneable, this should not happen
      throw new RuntimeException(ex);
    }
  }

  @Override
  public YogaNodeJNIBase cloneWithoutChildren() {
    try {
      YogaNodeJNIBase clonedYogaNode = (YogaNodeJNIBase) super.clone();
      long clonedNativePointer = YogaNative.jni_YGNodeCloneJNI(mNativePointer);
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
    YogaNative.jni_YGNodeClearChildrenJNI(mNativePointer);
  }

  public YogaNodeJNIBase removeChildAt(int i) {
    if (mChildren == null) {
      throw new IllegalStateException(
          "Trying to remove a child of a YogaNode that does not have children");
    }
    final YogaNodeJNIBase child = mChildren.remove(i);
    child.mOwner = null;
    YogaNative.jni_YGNodeRemoveChildJNI(mNativePointer, child.mNativePointer);
    return child;
  }

  /**
   * The owner is used to identify the YogaTree that a {@link YogaNode} belongs to. This method will
   * return the parent of the {@link YogaNode} when the {@link YogaNode} only belongs to one
   * YogaTree or null when the {@link YogaNode} is shared between two or more YogaTrees.
   *
   * @return the {@link YogaNode} that owns this {@link YogaNode}.
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
      List<YogaNodeJNIBase> children = n.get(i).mChildren;
      if (children != null) {
        n.addAll(children);
      }
    }

    nodes = n.toArray(new YogaNodeJNIBase[n.size()]);
    nativePointers = new long[nodes.length];
    for (int i = 0; i < nodes.length; ++i) {
      nativePointers[i] = nodes[i].mNativePointer;
    }

    YogaNative.jni_YGNodeCalculateLayoutJNI(mNativePointer, width, height, nativePointers, nodes);
  }

  public void dirty() {
    YogaNative.jni_YGNodeMarkDirtyJNI(mNativePointer);
  }

  public void dirtyAllDescendants() {
    YogaNative.jni_YGNodeMarkDirtyAndPropogateToDescendantsJNI(mNativePointer);
  }

  public boolean isDirty() {
    return YogaNative.jni_YGNodeIsDirtyJNI(mNativePointer);
  }

  @Override
  public void copyStyle(YogaNode srcNode) {
    YogaNative.jni_YGNodeCopyStyleJNI(mNativePointer, ((YogaNodeJNIBase) srcNode).mNativePointer);
  }

  public YogaDirection getStyleDirection() {
    return YogaDirection.fromInt(YogaNative.jni_YGNodeStyleGetDirectionJNI(mNativePointer));
  }

  public void setDirection(YogaDirection direction) {
    YogaNative.jni_YGNodeStyleSetDirectionJNI(mNativePointer, direction.intValue());
  }

  public YogaFlexDirection getFlexDirection() {
    return YogaFlexDirection.fromInt(YogaNative.jni_YGNodeStyleGetFlexDirectionJNI(mNativePointer));
  }

  public void setFlexDirection(YogaFlexDirection flexDirection) {
    YogaNative.jni_YGNodeStyleSetFlexDirectionJNI(mNativePointer, flexDirection.intValue());
  }

  public YogaJustify getJustifyContent() {
    return YogaJustify.fromInt(YogaNative.jni_YGNodeStyleGetJustifyContentJNI(mNativePointer));
  }

  public void setJustifyContent(YogaJustify justifyContent) {
    YogaNative.jni_YGNodeStyleSetJustifyContentJNI(mNativePointer, justifyContent.intValue());
  }

  public YogaAlign getAlignItems() {
    return YogaAlign.fromInt(YogaNative.jni_YGNodeStyleGetAlignItemsJNI(mNativePointer));
  }

  public void setAlignItems(YogaAlign alignItems) {
    YogaNative.jni_YGNodeStyleSetAlignItemsJNI(mNativePointer, alignItems.intValue());
  }

  public YogaAlign getAlignSelf() {
    return YogaAlign.fromInt(YogaNative.jni_YGNodeStyleGetAlignSelfJNI(mNativePointer));
  }

  public void setAlignSelf(YogaAlign alignSelf) {
    YogaNative.jni_YGNodeStyleSetAlignSelfJNI(mNativePointer, alignSelf.intValue());
  }

  public YogaAlign getAlignContent() {
    return YogaAlign.fromInt(YogaNative.jni_YGNodeStyleGetAlignContentJNI(mNativePointer));
  }

  public void setAlignContent(YogaAlign alignContent) {
    YogaNative.jni_YGNodeStyleSetAlignContentJNI(mNativePointer, alignContent.intValue());
  }

  public YogaPositionType getPositionType() {
    return YogaPositionType.fromInt(YogaNative.jni_YGNodeStyleGetPositionTypeJNI(mNativePointer));
  }

  public void setPositionType(YogaPositionType positionType) {
    YogaNative.jni_YGNodeStyleSetPositionTypeJNI(mNativePointer, positionType.intValue());
  }

  public YogaWrap getWrap() {
    return YogaWrap.fromInt(YogaNative.jni_YGNodeStyleGetFlexWrapJNI(mNativePointer));
  }

  public void setWrap(YogaWrap flexWrap) {
    YogaNative.jni_YGNodeStyleSetFlexWrapJNI(mNativePointer, flexWrap.intValue());
  }

  public YogaOverflow getOverflow() {
    return YogaOverflow.fromInt(YogaNative.jni_YGNodeStyleGetOverflowJNI(mNativePointer));
  }

  public void setOverflow(YogaOverflow overflow) {
    YogaNative.jni_YGNodeStyleSetOverflowJNI(mNativePointer, overflow.intValue());
  }

  public YogaDisplay getDisplay() {
    return YogaDisplay.fromInt(YogaNative.jni_YGNodeStyleGetDisplayJNI(mNativePointer));
  }

  public void setDisplay(YogaDisplay display) {
    YogaNative.jni_YGNodeStyleSetDisplayJNI(mNativePointer, display.intValue());
  }

  public float getFlex() {
    return YogaNative.jni_YGNodeStyleGetFlexJNI(mNativePointer);
  }

  public void setFlex(float flex) {
    YogaNative.jni_YGNodeStyleSetFlexJNI(mNativePointer, flex);
  }

  public float getFlexGrow() {
    return YogaNative.jni_YGNodeStyleGetFlexGrowJNI(mNativePointer);
  }

  public void setFlexGrow(float flexGrow) {
    YogaNative.jni_YGNodeStyleSetFlexGrowJNI(mNativePointer, flexGrow);
  }

  public float getFlexShrink() {
    return YogaNative.jni_YGNodeStyleGetFlexShrinkJNI(mNativePointer);
  }

  public void setFlexShrink(float flexShrink) {
    YogaNative.jni_YGNodeStyleSetFlexShrinkJNI(mNativePointer, flexShrink);
  }

  public YogaValue getFlexBasis() {
    return valueFromLong(YogaNative.jni_YGNodeStyleGetFlexBasisJNI(mNativePointer));
  }

  public void setFlexBasis(float flexBasis) {
    YogaNative.jni_YGNodeStyleSetFlexBasisJNI(mNativePointer, flexBasis);
  }

  public void setFlexBasisPercent(float percent) {
    YogaNative.jni_YGNodeStyleSetFlexBasisPercentJNI(mNativePointer, percent);
  }

  public void setFlexBasisAuto() {
    YogaNative.jni_YGNodeStyleSetFlexBasisAutoJNI(mNativePointer);
  }

  public YogaValue getMargin(YogaEdge edge) {
    return valueFromLong(YogaNative.jni_YGNodeStyleGetMarginJNI(mNativePointer, edge.intValue()));
  }

  public void setMargin(YogaEdge edge, float margin) {
    YogaNative.jni_YGNodeStyleSetMarginJNI(mNativePointer, edge.intValue(), margin);
  }

  public void setMarginPercent(YogaEdge edge, float percent) {
    YogaNative.jni_YGNodeStyleSetMarginPercentJNI(mNativePointer, edge.intValue(), percent);
  }

  public void setMarginAuto(YogaEdge edge) {
    YogaNative.jni_YGNodeStyleSetMarginAutoJNI(mNativePointer, edge.intValue());
  }

  public YogaValue getPadding(YogaEdge edge) {
    return valueFromLong(YogaNative.jni_YGNodeStyleGetPaddingJNI(mNativePointer, edge.intValue()));
  }

  public void setPadding(YogaEdge edge, float padding) {
    YogaNative.jni_YGNodeStyleSetPaddingJNI(mNativePointer, edge.intValue(), padding);
  }

  public void setPaddingPercent(YogaEdge edge, float percent) {
    YogaNative.jni_YGNodeStyleSetPaddingPercentJNI(mNativePointer, edge.intValue(), percent);
  }

  public float getBorder(YogaEdge edge) {
    return YogaNative.jni_YGNodeStyleGetBorderJNI(mNativePointer, edge.intValue());
  }

  public void setBorder(YogaEdge edge, float border) {
    YogaNative.jni_YGNodeStyleSetBorderJNI(mNativePointer, edge.intValue(), border);
  }

  public YogaValue getPosition(YogaEdge edge) {
    return valueFromLong(YogaNative.jni_YGNodeStyleGetPositionJNI(mNativePointer, edge.intValue()));
  }

  public void setPosition(YogaEdge edge, float position) {
    YogaNative.jni_YGNodeStyleSetPositionJNI(mNativePointer, edge.intValue(), position);
  }

  public void setPositionPercent(YogaEdge edge, float percent) {
    YogaNative.jni_YGNodeStyleSetPositionPercentJNI(mNativePointer, edge.intValue(), percent);
  }

  public YogaValue getWidth() {
    return valueFromLong(YogaNative.jni_YGNodeStyleGetWidthJNI(mNativePointer));
  }

  public void setWidth(float width) {
    YogaNative.jni_YGNodeStyleSetWidthJNI(mNativePointer, width);
  }

  public void setWidthPercent(float percent) {
    YogaNative.jni_YGNodeStyleSetWidthPercentJNI(mNativePointer, percent);
  }

  public void setWidthAuto() {
    YogaNative.jni_YGNodeStyleSetWidthAutoJNI(mNativePointer);
  }

  public YogaValue getHeight() {
    return valueFromLong(YogaNative.jni_YGNodeStyleGetHeightJNI(mNativePointer));
  }

  public void setHeight(float height) {
    YogaNative.jni_YGNodeStyleSetHeightJNI(mNativePointer, height);
  }

  public void setHeightPercent(float percent) {
    YogaNative.jni_YGNodeStyleSetHeightPercentJNI(mNativePointer, percent);
  }

  public void setHeightAuto() {
    YogaNative.jni_YGNodeStyleSetHeightAutoJNI(mNativePointer);
  }

  public YogaValue getMinWidth() {
    return valueFromLong(YogaNative.jni_YGNodeStyleGetMinWidthJNI(mNativePointer));
  }

  public void setMinWidth(float minWidth) {
    YogaNative.jni_YGNodeStyleSetMinWidthJNI(mNativePointer, minWidth);
  }

  public void setMinWidthPercent(float percent) {
    YogaNative.jni_YGNodeStyleSetMinWidthPercentJNI(mNativePointer, percent);
  }

  public YogaValue getMinHeight() {
    return valueFromLong(YogaNative.jni_YGNodeStyleGetMinHeightJNI(mNativePointer));
  }

  public void setMinHeight(float minHeight) {
    YogaNative.jni_YGNodeStyleSetMinHeightJNI(mNativePointer, minHeight);
  }

  public void setMinHeightPercent(float percent) {
    YogaNative.jni_YGNodeStyleSetMinHeightPercentJNI(mNativePointer, percent);
  }

  public YogaValue getMaxWidth() {
    return valueFromLong(YogaNative.jni_YGNodeStyleGetMaxWidthJNI(mNativePointer));
  }

  public void setMaxWidth(float maxWidth) {
    YogaNative.jni_YGNodeStyleSetMaxWidthJNI(mNativePointer, maxWidth);
  }

  public void setMaxWidthPercent(float percent) {
    YogaNative.jni_YGNodeStyleSetMaxWidthPercentJNI(mNativePointer, percent);
  }

  public YogaValue getMaxHeight() {
    return valueFromLong(YogaNative.jni_YGNodeStyleGetMaxHeightJNI(mNativePointer));
  }

  public void setMaxHeight(float maxheight) {
    YogaNative.jni_YGNodeStyleSetMaxHeightJNI(mNativePointer, maxheight);
  }

  public void setMaxHeightPercent(float percent) {
    YogaNative.jni_YGNodeStyleSetMaxHeightPercentJNI(mNativePointer, percent);
  }

  public float getAspectRatio() {
    return YogaNative.jni_YGNodeStyleGetAspectRatioJNI(mNativePointer);
  }

  public void setAspectRatio(float aspectRatio) {
    YogaNative.jni_YGNodeStyleSetAspectRatioJNI(mNativePointer, aspectRatio);
  }

  public void setMeasureFunction(YogaMeasureFunction measureFunction) {
    mMeasureFunction = measureFunction;
    YogaNative.jni_YGNodeSetHasMeasureFuncJNI(mNativePointer, measureFunction != null);
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
    YogaNative.jni_YGNodeSetHasBaselineFuncJNI(mNativePointer, baselineFunction != null);
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
   * Use the set logger (defaults to adb log) to print out the styles, children, and computed layout
   * of the tree rooted at this node.
   */
  public void print() {
    YogaNative.jni_YGNodePrintJNI(mNativePointer);
  }

  /**
   * This method replaces the child at childIndex position with the newNode received by parameter.
   * This is different than calling removeChildAt and addChildAt because this method ONLY replaces
   * the child in the mChildren datastructure. @DoNotStrip: called from JNI
   *
   * @return the nativePointer of the newNode {@link YogaNode}
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
    return arr != null
        && (((int) arr[LAYOUT_EDGE_SET_FLAG_INDEX] & DOES_LEGACY_STRETCH_BEHAVIOUR)
            == DOES_LEGACY_STRETCH_BEHAVIOUR);
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
          return getLayoutDirection() == YogaDirection.RTL
              ? arr[LAYOUT_MARGIN_START_INDEX + 2]
              : arr[LAYOUT_MARGIN_START_INDEX];
        case END:
          return getLayoutDirection() == YogaDirection.RTL
              ? arr[LAYOUT_MARGIN_START_INDEX]
              : arr[LAYOUT_MARGIN_START_INDEX + 2];
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
      int paddingStartIndex =
          LAYOUT_PADDING_START_INDEX
              - ((((int) arr[LAYOUT_EDGE_SET_FLAG_INDEX] & MARGIN) == MARGIN) ? 0 : 4);
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
          return getLayoutDirection() == YogaDirection.RTL
              ? arr[paddingStartIndex + 2]
              : arr[paddingStartIndex];
        case END:
          return getLayoutDirection() == YogaDirection.RTL
              ? arr[paddingStartIndex]
              : arr[paddingStartIndex + 2];
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
      int borderStartIndex =
          LAYOUT_BORDER_START_INDEX
              - ((((int) arr[LAYOUT_EDGE_SET_FLAG_INDEX] & MARGIN) == MARGIN) ? 0 : 4)
              - ((((int) arr[LAYOUT_EDGE_SET_FLAG_INDEX] & PADDING) == PADDING) ? 0 : 4);
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
          return getLayoutDirection() == YogaDirection.RTL
              ? arr[borderStartIndex + 2]
              : arr[borderStartIndex];
        case END:
          return getLayoutDirection() == YogaDirection.RTL
              ? arr[borderStartIndex]
              : arr[borderStartIndex + 2];
        default:
          throw new IllegalArgumentException("Cannot get layout border of multi-edge shorthands");
      }
    } else {
      return 0;
    }
  }

  @Override
  public YogaDirection getLayoutDirection() {
    return YogaDirection.fromInt(
        arr != null ? (int) arr[LAYOUT_DIRECTION_INDEX] : mLayoutDirection);
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
