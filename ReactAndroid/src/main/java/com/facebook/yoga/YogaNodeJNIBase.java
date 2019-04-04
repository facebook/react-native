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

  @Nullable private YogaNodeJNIBase mOwner;
  @Nullable private List<YogaNodeJNIBase> mChildren;
  @Nullable private YogaMeasureFunction mMeasureFunction;
  @Nullable private YogaBaselineFunction mBaselineFunction;
  private long mNativePointer;
  @Nullable private Object mData;

  public YogaNodeJNIBase() {
    mNativePointer = YogaNative.jni_YGNodeNew(YogaConfig.useBatchingForLayoutOutputs);
    if (mNativePointer == 0) {
      throw new IllegalStateException("Failed to allocate native memory");
    }
  }

  public YogaNodeJNIBase(YogaConfig config) {
    mNativePointer = YogaNative.jni_YGNodeNewWithConfig(config.mNativePointer, YogaConfig.useBatchingForLayoutOutputs);
    if (mNativePointer == 0) {
      throw new IllegalStateException("Failed to allocate native memory");
    }
  }

  @Override
  protected void finalize() throws Throwable {
    try {
      freeNatives();
    } finally {
      super.finalize();
    }
  }

  /* frees the native underlying YGNode. Useful for testing. */
  public void freeNatives() {
    if (mNativePointer > 0) {
      long nativePointer = mNativePointer;
      mNativePointer = 0;
      YogaNative.jni_YGNodeFree(nativePointer);
    }
  }
  public void reset() {
    mMeasureFunction = null;
    mBaselineFunction = null;
    mData = null;

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
    YogaNative.jni_YGNodeInsertChild(mNativePointer, child.mNativePointer, i);
  }

  public void setIsReferenceBaseline(boolean isReferenceBaseline) {
    YogaNative.jni_YGNodeSetIsReferenceBaseline(mNativePointer, isReferenceBaseline);
  }

  public boolean isReferenceBaseline() {
    return YogaNative.jni_YGNodeIsReferenceBaseline(mNativePointer);
  }

  @Override
  public YogaNodeJNIBase cloneWithoutChildren() {
    try {
      YogaNodeJNIBase clonedYogaNode = (YogaNodeJNIBase) super.clone();
      long clonedNativePointer = YogaNative.jni_YGNodeClone(mNativePointer);
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
    YogaNative.jni_YGNodeClearChildren(mNativePointer);
  }

  public YogaNodeJNIBase removeChildAt(int i) {
    if (mChildren == null) {
      throw new IllegalStateException(
          "Trying to remove a child of a YogaNode that does not have children");
    }
    final YogaNodeJNIBase child = mChildren.remove(i);
    child.mOwner = null;
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
    YogaNative.jni_YGNodeMarkDirty(mNativePointer);
  }

  public void dirtyAllDescendants() {
    YogaNative.jni_YGNodeMarkDirtyAndPropogateToDescendants(mNativePointer);
  }

  public boolean isDirty() {
    return YogaNative.jni_YGNodeIsDirty(mNativePointer);
  }

  @Override
  public void copyStyle(YogaNode srcNode) {
    YogaNative.jni_YGNodeCopyStyle(mNativePointer, ((YogaNodeJNIBase) srcNode).mNativePointer);
  }

  public YogaDirection getStyleDirection() {
    return YogaDirection.fromInt(YogaNative.jni_YGNodeStyleGetDirection(mNativePointer));
  }

  public void setDirection(YogaDirection direction) {
    YogaNative.jni_YGNodeStyleSetDirection(mNativePointer, direction.intValue());
  }

  public YogaFlexDirection getFlexDirection() {
    return YogaFlexDirection.fromInt(YogaNative.jni_YGNodeStyleGetFlexDirection(mNativePointer));
  }

  public void setFlexDirection(YogaFlexDirection flexDirection) {
    YogaNative.jni_YGNodeStyleSetFlexDirection(mNativePointer, flexDirection.intValue());
  }

  public YogaJustify getJustifyContent() {
    return YogaJustify.fromInt(YogaNative.jni_YGNodeStyleGetJustifyContent(mNativePointer));
  }

  public void setJustifyContent(YogaJustify justifyContent) {
    YogaNative.jni_YGNodeStyleSetJustifyContent(mNativePointer, justifyContent.intValue());
  }

  public YogaAlign getAlignItems() {
    return YogaAlign.fromInt(YogaNative.jni_YGNodeStyleGetAlignItems(mNativePointer));
  }

  public void setAlignItems(YogaAlign alignItems) {
    YogaNative.jni_YGNodeStyleSetAlignItems(mNativePointer, alignItems.intValue());
  }

  public YogaAlign getAlignSelf() {
    return YogaAlign.fromInt(YogaNative.jni_YGNodeStyleGetAlignSelf(mNativePointer));
  }

  public void setAlignSelf(YogaAlign alignSelf) {
    YogaNative.jni_YGNodeStyleSetAlignSelf(mNativePointer, alignSelf.intValue());
  }

  public YogaAlign getAlignContent() {
    return YogaAlign.fromInt(YogaNative.jni_YGNodeStyleGetAlignContent(mNativePointer));
  }

  public void setAlignContent(YogaAlign alignContent) {
    YogaNative.jni_YGNodeStyleSetAlignContent(mNativePointer, alignContent.intValue());
  }

  public YogaPositionType getPositionType() {
    return YogaPositionType.fromInt(YogaNative.jni_YGNodeStyleGetPositionType(mNativePointer));
  }

  public void setPositionType(YogaPositionType positionType) {
    YogaNative.jni_YGNodeStyleSetPositionType(mNativePointer, positionType.intValue());
  }

  public YogaWrap getWrap() {
    return YogaWrap.fromInt(YogaNative.jni_YGNodeStyleGetFlexWrap(mNativePointer));
  }

  public void setWrap(YogaWrap flexWrap) {
    YogaNative.jni_YGNodeStyleSetFlexWrap(mNativePointer, flexWrap.intValue());
  }

  public YogaOverflow getOverflow() {
    return YogaOverflow.fromInt(YogaNative.jni_YGNodeStyleGetOverflow(mNativePointer));
  }

  public void setOverflow(YogaOverflow overflow) {
    YogaNative.jni_YGNodeStyleSetOverflow(mNativePointer, overflow.intValue());
  }

  public YogaDisplay getDisplay() {
    return YogaDisplay.fromInt(YogaNative.jni_YGNodeStyleGetDisplay(mNativePointer));
  }

  public void setDisplay(YogaDisplay display) {
    YogaNative.jni_YGNodeStyleSetDisplay(mNativePointer, display.intValue());
  }

  public float getFlex() {
    return YogaNative.jni_YGNodeStyleGetFlex(mNativePointer);
  }

  public void setFlex(float flex) {
    YogaNative.jni_YGNodeStyleSetFlex(mNativePointer, flex);
  }

  public float getFlexGrow() {
    return YogaNative.jni_YGNodeStyleGetFlexGrow(mNativePointer);
  }

  public void setFlexGrow(float flexGrow) {
    YogaNative.jni_YGNodeStyleSetFlexGrow(mNativePointer, flexGrow);
  }

  public float getFlexShrink() {
    return YogaNative.jni_YGNodeStyleGetFlexShrink(mNativePointer);
  }

  public void setFlexShrink(float flexShrink) {
    YogaNative.jni_YGNodeStyleSetFlexShrink(mNativePointer, flexShrink);
  }

  public YogaValue getFlexBasis() {
    return valueFromLong(YogaNative.jni_YGNodeStyleGetFlexBasis(mNativePointer));
  }

  public void setFlexBasis(float flexBasis) {
    YogaNative.jni_YGNodeStyleSetFlexBasis(mNativePointer, flexBasis);
  }

  public void setFlexBasisPercent(float percent) {
    YogaNative.jni_YGNodeStyleSetFlexBasisPercent(mNativePointer, percent);
  }

  public void setFlexBasisAuto() {
    YogaNative.jni_YGNodeStyleSetFlexBasisAuto(mNativePointer);
  }

  public YogaValue getMargin(YogaEdge edge) {
    return valueFromLong(YogaNative.jni_YGNodeStyleGetMargin(mNativePointer, edge.intValue()));
  }

  public void setMargin(YogaEdge edge, float margin) {
    YogaNative.jni_YGNodeStyleSetMargin(mNativePointer, edge.intValue(), margin);
  }

  public void setMarginPercent(YogaEdge edge, float percent) {
    YogaNative.jni_YGNodeStyleSetMarginPercent(mNativePointer, edge.intValue(), percent);
  }

  public void setMarginAuto(YogaEdge edge) {
    YogaNative.jni_YGNodeStyleSetMarginAuto(mNativePointer, edge.intValue());
  }

  public YogaValue getPadding(YogaEdge edge) {
    return valueFromLong(YogaNative.jni_YGNodeStyleGetPadding(mNativePointer, edge.intValue()));
  }

  public void setPadding(YogaEdge edge, float padding) {
    YogaNative.jni_YGNodeStyleSetPadding(mNativePointer, edge.intValue(), padding);
  }

  public void setPaddingPercent(YogaEdge edge, float percent) {
    YogaNative.jni_YGNodeStyleSetPaddingPercent(mNativePointer, edge.intValue(), percent);
  }

  public float getBorder(YogaEdge edge) {
    return YogaNative.jni_YGNodeStyleGetBorder(mNativePointer, edge.intValue());
  }

  public void setBorder(YogaEdge edge, float border) {
    YogaNative.jni_YGNodeStyleSetBorder(mNativePointer, edge.intValue(), border);
  }

  public YogaValue getPosition(YogaEdge edge) {
    return valueFromLong(YogaNative.jni_YGNodeStyleGetPosition(mNativePointer, edge.intValue()));
  }

  public void setPosition(YogaEdge edge, float position) {
    YogaNative.jni_YGNodeStyleSetPosition(mNativePointer, edge.intValue(), position);
  }

  public void setPositionPercent(YogaEdge edge, float percent) {
    YogaNative.jni_YGNodeStyleSetPositionPercent(mNativePointer, edge.intValue(), percent);
  }

  public YogaValue getWidth() {
    return valueFromLong(YogaNative.jni_YGNodeStyleGetWidth(mNativePointer));
  }

  public void setWidth(float width) {
    YogaNative.jni_YGNodeStyleSetWidth(mNativePointer, width);
  }

  public void setWidthPercent(float percent) {
    YogaNative.jni_YGNodeStyleSetWidthPercent(mNativePointer, percent);
  }

  public void setWidthAuto() {
    YogaNative.jni_YGNodeStyleSetWidthAuto(mNativePointer);
  }

  public YogaValue getHeight() {
    return valueFromLong(YogaNative.jni_YGNodeStyleGetHeight(mNativePointer));
  }

  public void setHeight(float height) {
    YogaNative.jni_YGNodeStyleSetHeight(mNativePointer, height);
  }

  public void setHeightPercent(float percent) {
    YogaNative.jni_YGNodeStyleSetHeightPercent(mNativePointer, percent);
  }

  public void setHeightAuto() {
    YogaNative.jni_YGNodeStyleSetHeightAuto(mNativePointer);
  }

  public YogaValue getMinWidth() {
    return valueFromLong(YogaNative.jni_YGNodeStyleGetMinWidth(mNativePointer));
  }

  public void setMinWidth(float minWidth) {
    YogaNative.jni_YGNodeStyleSetMinWidth(mNativePointer, minWidth);
  }

  public void setMinWidthPercent(float percent) {
    YogaNative.jni_YGNodeStyleSetMinWidthPercent(mNativePointer, percent);
  }

  public YogaValue getMinHeight() {
    return valueFromLong(YogaNative.jni_YGNodeStyleGetMinHeight(mNativePointer));
  }

  public void setMinHeight(float minHeight) {
    YogaNative.jni_YGNodeStyleSetMinHeight(mNativePointer, minHeight);
  }

  public void setMinHeightPercent(float percent) {
    YogaNative.jni_YGNodeStyleSetMinHeightPercent(mNativePointer, percent);
  }

  public YogaValue getMaxWidth() {
    return valueFromLong(YogaNative.jni_YGNodeStyleGetMaxWidth(mNativePointer));
  }

  public void setMaxWidth(float maxWidth) {
    YogaNative.jni_YGNodeStyleSetMaxWidth(mNativePointer, maxWidth);
  }

  public void setMaxWidthPercent(float percent) {
    YogaNative.jni_YGNodeStyleSetMaxWidthPercent(mNativePointer, percent);
  }

  public YogaValue getMaxHeight() {
    return valueFromLong(YogaNative.jni_YGNodeStyleGetMaxHeight(mNativePointer));
  }

  public void setMaxHeight(float maxheight) {
    YogaNative.jni_YGNodeStyleSetMaxHeight(mNativePointer, maxheight);
  }

  public void setMaxHeightPercent(float percent) {
    YogaNative.jni_YGNodeStyleSetMaxHeightPercent(mNativePointer, percent);
  }

  public float getAspectRatio() {
    return YogaNative.jni_YGNodeStyleGetAspectRatio(mNativePointer);
  }

  public void setAspectRatio(float aspectRatio) {
    YogaNative.jni_YGNodeStyleSetAspectRatio(mNativePointer, aspectRatio);
  }

  public abstract boolean getDoesLegacyStretchFlagAffectsLayout();

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
    YogaNative.jni_YGNodePrint(mNativePointer);
  }

  public void setStyleInputs(float[] styleInputsArray, int size) {
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
}
