/**
 * Copyright (c) 2014-present, Facebook, Inc.
 * All rights reserved.
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

// NOTE: this file is auto-copied from https://github.com/facebook/css-layout
// @generated SignedSource<<4b95f0548441afa1e91e957a93fa6f0b>>

package com.facebook.csslayout;

import javax.annotation.Nullable;

import java.util.ArrayList;

import com.facebook.infer.annotation.Assertions;

import static com.facebook.csslayout.CSSLayout.DIMENSION_HEIGHT;
import static com.facebook.csslayout.CSSLayout.DIMENSION_WIDTH;
import static com.facebook.csslayout.CSSLayout.POSITION_BOTTOM;
import static com.facebook.csslayout.CSSLayout.POSITION_LEFT;
import static com.facebook.csslayout.CSSLayout.POSITION_RIGHT;
import static com.facebook.csslayout.CSSLayout.POSITION_TOP;

/**
 * A CSS Node. It has a style object you can manipulate at {@link #style}. After calling
 * {@link #calculateLayout()}, {@link #layout} will be filled with the results of the layout.
 */
public class CSSNode {

  private static enum LayoutState {
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

  public static interface MeasureFunction {

    /**
     * Should measure the given node and put the result in the given MeasureOutput.
     *
     * NB: measure is NOT guaranteed to be threadsafe/re-entrant safe!
     */
    public void measure(CSSNode node, float width, MeasureOutput measureOutput);
  }

  // VisibleForTesting
  /*package*/ final CSSStyle style = new CSSStyle();
  /*package*/ final CSSLayout layout = new CSSLayout();
  /*package*/ final CachedCSSLayout lastLayout = new CachedCSSLayout();

  public int lineIndex = 0;

  /*package*/ CSSNode nextAbsoluteChild;
  /*package*/ CSSNode nextFlexChild;

  private @Nullable ArrayList<CSSNode> mChildren;
  private @Nullable CSSNode mParent;
  private @Nullable MeasureFunction mMeasureFunction = null;
  private LayoutState mLayoutState = LayoutState.DIRTY;

  public int getChildCount() {
    return mChildren == null ? 0 : mChildren.size();
  }

  public CSSNode getChildAt(int i) {
    Assertions.assertNotNull(mChildren);
    return mChildren.get(i);
  }

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

  public CSSNode removeChildAt(int i) {
    Assertions.assertNotNull(mChildren);
    CSSNode removed = mChildren.remove(i);
    removed.mParent = null;
    dirty();
    return removed;
  }

  public @Nullable CSSNode getParent() {
    return mParent;
  }

  /**
   * @return the index of the given child, or -1 if the child doesn't exist in this node.
   */
  public int indexOf(CSSNode child) {
    Assertions.assertNotNull(mChildren);
    return mChildren.indexOf(child);
  }

  public void setMeasureFunction(MeasureFunction measureFunction) {
    if (mMeasureFunction != measureFunction) {
      mMeasureFunction = measureFunction;
      dirty();
    }
  }

  public boolean isMeasureDefined() {
    return mMeasureFunction != null;
  }

  /*package*/ MeasureOutput measure(MeasureOutput measureOutput, float width) {
    if (!isMeasureDefined()) {
      throw new RuntimeException("Measure function isn't defined!");
    }
    measureOutput.height = CSSConstants.UNDEFINED;
    measureOutput.width = CSSConstants.UNDEFINED;
    Assertions.assertNotNull(mMeasureFunction).measure(this, width, measureOutput);
    return measureOutput;
  }

  /**
   * Performs the actual layout and saves the results in {@link #layout}
   */
  public void calculateLayout(CSSLayoutContext layoutContext) {
    layout.resetResult();
    LayoutEngine.layoutNode(layoutContext, this, CSSConstants.UNDEFINED, null);
  }

  /**
   * See {@link LayoutState#DIRTY}.
   */
  protected boolean isDirty() {
    return mLayoutState == LayoutState.DIRTY;
  }

  /**
   * See {@link LayoutState#HAS_NEW_LAYOUT}.
   */
  public boolean hasNewLayout() {
    return mLayoutState == LayoutState.HAS_NEW_LAYOUT;
  }

  protected void dirty() {
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

  /*package*/ void markHasNewLayout() {
    mLayoutState = LayoutState.HAS_NEW_LAYOUT;
  }

  /**
   * Tells the node that the current values in {@link #layout} have been seen. Subsequent calls
   * to {@link #hasNewLayout()} will return false until this node is laid out with new parameters.
   * You must call this each time the layout is generated if the node has a new layout.
   */
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

  protected boolean valuesEqual(float f1, float f2) {
    return FloatUtil.floatsEqual(f1, f2);
  }

  /**
   * Get this node's direction, as defined in the style.
   */
  public CSSDirection getStyleDirection() {
    return style.direction;
  }

  public void setDirection(CSSDirection direction) {
    if (style.direction != direction) {
      style.direction = direction;
      dirty();
    }
  }

  /**
   * Get this node's flex direction, as defined by style.
   */
  public CSSFlexDirection getFlexDirection() {
    return style.flexDirection;
  }

  public void setFlexDirection(CSSFlexDirection flexDirection) {
    if (style.flexDirection != flexDirection) {
      style.flexDirection = flexDirection;
      dirty();
    }
  }

  /**
   * Get this node's justify content, as defined by style.
   */
  public CSSJustify getJustifyContent() {
    return style.justifyContent;
  }

  public void setJustifyContent(CSSJustify justifyContent) {
    if (style.justifyContent != justifyContent) {
      style.justifyContent = justifyContent;
      dirty();
    }
  }

  /**
   * Get this node's align items, as defined by style.
   */
  public CSSAlign getAlignItems() {
    return style.alignItems;
  }

  public void setAlignItems(CSSAlign alignItems) {
    if (style.alignItems != alignItems) {
      style.alignItems = alignItems;
      dirty();
    }
  }

  /**
   * Get this node's align items, as defined by style.
   */
  public CSSAlign getAlignSelf() {
    return style.alignSelf;
  }

  public void setAlignSelf(CSSAlign alignSelf) {
    if (style.alignSelf != alignSelf) {
      style.alignSelf = alignSelf;
      dirty();
    }
  }

  /**
   * Get this node's position type, as defined by style.
   */
  public CSSPositionType getPositionType() {
    return style.positionType;
  }

  public void setPositionType(CSSPositionType positionType) {
    if (style.positionType != positionType) {
      style.positionType = positionType;
      dirty();
    }
  }

  public void setWrap(CSSWrap flexWrap) {
    if (style.flexWrap != flexWrap) {
      style.flexWrap = flexWrap;
      dirty();
    }
  }

  /**
   * Get this node's flex, as defined by style.
   */
  public float getFlex() {
    return style.flex;
  }

  public void setFlex(float flex) {
    if (!valuesEqual(style.flex, flex)) {
      style.flex = flex;
      dirty();
    }
  }

  /**
   * Get this node's margin, as defined by style + default margin.
   */
  public Spacing getMargin() {
    return style.margin;
  }

  public void setMargin(int spacingType, float margin) {
    if (style.margin.set(spacingType, margin)) {
      dirty();
    }
  }

  /**
   * Get this node's padding, as defined by style + default padding.
   */
  public Spacing getPadding() {
    return style.padding;
  }

  public void setPadding(int spacingType, float padding) {
    if (style.padding.set(spacingType, padding)) {
      dirty();
    }
  }

  /**
   * Get this node's border, as defined by style.
   */
  public Spacing getBorder() {
    return style.border;
  }

  public void setBorder(int spacingType, float border) {
    if (style.border.set(spacingType, border)) {
      dirty();
    }
  }

  /**
   * Get this node's position top, as defined by style.
   */
  public float getPositionTop() {
    return style.position[POSITION_TOP];
  }

  public void setPositionTop(float positionTop) {
    if (!valuesEqual(style.position[POSITION_TOP], positionTop)) {
      style.position[POSITION_TOP] = positionTop;
      dirty();
    }
  }

  /**
   * Get this node's position bottom, as defined by style.
   */
  public float getPositionBottom() {
    return style.position[POSITION_BOTTOM];
  }

  public void setPositionBottom(float positionBottom) {
    if (!valuesEqual(style.position[POSITION_BOTTOM], positionBottom)) {
      style.position[POSITION_BOTTOM] = positionBottom;
      dirty();
    }
  }

  /**
   * Get this node's position left, as defined by style.
   */
  public float getPositionLeft() {
    return style.position[POSITION_LEFT];
  }

  public void setPositionLeft(float positionLeft) {
    if (!valuesEqual(style.position[POSITION_LEFT], positionLeft)) {
      style.position[POSITION_LEFT] = positionLeft;
      dirty();
    }
  }

  /**
   * Get this node's position right, as defined by style.
   */
  public float getPositionRight() {
    return style.position[POSITION_RIGHT];
  }

  public void setPositionRight(float positionRight) {
    if (!valuesEqual(style.position[POSITION_RIGHT], positionRight)) {
      style.position[POSITION_RIGHT] = positionRight;
      dirty();
    }
  }

  /**
   * Get this node's width, as defined in the style.
   */
  public float getStyleWidth() {
    return style.dimensions[DIMENSION_WIDTH];
  }

  public void setStyleWidth(float width) {
    if (!valuesEqual(style.dimensions[DIMENSION_WIDTH], width)) {
      style.dimensions[DIMENSION_WIDTH] = width;
      dirty();
    }
  }

  /**
   * Get this node's height, as defined in the style.
   */
  public float getStyleHeight() {
    return style.dimensions[DIMENSION_HEIGHT];
  }

  public void setStyleHeight(float height) {
    if (!valuesEqual(style.dimensions[DIMENSION_HEIGHT], height)) {
      style.dimensions[DIMENSION_HEIGHT] = height;
      dirty();
    }
  }

  public float getLayoutX() {
    return layout.position[POSITION_LEFT];
  }

  public float getLayoutY() {
    return layout.position[POSITION_TOP];
  }

  public float getLayoutWidth() {
    return layout.dimensions[DIMENSION_WIDTH];
  }

  public float getLayoutHeight() {
    return layout.dimensions[DIMENSION_HEIGHT];
  }

  public CSSDirection getLayoutDirection() {
    return layout.direction;
  }

  /**
   * Set a default padding (left/top/right/bottom) for this node.
   */
  public void setDefaultPadding(int spacingType, float padding) {
    if (style.padding.setDefault(spacingType, padding)) {
      dirty();
    }
  }

  /**
   * Resets this instance to its default state. This method is meant to be used when
   * recycling {@link CSSNode} instances.
   */
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
