/*
 *  Copyright (c) 2014-present, Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */

package com.facebook.yoga;

import com.facebook.proguard.annotations.DoNotStrip;
import com.facebook.soloader.SoLoader;
import java.util.ArrayList;
import java.util.List;
import javax.annotation.Nullable;

@DoNotStrip
public class YogaNode implements Cloneable {

  static {
      SoLoader.loadLibrary("yoga");
  }

  public static final int BYTE_BUFFER = 1;
  public static final int HYBRID = 2;
  public static final int UNSAFE = 3;

  /** Get native instance count. Useful for testing only. */
  static native int jni_YGNodeGetInstanceCount();

  private YogaNodeProperties mDelegate;
  private YogaNode mOwner;
  @Nullable private List<YogaNode> mChildren;
  private YogaMeasureFunction mMeasureFunction;
  private YogaBaselineFunction mBaselineFunction;
  private Object mData;

  public YogaNode() {
    mDelegate = new YogaNodePropertiesJNI(this);
  }

  public YogaNode(YogaConfig config) {
    mDelegate = new YogaNodePropertiesJNI(this, config);
  }

  public YogaNode(int storageType) {
    switch (storageType) {
      case BYTE_BUFFER:
        mDelegate = new YogaNodePropertiesByteBuffer(this);
        break;
      case HYBRID:
        mDelegate = new YogaNodePropertiesHybrid(this);
        break;
      case UNSAFE:
        mDelegate = new YogaNodePropertiesUnsafe(this);
        break;
      default:
        mDelegate = new YogaNodePropertiesJNI(this);
    }
  }

  public YogaNode(int storageType, YogaConfig config) {
    switch (storageType) {
      case BYTE_BUFFER:
        mDelegate = new YogaNodePropertiesByteBuffer(this, config);
        break;
      case HYBRID:
        mDelegate = new YogaNodePropertiesHybrid(this, config);
        break;
      case UNSAFE:
        mDelegate = new YogaNodePropertiesUnsafe(this, config);
        break;
      default:
        mDelegate = new YogaNodePropertiesJNI(this, config);
    }
  }

  public long getNativePointer() {
    return mDelegate.getNativePointer();
  }

  /* frees the native underlying YGNode. Useful for testing. */
  public void freeNatives() {
    mDelegate.freeNatives();
  }

  public void reset() {
    mMeasureFunction = null;
    mBaselineFunction = null;
    mData = null;
    mDelegate.reset();
  }

  public int getChildCount() {
    return mChildren == null ? 0 : mChildren.size();
  }

  public YogaNode getChildAt(int i) {
    if (mChildren == null) {
      throw new IllegalStateException("YogaNode does not have children");
    }
    return mChildren.get(i);
  }

  private native void jni_YGNodeInsertChild(long nativePointer, long childPointer, int index);
  public void addChildAt(YogaNode child, int i) {
    if (child.mOwner != null) {
      throw new IllegalStateException("Child already has a parent, it must be removed first.");
    }

    if (mChildren == null) {
      mChildren = new ArrayList<>(4);
    }
    mChildren.add(i, child);
    child.mOwner = this;
    jni_YGNodeInsertChild(getNativePointer(), child.getNativePointer(), i);
  }

  private native void jni_YGNodeInsertSharedChild(long nativePointer, long childPointer, int index);

  public void addSharedChildAt(YogaNode child, int i) {
    if (mChildren == null) {
      mChildren = new ArrayList<>(4);
    }
    mChildren.add(i, child);
    child.mOwner = null;
    jni_YGNodeInsertSharedChild(getNativePointer(), child.getNativePointer(), i);
  }

  private native void jni_YGNodeSetOwner(long nativePointer, long newOwnerNativePointer);

  @Override
  public YogaNode clone() {
    try {
      YogaNode clonedYogaNode = (YogaNode) super.clone();

      if (mChildren != null) {
        for (YogaNode child : mChildren) {
          child.jni_YGNodeSetOwner(child.getNativePointer(), 0);
          child.mOwner = null;
        }
      }

      clonedYogaNode.mDelegate = mDelegate.clone(clonedYogaNode);
      clonedYogaNode.mOwner = null;
      clonedYogaNode.mChildren =
          mChildren != null ? (List<YogaNode>) ((ArrayList) mChildren).clone() : null;
      if (clonedYogaNode.mChildren != null) {
        for (YogaNode child : clonedYogaNode.mChildren) {
          child.mOwner = null;
        }
      }
      return clonedYogaNode;
    } catch (CloneNotSupportedException ex) {
      // This class implements Cloneable, this should not happen
      throw new RuntimeException(ex);
    }
  }

  public YogaNode cloneWithNewChildren() {
    try {
      YogaNode clonedYogaNode = (YogaNode) super.clone();
      clonedYogaNode.mDelegate = mDelegate.clone(clonedYogaNode);
      clonedYogaNode.mOwner = null;
      clonedYogaNode.clearChildren();
      return clonedYogaNode;
    } catch (CloneNotSupportedException ex) {
      // This class implements Cloneable, this should not happen
      throw new RuntimeException(ex);
    }
  }

  private native void jni_YGNodeClearChildren(long nativePointer);

  private void clearChildren() {
    mChildren = null;
    jni_YGNodeClearChildren(getNativePointer());
  }

  private native void jni_YGNodeRemoveChild(long nativePointer, long childPointer);
  public YogaNode removeChildAt(int i) {
    if (mChildren == null) {
      throw new IllegalStateException(
          "Trying to remove a child of a YogaNode that does not have children");
    }
    final YogaNode child = mChildren.remove(i);
    child.mOwner = null;
    jni_YGNodeRemoveChild(getNativePointer(), child.getNativePointer());
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
  public YogaNode getOwner() {
    return mOwner;
  }

  /** @deprecated Use #getOwner() instead. This will be removed in the next version. */
  @Deprecated
  @Nullable
  public YogaNode getParent() {
    return getOwner();
  }

  public int indexOf(YogaNode child) {
    return mChildren == null ? -1 : mChildren.indexOf(child);
  }

  private native boolean jni_YGNodeCalculateLayout(long nativePointer, float width, float height);

  public void calculateLayout(float width, float height) {
    boolean hasNewLayout = jni_YGNodeCalculateLayout(getNativePointer(), width, height);
    mDelegate.onAfterCalculateLayout(hasNewLayout);
  }

  public boolean hasNewLayout() {
    return mDelegate.hasNewLayout();
  }

  private native void jni_YGNodeMarkDirty(long nativePointer);
  public void dirty() {
    jni_YGNodeMarkDirty(getNativePointer());
  }

  private native void jni_YGNodeMarkDirtyAndPropogateToDescendants(long nativePointer);

  public void dirtyAllDescendants() {
    jni_YGNodeMarkDirtyAndPropogateToDescendants(getNativePointer());
  }

  public boolean isDirty() {
    return mDelegate.isDirty();
  }

  private native void jni_YGNodeCopyStyle(long dstNativePointer, long srcNativePointer);
  public void copyStyle(YogaNode srcNode) {
    jni_YGNodeCopyStyle(getNativePointer(), srcNode.getNativePointer());
  }

  public void markLayoutSeen() {
    mDelegate.markLayoutSeen();
  }

  public YogaDirection getStyleDirection() {
    return mDelegate.getStyleDirection();
  }

  public void setDirection(YogaDirection direction) {
    mDelegate.setDirection(direction);
  }

  public YogaFlexDirection getFlexDirection() {
    return mDelegate.getFlexDirection();
  }

  public void setFlexDirection(YogaFlexDirection flexDirection) {
    mDelegate.setFlexDirection(flexDirection);
  }

  public YogaJustify getJustifyContent() {
    return mDelegate.getJustifyContent();
  }

  public void setJustifyContent(YogaJustify justifyContent) {
    mDelegate.setJustifyContent(justifyContent);
  }

  public YogaAlign getAlignItems() {
    return mDelegate.getAlignItems();
  }

  public void setAlignItems(YogaAlign alignItems) {
    mDelegate.setAlignItems(alignItems);
  }

  public YogaAlign getAlignSelf() {
    return mDelegate.getAlignSelf();
  }

  public void setAlignSelf(YogaAlign alignSelf) {
    mDelegate.setAlignSelf(alignSelf);
  }

  public YogaAlign getAlignContent() {
    return mDelegate.getAlignContent();
  }

  public void setAlignContent(YogaAlign alignContent) {
    mDelegate.setAlignContent(alignContent);
  }

  public YogaPositionType getPositionType() {
    return mDelegate.getPositionType();
  }

  public void setPositionType(YogaPositionType positionType) {
    mDelegate.setPositionType(positionType);
  }

  public void setWrap(YogaWrap flexWrap) {
    mDelegate.setWrap(flexWrap);
  }

  public YogaOverflow getOverflow() {
    return mDelegate.getOverflow();
  }

  public void setOverflow(YogaOverflow overflow) {
    mDelegate.setOverflow(overflow);
  }

  public YogaDisplay getDisplay() {
    return mDelegate.getDisplay();
  }

  public void setDisplay(YogaDisplay display) {
    mDelegate.setDisplay(display);
  }

  public void setFlex(float flex) {
    mDelegate.setFlex(flex);
  }

  public float getFlexGrow() {
    return mDelegate.getFlexGrow();
  }

  public void setFlexGrow(float flexGrow) {
    mDelegate.setFlexGrow(flexGrow);
  }

  public float getFlexShrink() {
    return mDelegate.getFlexShrink();
  }

  public void setFlexShrink(float flexShrink) {
    mDelegate.setFlexShrink(flexShrink);
  }

  public YogaValue getFlexBasis() {
    return mDelegate.getFlexBasis();
  }

  public void setFlexBasis(float flexBasis) {
    mDelegate.setFlexBasis(flexBasis);
  }

  public void setFlexBasisPercent(float percent) {
    mDelegate.setFlexBasisPercent(percent);
  }

  public void setFlexBasisAuto() {
    mDelegate.setFlexBasisAuto();
  }

  public YogaValue getMargin(YogaEdge edge) {
    return mDelegate.getMargin(edge);
  }

  public void setMargin(YogaEdge edge, float margin) {
    mDelegate.setMargin(edge, margin);
  }

  public void setMarginPercent(YogaEdge edge, float percent) {
    mDelegate.setMarginPercent(edge, percent);
  }

  public void setMarginAuto(YogaEdge edge) {
    mDelegate.setMarginAuto(edge);
  }

  public YogaValue getPadding(YogaEdge edge) {
    return mDelegate.getPadding(edge);
  }

  public void setPadding(YogaEdge edge, float padding) {
    mDelegate.setPadding(edge, padding);
  }

  public void setPaddingPercent(YogaEdge edge, float percent) {
    mDelegate.setPaddingPercent(edge, percent);
  }

  public float getBorder(YogaEdge edge) {
    return mDelegate.getBorder(edge);
  }

  public void setBorder(YogaEdge edge, float border) {
    mDelegate.setBorder(edge, border);
  }

  public YogaValue getPosition(YogaEdge edge) {
    return mDelegate.getPosition(edge);
  }

  public void setPosition(YogaEdge edge, float position) {
    mDelegate.setPosition(edge, position);
  }

  public void setPositionPercent(YogaEdge edge, float percent) {
    mDelegate.setPositionPercent(edge, percent);
  }

  public YogaValue getWidth() {
    return mDelegate.getWidth();
  }

  public void setWidth(float width) {
    mDelegate.setWidth(width);
  }

  public void setWidthPercent(float percent) {
    mDelegate.setWidthPercent(percent);
  }

  public void setWidthAuto() {
    mDelegate.setWidthAuto();
  }

  public YogaValue getHeight() {
    return mDelegate.getHeight();
  }

  public void setHeight(float height) {
    mDelegate.setHeight(height);
  }

  public void setHeightPercent(float percent) {
    mDelegate.setHeightPercent(percent);
  }

  public void setHeightAuto() {
    mDelegate.setHeightAuto();
  }

  public YogaValue getMinWidth() {
    return mDelegate.getMinWidth();
  }

  public void setMinWidth(float minWidth) {
    mDelegate.setMinWidth(minWidth);
  }

  public void setMinWidthPercent(float percent) {
    mDelegate.setMinWidthPercent(percent);
  }

  public YogaValue getMinHeight() {
    return mDelegate.getMinHeight();
  }

  public void setMinHeight(float minHeight) {
    mDelegate.setMinHeight(minHeight);
  }

  public void setMinHeightPercent(float percent) {
    mDelegate.setMinHeightPercent(percent);
  }

  public YogaValue getMaxWidth() {
    return mDelegate.getMaxWidth();
  }

  public void setMaxWidth(float maxWidth) {
    mDelegate.setMaxWidth(maxWidth);
  }

  public void setMaxWidthPercent(float percent) {
    mDelegate.setMaxWidthPercent(percent);
  }

  public YogaValue getMaxHeight() {
    return mDelegate.getMaxHeight();
  }

  public void setMaxHeight(float maxheight) {
    mDelegate.setMaxHeight(maxheight);
  }

  public void setMaxHeightPercent(float percent) {
    mDelegate.setMaxHeightPercent(percent);
  }

  public float getAspectRatio() {
    return mDelegate.getAspectRatio();
  }

  public void setAspectRatio(float aspectRatio) {
    mDelegate.setAspectRatio(aspectRatio);
  }

  public float getLayoutX() {
    return mDelegate.getLayoutX();
  }

  public float getLayoutY() {
    return mDelegate.getLayoutY();
  }

  public float getLayoutWidth() {
    return mDelegate.getLayoutWidth();
  }

  public float getLayoutHeight() {
    return mDelegate.getLayoutHeight();
  }

  public boolean getDoesLegacyStretchFlagAffectsLayout() {
    return mDelegate.getDoesLegacyStretchFlagAffectsLayout();
  }

  public float getLayoutMargin(YogaEdge edge) {
    return mDelegate.getLayoutMargin(edge);
  }

  public float getLayoutPadding(YogaEdge edge) {
    return mDelegate.getLayoutPadding(edge);
  }

  public float getLayoutBorder(YogaEdge edge) {
    return mDelegate.getLayoutBorder(edge);
  }

  public YogaDirection getLayoutDirection() {
    return mDelegate.getLayoutDirection();
  }

  private native void jni_YGNodeSetHasMeasureFunc(long nativePointer, boolean hasMeasureFunc);
  public void setMeasureFunction(YogaMeasureFunction measureFunction) {
    mMeasureFunction = measureFunction;
    jni_YGNodeSetHasMeasureFunc(getNativePointer(), measureFunction != null);
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

  private native void jni_YGNodeSetHasBaselineFunc(long nativePointer, boolean hasMeasureFunc);
  public void setBaselineFunction(YogaBaselineFunction baselineFunction) {
    mBaselineFunction = baselineFunction;
    jni_YGNodeSetHasBaselineFunc(getNativePointer(), baselineFunction != null);
  }

  @DoNotStrip
  public final float baseline(float width, float height) {
    return mBaselineFunction.baseline(this, width, height);
  }

  public boolean isMeasureDefined() {
    return mMeasureFunction != null;
  }

  public void setData(Object data) {
    mData = data;
  }

  public Object getData() {
    return mData;
  }

  private native void jni_YGNodePrint(long nativePointer);

  /**
   * Use the set logger (defaults to adb log) to print out the styles, children, and computed
   * layout of the tree rooted at this node.
   */
  public void print() {
    jni_YGNodePrint(getNativePointer());
  }

  /**
   * This method replaces the child at childIndex position with the newNode received by parameter.
   * This is different than calling removeChildAt and addChildAt because this method ONLY replaces
   * the child in the mChildren datastructure. @DoNotStrip: called from JNI
   *
   * @return the nativePointer of the newNode {@linl YogaNode}
   */
  @DoNotStrip
  private final long replaceChild(YogaNode newNode, int childIndex) {
    if (mChildren == null) {
      throw new IllegalStateException("Cannot replace child. YogaNode does not have children");
    }
    mChildren.remove(childIndex);
    mChildren.add(childIndex, newNode);
    newNode.mOwner = this;
    return newNode.getNativePointer();
  }
}
