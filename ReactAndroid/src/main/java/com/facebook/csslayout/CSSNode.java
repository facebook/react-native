/**
 * Copyright (c) 2014-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.csslayout;

import javax.annotation.Nullable;

import java.util.ArrayList;

import com.facebook.infer.annotation.Assertions;

import static com.facebook.csslayout.CSSLayout.DIMENSION_HEIGHT;
import static com.facebook.csslayout.CSSLayout.DIMENSION_WIDTH;
import static com.facebook.csslayout.CSSLayout.POSITION_LEFT;
import static com.facebook.csslayout.CSSLayout.POSITION_TOP;

/**
 * A CSS Node. It has a style object you can manipulate at {@link #style}. After calling
 * {@link #calculateLayout()}, {@link #layout} will be filled with the results of the layout.
 */
public class CSSNode implements CSSNodeAPI<CSSNode> {

  private enum LayoutState {
    /**
     * Some property of this node or its children has changes and the current values in
     * {@link #layout} are not valid.
     */
    DIRTY,

    /**
     * This node has a new layout relative to the last time {@link #markLayoutSeen()} was called.
     */
    HAS_NEW_LAYOUT,

    /**
     * {@link #layout} is valid for the node's properties and this layout has been marked as
     * having been seen.
     */
    UP_TO_DATE,
  }

  // VisibleForTesting
  final CSSStyle style = new CSSStyle();
  final CSSLayout layout = new CSSLayout();
  final CachedCSSLayout lastLayout = new CachedCSSLayout();

  public int lineIndex = 0;

  CSSNode nextChild;

  private @Nullable ArrayList<CSSNode> mChildren;
  private @Nullable CSSNode mParent;
  private @Nullable MeasureFunction mMeasureFunction = null;
  private LayoutState mLayoutState = LayoutState.DIRTY;
  private boolean mIsTextNode = false;
  private Object mData;

  @Override
  public void init() {
    reset();
  }

  @Override
  public int getChildCount() {
    return mChildren == null ? 0 : mChildren.size();
  }

  @Override
  public CSSNode getChildAt(int i) {
    Assertions.assertNotNull(mChildren);
    return mChildren.get(i);
  }

  @Override
  public void addChildAt(CSSNode child, int i) {
    if (child.mParent != null) {
      throw new IllegalStateException("Child already has a parent, it must be removed first.");
    }
    if (mChildren == null) {
      // 4 is kinda arbitrary, but the default of 10 seems really high for an average View.
      mChildren = new ArrayList<>(4);
    }

    mChildren.add(i, child);
    child.mParent = this;
    dirty();
  }

  @Override
  public CSSNode removeChildAt(int i) {
    Assertions.assertNotNull(mChildren);
    CSSNode removed = mChildren.remove(i);
    removed.mParent = null;
    dirty();
    return removed;
  }

  @Override
  public @Nullable CSSNode getParent() {
    return mParent;
  }

  /**
   * @return the index of the given child, or -1 if the child doesn't exist in this node.
   */
  @Override
  public int indexOf(CSSNode child) {
    Assertions.assertNotNull(mChildren);
    return mChildren.indexOf(child);
  }

  @Override
  public void setMeasureFunction(MeasureFunction measureFunction) {
    if (mMeasureFunction != measureFunction) {
      mMeasureFunction = measureFunction;
      dirty();
    }
  }

  @Override
  public boolean isMeasureDefined() {
    return mMeasureFunction != null;
  }

  @Override
  public void setIsTextNode(boolean isTextNode) {
    mIsTextNode = isTextNode;
  }

  @Override
  public boolean isTextNode() {
    return mIsTextNode;
  }

  MeasureOutput measure(MeasureOutput measureOutput, float width, CSSMeasureMode widthMode, float height, CSSMeasureMode heightMode) {
    if (!isMeasureDefined()) {
      throw new RuntimeException("Measure function isn't defined!");
    }
    measureOutput.height = CSSConstants.UNDEFINED;
    measureOutput.width = CSSConstants.UNDEFINED;
    Assertions.assertNotNull(mMeasureFunction).measure(this, width, widthMode, height, heightMode, measureOutput);
    return measureOutput;
  }

  /**
   * Performs the actual layout and saves the results in {@link #layout}
   */
  @Override
  public void calculateLayout(CSSLayoutContext layoutContext) {
    LayoutEngine.layoutNode(layoutContext, this, CSSConstants.UNDEFINED, CSSConstants.UNDEFINED, null);
  }

  /**
   * See {@link LayoutState#DIRTY}.
   */
  @Override
  public boolean isDirty() {
    return mLayoutState == LayoutState.DIRTY;
  }

  /**
   * See {@link LayoutState#HAS_NEW_LAYOUT}.
   */
  @Override
  public boolean hasNewLayout() {
    return mLayoutState == LayoutState.HAS_NEW_LAYOUT;
  }

  @Override
  public void dirty() {
    if (mLayoutState == LayoutState.DIRTY) {
      return;
    } else if (mLayoutState == LayoutState.HAS_NEW_LAYOUT) {
      throw new IllegalStateException("Previous layout was ignored! markLayoutSeen() never called");
    }

    mLayoutState = LayoutState.DIRTY;

    if (mParent != null) {
      mParent.dirty();
    }
  }

  void markHasNewLayout() {
    mLayoutState = LayoutState.HAS_NEW_LAYOUT;
  }

  /**
   * Tells the node that the current values in {@link #layout} have been seen. Subsequent calls
   * to {@link #hasNewLayout()} will return false until this node is laid out with new parameters.
   * You must call this each time the layout is generated if the node has a new layout.
   */
  @Override
  public void markLayoutSeen() {
    if (!hasNewLayout()) {
      throw new IllegalStateException("Expected node to have a new layout to be seen!");
    }

    mLayoutState = LayoutState.UP_TO_DATE;
  }

  private void toStringWithIndentation(StringBuilder result, int level) {
    // Spaces and tabs are dropped by IntelliJ logcat integration, so rely on __ instead.
    StringBuilder indentation = new StringBuilder();
    for (int i = 0; i < level; ++i) {
      indentation.append("__");
    }

    result.append(indentation.toString());
    result.append(layout.toString());

    if (getChildCount() == 0) {
      return;
    }

    result.append(", children: [\n");
    for (int i = 0; i < getChildCount(); i++) {
      getChildAt(i).toStringWithIndentation(result, level + 1);
      result.append("\n");
    }
    result.append(indentation + "]");
  }

  @Override
  public String toString() {
    StringBuilder sb = new StringBuilder();
    this.toStringWithIndentation(sb, 0);
    return sb.toString();
  }

  @Override
  public boolean valuesEqual(float f1, float f2) {
    return FloatUtil.floatsEqual(f1, f2);
  }

  /**
   * Get this node's direction, as defined in the style.
   */
  @Override
  public CSSDirection getStyleDirection() {
    return style.direction;
  }

  @Override
  public void setDirection(CSSDirection direction) {
    if (style.direction != direction) {
      style.direction = direction;
      dirty();
    }
  }

  /**
   * Get this node's flex direction, as defined by style.
   */
  @Override
  public CSSFlexDirection getFlexDirection() {
    return style.flexDirection;
  }

  @Override
  public void setFlexDirection(CSSFlexDirection flexDirection) {
    if (style.flexDirection != flexDirection) {
      style.flexDirection = flexDirection;
      dirty();
    }
  }

  /**
   * Get this node's justify content, as defined by style.
   */
  @Override
  public CSSJustify getJustifyContent() {
    return style.justifyContent;
  }

  @Override
  public void setJustifyContent(CSSJustify justifyContent) {
    if (style.justifyContent != justifyContent) {
      style.justifyContent = justifyContent;
      dirty();
    }
  }

  /**
   * Get this node's align items, as defined by style.
   */
  @Override
  public CSSAlign getAlignItems() {
    return style.alignItems;
  }

  @Override
  public void setAlignItems(CSSAlign alignItems) {
    if (style.alignItems != alignItems) {
      style.alignItems = alignItems;
      dirty();
    }
  }

  /**
   * Get this node's align items, as defined by style.
   */
  @Override
  public CSSAlign getAlignSelf() {
    return style.alignSelf;
  }

  @Override
  public void setAlignSelf(CSSAlign alignSelf) {
    if (style.alignSelf != alignSelf) {
      style.alignSelf = alignSelf;
      dirty();
    }
  }

  @Override
  public CSSAlign getAlignContent() {
    return style.alignContent;
  }

  @Override
  public void setAlignContent(CSSAlign alignContent) {
    if (style.alignContent != alignContent) {
      style.alignContent = alignContent;
      dirty();
    }
  }

  /**
   * Get this node's position type, as defined by style.
   */
  @Override
  public CSSPositionType getPositionType() {
    return style.positionType;
  }

  @Override
  public void setPositionType(CSSPositionType positionType) {
    if (style.positionType != positionType) {
      style.positionType = positionType;
      dirty();
    }
  }

  @Override
  public void setWrap(CSSWrap flexWrap) {
    if (style.flexWrap != flexWrap) {
      style.flexWrap = flexWrap;
      dirty();
    }
  }

  /**
   * Get this node's flex, as defined by style.
   */
  @Override
  public float getFlex() {
    if (style.flexGrow > 0) {
      return style.flexGrow;
    } else if (style.flexShrink > 0) {
      return -style.flexShrink;
    }

    return 0;
  }

  @Override
  public void setFlex(float flex) {
    if (CSSConstants.isUndefined(flex) || flex == 0) {
      setFlexGrow(0);
      setFlexShrink(0);
      setFlexBasis(CSSConstants.UNDEFINED);
    } else if (flex > 0) {
      setFlexGrow(flex);
      setFlexShrink(0);
      setFlexBasis(0);
    } else {
      setFlexGrow(0);
      setFlexShrink(-flex);
      setFlexBasis(CSSConstants.UNDEFINED);
    }
  }

  @Override
  public float getFlexGrow() {
    return style.flexGrow;
  }

  @Override
  public void setFlexGrow(float flexGrow) {
    if (!valuesEqual(style.flexGrow, flexGrow)) {
      style.flexGrow = flexGrow;
      dirty();
    }
  }

  @Override
  public float getFlexShrink() {
    return style.flexShrink;
  }

  @Override
  public void setFlexShrink(float flexShrink) {
    if (!valuesEqual(style.flexShrink, flexShrink)) {
      style.flexShrink = flexShrink;
      dirty();
    }
  }

  @Override
  public float getFlexBasis() {
    return style.flexBasis;
  }

  @Override
  public void setFlexBasis(float flexBasis) {
    if (!valuesEqual(style.flexBasis, flexBasis)) {
      style.flexBasis = flexBasis;
      dirty();
    }
  }


  /**
   * Get this node's margin, as defined by style + default margin.
   */
  @Override
  public Spacing getMargin() {
    return style.margin;
  }

  @Override
  public void setMargin(int spacingType, float margin) {
    if (style.margin.set(spacingType, margin)) {
      dirty();
    }
  }

  /**
   * Get this node's padding, as defined by style + default padding.
   */
  @Override
  public Spacing getPadding() {
    return style.padding;
  }

  @Override
  public void setPadding(int spacingType, float padding) {
    if (style.padding.set(spacingType, padding)) {
      dirty();
    }
  }

  /**
   * Get this node's border, as defined by style.
   */
  @Override
  public Spacing getBorder() {
    return style.border;
  }

  @Override
  public void setBorder(int spacingType, float border) {
    if (style.border.set(spacingType, border)) {
      dirty();
    }
  }

  /**
   * Get this node's position, as defined by style.
   */
  @Override
  public Spacing getPosition() {
    return style.position;
  }

  @Override
  public void setPosition(int spacingType, float position) {
    if (style.position.set(spacingType, position)) {
      dirty();
    }
  }

  /**
   * Get this node's width, as defined in the style.
   */
  @Override
  public float getStyleWidth() {
    return style.dimensions[DIMENSION_WIDTH];
  }

  @Override
  public void setStyleWidth(float width) {
    if (!valuesEqual(style.dimensions[DIMENSION_WIDTH], width)) {
      style.dimensions[DIMENSION_WIDTH] = width;
      dirty();
    }
  }

  /**
   * Get this node's height, as defined in the style.
   */
  @Override
  public float getStyleHeight() {
    return style.dimensions[DIMENSION_HEIGHT];
  }

  @Override
  public void setStyleHeight(float height) {
    if (!valuesEqual(style.dimensions[DIMENSION_HEIGHT], height)) {
      style.dimensions[DIMENSION_HEIGHT] = height;
      dirty();
    }
  }

  /**
   * Get this node's max width, as defined in the style
   */
  @Override
  public float getStyleMaxWidth() {
    return style.maxWidth;
  }

  @Override
  public void setStyleMaxWidth(float maxWidth) {
    if (!valuesEqual(style.maxWidth, maxWidth)) {
      style.maxWidth = maxWidth;
      dirty();
    }
  }

  /**
   * Get this node's min width, as defined in the style
   */
  @Override
  public float getStyleMinWidth() {
    return style.minWidth;
  }

  @Override
  public void setStyleMinWidth(float minWidth) {
    if (!valuesEqual(style.minWidth, minWidth)) {
      style.minWidth = minWidth;
      dirty();
    }
  }

  /**
   * Get this node's max height, as defined in the style
   */
  @Override
  public float getStyleMaxHeight() {
    return style.maxHeight;
  }

  @Override
  public void setStyleMaxHeight(float maxHeight) {
    if (!valuesEqual(style.maxHeight, maxHeight)) {
      style.maxHeight = maxHeight;
      dirty();
    }
  }

  /**
   * Get this node's min height, as defined in the style
   */
  @Override
  public float getStyleMinHeight() {
    return style.minHeight;
  }

  @Override
  public void setStyleMinHeight(float minHeight) {
    if (!valuesEqual(style.minHeight, minHeight)) {
      style.minHeight = minHeight;
      dirty();
    }
  }

  @Override
  public float getLayoutX() {
    return layout.position[POSITION_LEFT];
  }

  @Override
  public float getLayoutY() {
    return layout.position[POSITION_TOP];
  }

  @Override
  public float getLayoutWidth() {
    return layout.dimensions[DIMENSION_WIDTH];
  }

  @Override
  public float getLayoutHeight() {
    return layout.dimensions[DIMENSION_HEIGHT];
  }

  @Override
  public CSSDirection getLayoutDirection() {
    return layout.direction;
  }

  /**
   * Get this node's overflow property, as defined in the style
   */
  @Override
  public CSSOverflow getOverflow() {
    return style.overflow;
  }

  @Override
  public void setOverflow(CSSOverflow overflow) {
    if (style.overflow != overflow) {
      style.overflow = overflow;
      dirty();
    }
  }

  @Override
  public void setData(Object data) {
    mData = data;
  }

  @Override
  public Object getData() {
    return mData;
  }

  /**
   * Resets this instance to its default state. This method is meant to be used when
   * recycling {@link CSSNode} instances.
   */
  @Override
  public void reset() {
    if (mParent != null || (mChildren != null && mChildren.size() > 0)) {
      throw new IllegalStateException("You should not reset an attached CSSNode");
    }

    style.reset();
    layout.resetResult();
    lineIndex = 0;
    mLayoutState = LayoutState.DIRTY;
  }
}
