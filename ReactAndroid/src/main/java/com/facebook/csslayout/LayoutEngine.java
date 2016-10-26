/**
 * Copyright (c) 2014-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.csslayout;

import com.facebook.infer.annotation.Assertions;

import static com.facebook.csslayout.CSSLayout.DIMENSION_HEIGHT;
import static com.facebook.csslayout.CSSLayout.DIMENSION_WIDTH;
import static com.facebook.csslayout.CSSLayout.POSITION_BOTTOM;
import static com.facebook.csslayout.CSSLayout.POSITION_LEFT;
import static com.facebook.csslayout.CSSLayout.POSITION_RIGHT;
import static com.facebook.csslayout.CSSLayout.POSITION_TOP;

/**
 * Calculates layouts based on CSS style. See {@link #layoutNode(CSSNodeDEPRECATED, float, float)}.
 */
public class LayoutEngine {

  private static final int CSS_FLEX_DIRECTION_COLUMN =
      CSSFlexDirection.COLUMN.ordinal();
  private static final int CSS_FLEX_DIRECTION_COLUMN_REVERSE =
      CSSFlexDirection.COLUMN_REVERSE.ordinal();
  private static final int CSS_FLEX_DIRECTION_ROW =
      CSSFlexDirection.ROW.ordinal();
  private static final int CSS_FLEX_DIRECTION_ROW_REVERSE =
      CSSFlexDirection.ROW_REVERSE.ordinal();

  private static final int CSS_POSITION_RELATIVE = CSSPositionType.RELATIVE.ordinal();
  private static final int CSS_POSITION_ABSOLUTE = CSSPositionType.ABSOLUTE.ordinal();

  private static final int[] leading = {
      POSITION_TOP,
      POSITION_BOTTOM,
      POSITION_LEFT,
      POSITION_RIGHT,
  };

  private static final int[] trailing = {
      POSITION_BOTTOM,
      POSITION_TOP,
      POSITION_RIGHT,
      POSITION_LEFT,
  };

  private static final int[] pos = {
      POSITION_TOP,
      POSITION_BOTTOM,
      POSITION_LEFT,
      POSITION_RIGHT,
  };

  private static final int[] dim = {
      DIMENSION_HEIGHT,
      DIMENSION_HEIGHT,
      DIMENSION_WIDTH,
      DIMENSION_WIDTH,
  };

  private static final int[] leadingSpacing = {
      Spacing.TOP,
      Spacing.BOTTOM,
      Spacing.START,
      Spacing.START
  };

  private static final int[] trailingSpacing = {
      Spacing.BOTTOM,
      Spacing.TOP,
      Spacing.END,
      Spacing.END
  };

  private static boolean isFlexBasisAuto(CSSNodeDEPRECATED node) {
    return CSSConstants.isUndefined(node.style.flexBasis);
  }

  private static float getFlexGrowFactor(CSSNodeDEPRECATED node) {
    return node.style.flexGrow;
  }

  private static float getFlexShrinkFactor(CSSNodeDEPRECATED node) {
    return node.style.flexShrink;
  }


  private static float boundAxisWithinMinAndMax(CSSNodeDEPRECATED node, int axis, float value) {
    float min = CSSConstants.UNDEFINED;
    float max = CSSConstants.UNDEFINED;

    if (axis == CSS_FLEX_DIRECTION_COLUMN ||
        axis == CSS_FLEX_DIRECTION_COLUMN_REVERSE) {
      min = node.style.minHeight;
      max = node.style.maxHeight;
    } else if (axis == CSS_FLEX_DIRECTION_ROW ||
               axis == CSS_FLEX_DIRECTION_ROW_REVERSE) {
      min = node.style.minWidth;
      max = node.style.maxWidth;
    }

    float boundValue = value;

    if (!Float.isNaN(max) && max >= 0.0 && boundValue > max) {
      boundValue = max;
    }
    if (!Float.isNaN(min) && min >= 0.0 && boundValue < min) {
      boundValue = min;
    }

    return boundValue;
  }

  private static float boundAxis(CSSNodeDEPRECATED node, int axis, float value) {
    float paddingAndBorderAxis =
      node.style.padding.getWithFallback(leadingSpacing[axis], leading[axis]) +
      node.style.border.getWithFallback(leadingSpacing[axis], leading[axis]) +
      node.style.padding.getWithFallback(trailingSpacing[axis], trailing[axis]) +
      node.style.border.getWithFallback(trailingSpacing[axis], trailing[axis]);
    return Math.max(boundAxisWithinMinAndMax(node, axis, value), paddingAndBorderAxis);
  }

  private static float getRelativePosition(CSSNodeDEPRECATED node, int axis) {
    float lead = node.style.position.getWithFallback(leadingSpacing[axis], leading[axis]);
    if (!Float.isNaN(lead)) {
      return lead;
    }

    float trailingPos = node.style.position.getWithFallback(trailingSpacing[axis], trailing[axis]);
    return Float.isNaN(trailingPos) ? 0 : -trailingPos;
  }

  private static void setPosition(CSSNodeDEPRECATED node, CSSDirection direction) {
    int mainAxis = resolveAxis(getFlexDirection(node), direction);
    int crossAxis = getCrossFlexDirection(mainAxis, direction);

    node.layout.position[leading[mainAxis]] = node.style.margin.getWithFallback(leadingSpacing[mainAxis], leading[mainAxis]) +
      getRelativePosition(node, mainAxis);
    node.layout.position[trailing[mainAxis]] = node.style.margin.getWithFallback(trailingSpacing[mainAxis], trailing[mainAxis]) +
      getRelativePosition(node, mainAxis);
    node.layout.position[leading[crossAxis]] = node.style.margin.getWithFallback(leadingSpacing[crossAxis], leading[crossAxis]) +
      getRelativePosition(node, crossAxis);
    node.layout.position[trailing[crossAxis]] = node.style.margin.getWithFallback(trailingSpacing[crossAxis], trailing[crossAxis]) +
      getRelativePosition(node, crossAxis);
  }

  private static int resolveAxis(
      int axis,
      CSSDirection direction) {
    if (direction == CSSDirection.RTL) {
      if (axis == CSS_FLEX_DIRECTION_ROW) {
        return CSS_FLEX_DIRECTION_ROW_REVERSE;
      } else if (axis == CSS_FLEX_DIRECTION_ROW_REVERSE) {
        return CSS_FLEX_DIRECTION_ROW;
      }
    }

    return axis;
  }

  private static CSSDirection resolveDirection(CSSNodeDEPRECATED node, CSSDirection parentDirection) {
    CSSDirection direction = node.style.direction;
    if (direction == CSSDirection.INHERIT) {
      direction = (parentDirection == null ? CSSDirection.LTR : parentDirection);
    }

    return direction;
  }

  private static int getFlexDirection(CSSNodeDEPRECATED node) {
    return node.style.flexDirection.ordinal();
  }

  private static int getCrossFlexDirection(
      int axis,
      CSSDirection direction) {
    if (axis == CSS_FLEX_DIRECTION_COLUMN ||
        axis == CSS_FLEX_DIRECTION_COLUMN_REVERSE) {
      return resolveAxis(CSS_FLEX_DIRECTION_ROW, direction);
    } else {
      return CSS_FLEX_DIRECTION_COLUMN;
    }
  }

  private static CSSAlign getAlignItem(CSSNodeDEPRECATED node, CSSNodeDEPRECATED child) {
    if (child.style.alignSelf != CSSAlign.AUTO) {
      return child.style.alignSelf;
    }
    return node.style.alignItems;
  }

  private static boolean isMeasureDefined(CSSNodeDEPRECATED node) {
    return node.isMeasureDefined();
  }

  /*package*/ static void layoutNode(
      CSSLayoutContext layoutContext,
      CSSNodeDEPRECATED node,
      float availableWidth,
      float availableHeight,
      CSSDirection parentDirection) {
    // Increment the generation count. This will force the recursive routine to visit
    // all dirty nodes at least once. Subsequent visits will be skipped if the input
    // parameters don't change.
    layoutContext.currentGenerationCount++;

    CSSMeasureMode widthMeasureMode = CSSMeasureMode.UNDEFINED;
    CSSMeasureMode heightMeasureMode = CSSMeasureMode.UNDEFINED;

    if (!Float.isNaN(availableWidth)) {
      widthMeasureMode = CSSMeasureMode.EXACTLY;
    } else if (node.style.dimensions[DIMENSION_WIDTH] >= 0.0) {
      float marginAxisRow = (node.style.margin.getWithFallback(leadingSpacing[CSS_FLEX_DIRECTION_ROW], leading[CSS_FLEX_DIRECTION_ROW]) + node.style.margin.getWithFallback(trailingSpacing[CSS_FLEX_DIRECTION_ROW], trailing[CSS_FLEX_DIRECTION_ROW]));
      availableWidth = node.style.dimensions[DIMENSION_WIDTH] + marginAxisRow;
      widthMeasureMode = CSSMeasureMode.EXACTLY;
    } else if (node.style.maxWidth >= 0.0) {
      availableWidth = node.style.maxWidth;
      widthMeasureMode = CSSMeasureMode.AT_MOST;
    }

    if (!Float.isNaN(availableHeight)) {
      heightMeasureMode = CSSMeasureMode.EXACTLY;
    } else if (node.style.dimensions[DIMENSION_HEIGHT] >= 0.0) {
      float marginAxisColumn = (node.style.margin.getWithFallback(leadingSpacing[CSS_FLEX_DIRECTION_COLUMN], leading[CSS_FLEX_DIRECTION_COLUMN]) + node.style.margin.getWithFallback(trailingSpacing[CSS_FLEX_DIRECTION_COLUMN], trailing[CSS_FLEX_DIRECTION_COLUMN]));
      availableHeight = node.style.dimensions[DIMENSION_HEIGHT] + marginAxisColumn;
      heightMeasureMode = CSSMeasureMode.EXACTLY;
    } else if (node.style.maxHeight >= 0.0) {
      availableHeight = node.style.maxHeight;
      heightMeasureMode = CSSMeasureMode.AT_MOST;
    }

    if (layoutNodeInternal(layoutContext, node, availableWidth, availableHeight, parentDirection, widthMeasureMode, heightMeasureMode, true, "initial")) {
      setPosition(node, node.layout.direction);
    }
  }

  /*package*/ static boolean canUseCachedMeasurement(
      boolean isTextNode,
      float availableWidth,
      float availableHeight,
      float marginRow,
      float marginColumn,
      CSSMeasureMode widthMeasureMode,
      CSSMeasureMode heightMeasureMode,
      CSSCachedMeasurement cachedLayout) {

    boolean isHeightSame =
      (cachedLayout.heightMeasureMode == CSSMeasureMode.UNDEFINED && heightMeasureMode == CSSMeasureMode.UNDEFINED) ||
        (cachedLayout.heightMeasureMode == heightMeasureMode && FloatUtil.floatsEqual(cachedLayout.availableHeight, availableHeight));

    boolean isWidthSame =
      (cachedLayout.widthMeasureMode == CSSMeasureMode.UNDEFINED && widthMeasureMode == CSSMeasureMode.UNDEFINED) ||
        (cachedLayout.widthMeasureMode == widthMeasureMode && FloatUtil.floatsEqual(cachedLayout.availableWidth, availableWidth));

    if (isHeightSame && isWidthSame) {
      return true;
    }

    boolean isHeightValid =
      (cachedLayout.heightMeasureMode == CSSMeasureMode.UNDEFINED && heightMeasureMode == CSSMeasureMode.AT_MOST && cachedLayout.computedHeight <= (availableHeight - marginColumn)) ||
        (heightMeasureMode == CSSMeasureMode.EXACTLY && FloatUtil.floatsEqual(cachedLayout.computedHeight, availableHeight - marginColumn));

    if (isWidthSame && isHeightValid) {
      return true;
    }

    boolean isWidthValid =
      (cachedLayout.widthMeasureMode == CSSMeasureMode.UNDEFINED && widthMeasureMode == CSSMeasureMode.AT_MOST && cachedLayout.computedWidth <= (availableWidth - marginRow)) ||
        (widthMeasureMode == CSSMeasureMode.EXACTLY && FloatUtil.floatsEqual(cachedLayout.computedWidth, availableWidth - marginRow));

    if (isHeightSame && isWidthValid) {
      return true;
    }

    if (isHeightValid && isWidthValid) {
      return true;
    }

    // We know this to be text so we can apply some more specialized heuristics.
    if (isTextNode) {
      if (isWidthSame) {
        if (heightMeasureMode == CSSMeasureMode.UNDEFINED) {
          // Width is the same and height is not restricted. Re-use cahced value.
          return true;
        }

        if (heightMeasureMode == CSSMeasureMode.AT_MOST &&
            cachedLayout.computedHeight < (availableHeight - marginColumn)) {
          // Width is the same and height restriction is greater than the cached height. Re-use cached value.
          return true;
        }

        // Width is the same but height restriction imposes smaller height than previously measured.
        // Update the cached value to respect the new height restriction.
        cachedLayout.computedHeight = availableHeight - marginColumn;
        return true;
      }

      if (cachedLayout.widthMeasureMode == CSSMeasureMode.UNDEFINED) {
        if (widthMeasureMode == CSSMeasureMode.UNDEFINED ||
             (widthMeasureMode == CSSMeasureMode.AT_MOST &&
              cachedLayout.computedWidth <= (availableWidth - marginRow))) {
          // Previsouly this text was measured with no width restriction, if width is now restricted
          // but to a larger value than the previsouly measured width we can re-use the measurement
          // as we know it will fit.
          return true;
        }
      }
    }

    return false;
  }

  //
  // This is a wrapper around the layoutNodeImpl function. It determines
  // whether the layout request is redundant and can be skipped.
  //
  // Parameters:
  //  Input parameters are the same as layoutNodeImpl (see below)
  //  Return parameter is true if layout was performed, false if skipped
  //
  private static boolean layoutNodeInternal(
      CSSLayoutContext layoutContext,
      CSSNodeDEPRECATED node,
      float availableWidth,
      float availableHeight,
      CSSDirection parentDirection,
      CSSMeasureMode widthMeasureMode,
      CSSMeasureMode heightMeasureMode,
      boolean performLayout,
      String reason) {
    CSSLayout layout = node.layout;

    boolean needToVisitNode = (node.isDirty() && layout.generationCount != layoutContext.currentGenerationCount) ||
      layout.lastParentDirection != parentDirection;

    if (needToVisitNode) {
      // Invalidate the cached results.
      layout.nextCachedMeasurementsIndex = 0;
      layout.cachedLayout.widthMeasureMode = null;
      layout.cachedLayout.heightMeasureMode = null;
    }

    CSSCachedMeasurement cachedResults = null;

    // Determine whether the results are already cached. We maintain a separate
    // cache for layouts and measurements. A layout operation modifies the positions
    // and dimensions for nodes in the subtree. The algorithm assumes that each node
    // gets layed out a maximum of one time per tree layout, but multiple measurements
    // may be required to resolve all of the flex dimensions.
    // We handle nodes with measure functions specially here because they are the most
    // expensive to measure, so it's worth avoiding redundant measurements if at all possible.
    if (isMeasureDefined(node)) {
      float marginAxisRow =
        node.style.margin.getWithFallback(leadingSpacing[CSS_FLEX_DIRECTION_ROW], leading[CSS_FLEX_DIRECTION_ROW]) +
        node.style.margin.getWithFallback(trailingSpacing[CSS_FLEX_DIRECTION_ROW], trailing[CSS_FLEX_DIRECTION_ROW]);
      float marginAxisColumn =
        node.style.margin.getWithFallback(leadingSpacing[CSS_FLEX_DIRECTION_COLUMN], leading[CSS_FLEX_DIRECTION_COLUMN]) +
        node.style.margin.getWithFallback(trailingSpacing[CSS_FLEX_DIRECTION_COLUMN], trailing[CSS_FLEX_DIRECTION_COLUMN]);

      // First, try to use the layout cache.
      if (canUseCachedMeasurement(node.isTextNode(), availableWidth, availableHeight, marginAxisRow, marginAxisColumn,
          widthMeasureMode, heightMeasureMode, layout.cachedLayout)) {
        cachedResults = layout.cachedLayout;
      } else {
        // Try to use the measurement cache.
        for (int i = 0; i < layout.nextCachedMeasurementsIndex; i++) {
          if (canUseCachedMeasurement(node.isTextNode(), availableWidth, availableHeight, marginAxisRow, marginAxisColumn,
              widthMeasureMode, heightMeasureMode, layout.cachedMeasurements[i])) {
            cachedResults = layout.cachedMeasurements[i];
            break;
          }
        }
      }
    } else if (performLayout) {
      if (FloatUtil.floatsEqual(layout.cachedLayout.availableWidth, availableWidth) &&
          FloatUtil.floatsEqual(layout.cachedLayout.availableHeight, availableHeight) &&
          layout.cachedLayout.widthMeasureMode == widthMeasureMode &&
          layout.cachedLayout.heightMeasureMode == heightMeasureMode) {

        cachedResults = layout.cachedLayout;
      }
    } else {
      for (int i = 0; i < layout.nextCachedMeasurementsIndex; i++) {
        if (FloatUtil.floatsEqual(layout.cachedMeasurements[i].availableWidth, availableWidth) &&
            FloatUtil.floatsEqual(layout.cachedMeasurements[i].availableHeight, availableHeight) &&
            layout.cachedMeasurements[i].widthMeasureMode == widthMeasureMode &&
            layout.cachedMeasurements[i].heightMeasureMode == heightMeasureMode) {

          cachedResults = layout.cachedMeasurements[i];
          break;
        }
      }
    }

    if (!needToVisitNode && cachedResults != null) {
      layout.measuredDimensions[DIMENSION_WIDTH] = cachedResults.computedWidth;
      layout.measuredDimensions[DIMENSION_HEIGHT] = cachedResults.computedHeight;
    } else {
      layoutNodeImpl(layoutContext, node, availableWidth, availableHeight, parentDirection, widthMeasureMode, heightMeasureMode, performLayout);

      layout.lastParentDirection = parentDirection;

      if (cachedResults == null) {
        if (layout.nextCachedMeasurementsIndex == CSSLayout.MAX_CACHED_RESULT_COUNT) {
          layout.nextCachedMeasurementsIndex = 0;
        }

        CSSCachedMeasurement newCacheEntry = null;
        if (performLayout) {
          // Use the single layout cache entry.
          newCacheEntry = layout.cachedLayout;
        } else {
          // Allocate a new measurement cache entry.
          newCacheEntry = layout.cachedMeasurements[layout.nextCachedMeasurementsIndex];
          if (newCacheEntry == null) {
            newCacheEntry = new CSSCachedMeasurement();
            layout.cachedMeasurements[layout.nextCachedMeasurementsIndex] = newCacheEntry;
          }
          layout.nextCachedMeasurementsIndex++;
        }

        newCacheEntry.availableWidth = availableWidth;
        newCacheEntry.availableHeight = availableHeight;
        newCacheEntry.widthMeasureMode = widthMeasureMode;
        newCacheEntry.heightMeasureMode = heightMeasureMode;
        newCacheEntry.computedWidth = layout.measuredDimensions[DIMENSION_WIDTH];
        newCacheEntry.computedHeight = layout.measuredDimensions[DIMENSION_HEIGHT];
      }
    }

    if (performLayout) {
      node.layout.dimensions[DIMENSION_WIDTH] = node.layout.measuredDimensions[DIMENSION_WIDTH];
      node.layout.dimensions[DIMENSION_HEIGHT] = node.layout.measuredDimensions[DIMENSION_HEIGHT];
      node.markHasNewLayout();
    }

    layout.generationCount = layoutContext.currentGenerationCount;
    return (needToVisitNode || cachedResults == null);
  }


  //
  // This is the main routine that implements a subset of the flexbox layout algorithm
  // described in the W3C CSS documentation: https://www.w3.org/TR/css3-flexbox/.
  //
  // Limitations of this algorithm, compared to the full standard:
  //  * Display property is always assumed to be 'flex' except for Text nodes, which
  //    are assumed to be 'inline-flex'.
  //  * The 'zIndex' property (or any form of z ordering) is not supported. Nodes are
  //    stacked in document order.
  //  * The 'order' property is not supported. The order of flex items is always defined
  //    by document order.
  //  * The 'visibility' property is always assumed to be 'visible'. Values of 'collapse'
  //    and 'hidden' are not supported.
  //  * The 'wrap' property supports only 'nowrap' (which is the default) or 'wrap'. The
  //    rarely-used 'wrap-reverse' is not supported.
  //  * Rather than allowing arbitrary combinations of flexGrow, flexShrink and
  //    flexBasis, this algorithm supports only the three most common combinations:
  //      flex: 0 is equiavlent to flex: 0 0 auto
  //      flex: n (where n is a positive value) is equivalent to flex: n 1 auto
  //          If POSITIVE_FLEX_IS_AUTO is 0, then it is equivalent to flex: n 0 0
  //          This is faster because the content doesn't need to be measured, but it's
  //          less flexible because the basis is always 0 and can't be overriden with
  //          the width/height attributes.
  //      flex: -1 (or any negative value) is equivalent to flex: 0 1 auto
  //  * Margins cannot be specified as 'auto'. They must be specified in terms of pixel
  //    values, and the default value is 0.
  //  * The 'baseline' value is not supported for alignItems and alignSelf properties.
  //  * Values of width, maxWidth, minWidth, height, maxHeight and minHeight must be
  //    specified as pixel values, not as percentages.
  //  * There is no support for calculation of dimensions based on intrinsic aspect ratios
  //     (e.g. images).
  //  * There is no support for forced breaks.
  //  * It does not support vertical inline directions (top-to-bottom or bottom-to-top text).
  //
  // Deviations from standard:
  //  * Section 4.5 of the spec indicates that all flex items have a default minimum
  //    main size. For text blocks, for example, this is the width of the widest word.
  //    Calculating the minimum width is expensive, so we forego it and assume a default
  //    minimum main size of 0.
  //  * Min/Max sizes in the main axis are not honored when resolving flexible lengths.
  //  * The spec indicates that the default value for 'flexDirection' is 'row', but
  //    the algorithm below assumes a default of 'column'.
  //
  // Input parameters:
  //    - node: current node to be sized and layed out
  //    - availableWidth & availableHeight: available size to be used for sizing the node
  //      or CSS_UNDEFINED if the size is not available; interpretation depends on layout
  //      flags
  //    - parentDirection: the inline (text) direction within the parent (left-to-right or
  //      right-to-left)
  //    - widthMeasureMode: indicates the sizing rules for the width (see below for explanation)
  //    - heightMeasureMode: indicates the sizing rules for the height (see below for explanation)
  //    - performLayout: specifies whether the caller is interested in just the dimensions
  //      of the node or it requires the entire node and its subtree to be layed out
  //      (with final positions)
  //
  // Details:
  //    This routine is called recursively to lay out subtrees of flexbox elements. It uses the
  //    information in node.style, which is treated as a read-only input. It is responsible for
  //    setting the layout.direction and layout.measured_dimensions fields for the input node as well
  //    as the layout.position and layout.line_index fields for its child nodes. The
  //    layout.measured_dimensions field includes any border or padding for the node but does
  //    not include margins.
  //
  //    The spec describes four different layout modes: "fill available", "max content", "min content",
  //    and "fit content". Of these, we don't use "min content" because we don't support default
  //    minimum main sizes (see above for details). Each of our measure modes maps to a layout mode
  //    from the spec (https://www.w3.org/TR/css3-sizing/#terms):
  //      - CSS_MEASURE_MODE_UNDEFINED: max content
  //      - CSS_MEASURE_MODE_EXACTLY: fill available
  //      - CSS_MEASURE_MODE_AT_MOST: fit content
  //
  //    When calling layoutNodeImpl and layoutNodeInternal, if the caller passes an available size of
  //    undefined then it must also pass a measure mode of CSS_MEASURE_MODE_UNDEFINED in that dimension.
  //
  private static void layoutNodeImpl(
      CSSLayoutContext layoutContext,
      CSSNodeDEPRECATED node,
      float availableWidth,
      float availableHeight,
      CSSDirection parentDirection,
      CSSMeasureMode widthMeasureMode,
      CSSMeasureMode heightMeasureMode,
      boolean performLayout) {

    Assertions.assertCondition(Float.isNaN(availableWidth) ? widthMeasureMode == CSSMeasureMode.UNDEFINED : true, "availableWidth is indefinite so widthMeasureMode must be CSSMeasureMode.UNDEFINED");
    Assertions.assertCondition(Float.isNaN(availableHeight) ? heightMeasureMode == CSSMeasureMode.UNDEFINED : true, "availableHeight is indefinite so heightMeasureMode must be CSSMeasureMode.UNDEFINED");

    float paddingAndBorderAxisRow = ((node.style.padding.getWithFallback(leadingSpacing[CSS_FLEX_DIRECTION_ROW], leading[CSS_FLEX_DIRECTION_ROW]) + node.style.border.getWithFallback(leadingSpacing[CSS_FLEX_DIRECTION_ROW], leading[CSS_FLEX_DIRECTION_ROW])) + (node.style.padding.getWithFallback(trailingSpacing[CSS_FLEX_DIRECTION_ROW], trailing[CSS_FLEX_DIRECTION_ROW]) + node.style.border.getWithFallback(trailingSpacing[CSS_FLEX_DIRECTION_ROW], trailing[CSS_FLEX_DIRECTION_ROW])));
    float paddingAndBorderAxisColumn = ((node.style.padding.getWithFallback(leadingSpacing[CSS_FLEX_DIRECTION_COLUMN], leading[CSS_FLEX_DIRECTION_COLUMN]) + node.style.border.getWithFallback(leadingSpacing[CSS_FLEX_DIRECTION_COLUMN], leading[CSS_FLEX_DIRECTION_COLUMN])) + (node.style.padding.getWithFallback(trailingSpacing[CSS_FLEX_DIRECTION_COLUMN], trailing[CSS_FLEX_DIRECTION_COLUMN]) + node.style.border.getWithFallback(trailingSpacing[CSS_FLEX_DIRECTION_COLUMN], trailing[CSS_FLEX_DIRECTION_COLUMN])));
    float marginAxisRow = (node.style.margin.getWithFallback(leadingSpacing[CSS_FLEX_DIRECTION_ROW], leading[CSS_FLEX_DIRECTION_ROW]) + node.style.margin.getWithFallback(trailingSpacing[CSS_FLEX_DIRECTION_ROW], trailing[CSS_FLEX_DIRECTION_ROW]));
    float marginAxisColumn = (node.style.margin.getWithFallback(leadingSpacing[CSS_FLEX_DIRECTION_COLUMN], leading[CSS_FLEX_DIRECTION_COLUMN]) + node.style.margin.getWithFallback(trailingSpacing[CSS_FLEX_DIRECTION_COLUMN], trailing[CSS_FLEX_DIRECTION_COLUMN]));

    // Set the resolved resolution in the node's layout.
    CSSDirection direction = resolveDirection(node, parentDirection);
    node.layout.direction = direction;

    // For content (text) nodes, determine the dimensions based on the text contents.
    if (isMeasureDefined(node)) {
      float innerWidth = availableWidth - marginAxisRow - paddingAndBorderAxisRow;
      float innerHeight = availableHeight - marginAxisColumn - paddingAndBorderAxisColumn;

      if (widthMeasureMode == CSSMeasureMode.EXACTLY && heightMeasureMode == CSSMeasureMode.EXACTLY) {

        // Don't bother sizing the text if both dimensions are already defined.
        node.layout.measuredDimensions[DIMENSION_WIDTH] = boundAxis(node, CSS_FLEX_DIRECTION_ROW, availableWidth - marginAxisRow);
        node.layout.measuredDimensions[DIMENSION_HEIGHT] = boundAxis(node, CSS_FLEX_DIRECTION_COLUMN, availableHeight - marginAxisColumn);
      } else if (innerWidth <= 0 || innerHeight <= 0) {

        // Don't bother sizing the text if there's no horizontal or vertical space.
        node.layout.measuredDimensions[DIMENSION_WIDTH] = boundAxis(node, CSS_FLEX_DIRECTION_ROW, 0);
        node.layout.measuredDimensions[DIMENSION_HEIGHT] = boundAxis(node, CSS_FLEX_DIRECTION_COLUMN, 0);
      } else {

        // Measure the text under the current constraints.
        MeasureOutput measureDim = node.measure(

          layoutContext.measureOutput,
          innerWidth,
          widthMeasureMode,
          innerHeight,
          heightMeasureMode
        );

        node.layout.measuredDimensions[DIMENSION_WIDTH] = boundAxis(node, CSS_FLEX_DIRECTION_ROW,
          (widthMeasureMode == CSSMeasureMode.UNDEFINED || widthMeasureMode == CSSMeasureMode.AT_MOST) ?
            measureDim.width + paddingAndBorderAxisRow :
            availableWidth - marginAxisRow);
        node.layout.measuredDimensions[DIMENSION_HEIGHT] = boundAxis(node, CSS_FLEX_DIRECTION_COLUMN,
          (heightMeasureMode == CSSMeasureMode.UNDEFINED || heightMeasureMode == CSSMeasureMode.AT_MOST) ?
            measureDim.height + paddingAndBorderAxisColumn :
            availableHeight - marginAxisColumn);
      }

      return;
    }

    // For nodes with no children, use the available values if they were provided, or
    // the minimum size as indicated by the padding and border sizes.
    int childCount = node.getChildCount();
    if (childCount == 0) {
      node.layout.measuredDimensions[DIMENSION_WIDTH] = boundAxis(node, CSS_FLEX_DIRECTION_ROW,
        (widthMeasureMode == CSSMeasureMode.UNDEFINED || widthMeasureMode == CSSMeasureMode.AT_MOST) ?
          paddingAndBorderAxisRow :
          availableWidth - marginAxisRow);
      node.layout.measuredDimensions[DIMENSION_HEIGHT] = boundAxis(node, CSS_FLEX_DIRECTION_COLUMN,
        (heightMeasureMode == CSSMeasureMode.UNDEFINED || heightMeasureMode == CSSMeasureMode.AT_MOST) ?
          paddingAndBorderAxisColumn :
          availableHeight - marginAxisColumn);
      return;
    }

    // If we're not being asked to perform a full layout, we can handle a number of common
    // cases here without incurring the cost of the remaining function.
    if (!performLayout) {
      // If we're being asked to size the content with an at most constraint but there is no available width,
      // the measurement will always be zero.
      if (widthMeasureMode == CSSMeasureMode.AT_MOST && availableWidth <= 0 &&
          heightMeasureMode == CSSMeasureMode.AT_MOST && availableHeight <= 0) {
        node.layout.measuredDimensions[DIMENSION_WIDTH] = boundAxis(node, CSS_FLEX_DIRECTION_ROW, 0);
        node.layout.measuredDimensions[DIMENSION_HEIGHT] = boundAxis(node, CSS_FLEX_DIRECTION_COLUMN, 0);
        return;
      }

      if (widthMeasureMode == CSSMeasureMode.AT_MOST && availableWidth <= 0) {
        node.layout.measuredDimensions[DIMENSION_WIDTH] = boundAxis(node, CSS_FLEX_DIRECTION_ROW, 0);
        node.layout.measuredDimensions[DIMENSION_HEIGHT] = boundAxis(node, CSS_FLEX_DIRECTION_COLUMN, Float.isNaN(availableHeight) ? 0 : (availableHeight - marginAxisColumn));
        return;
      }

      if (heightMeasureMode == CSSMeasureMode.AT_MOST && availableHeight <= 0) {
        node.layout.measuredDimensions[DIMENSION_WIDTH] = boundAxis(node, CSS_FLEX_DIRECTION_ROW, Float.isNaN(availableWidth) ? 0 : (availableWidth - marginAxisRow));
        node.layout.measuredDimensions[DIMENSION_HEIGHT] = boundAxis(node, CSS_FLEX_DIRECTION_COLUMN, 0);
        return;
      }

      // If we're being asked to use an exact width/height, there's no need to measure the children.
      if (widthMeasureMode == CSSMeasureMode.EXACTLY && heightMeasureMode == CSSMeasureMode.EXACTLY) {
        node.layout.measuredDimensions[DIMENSION_WIDTH] = boundAxis(node, CSS_FLEX_DIRECTION_ROW, availableWidth - marginAxisRow);
        node.layout.measuredDimensions[DIMENSION_HEIGHT] = boundAxis(node, CSS_FLEX_DIRECTION_COLUMN, availableHeight - marginAxisColumn);
        return;
      }
    }

    // STEP 1: CALCULATE VALUES FOR REMAINDER OF ALGORITHM
    int mainAxis = resolveAxis(getFlexDirection(node), direction);
    int crossAxis = getCrossFlexDirection(mainAxis, direction);
    boolean isMainAxisRow = (mainAxis == CSS_FLEX_DIRECTION_ROW || mainAxis == CSS_FLEX_DIRECTION_ROW_REVERSE);
    CSSJustify justifyContent = node.style.justifyContent;
    boolean isNodeFlexWrap = (node.style.flexWrap == CSSWrap.WRAP);

    CSSNodeDEPRECATED firstAbsoluteChild = null;
    CSSNodeDEPRECATED currentAbsoluteChild = null;

    float leadingPaddingAndBorderMain = (node.style.padding.getWithFallback(leadingSpacing[mainAxis], leading[mainAxis]) + node.style.border.getWithFallback(leadingSpacing[mainAxis], leading[mainAxis]));
    float trailingPaddingAndBorderMain = (node.style.padding.getWithFallback(trailingSpacing[mainAxis], trailing[mainAxis]) + node.style.border.getWithFallback(trailingSpacing[mainAxis], trailing[mainAxis]));
    float leadingPaddingAndBorderCross = (node.style.padding.getWithFallback(leadingSpacing[crossAxis], leading[crossAxis]) + node.style.border.getWithFallback(leadingSpacing[crossAxis], leading[crossAxis]));
    float paddingAndBorderAxisMain = ((node.style.padding.getWithFallback(leadingSpacing[mainAxis], leading[mainAxis]) + node.style.border.getWithFallback(leadingSpacing[mainAxis], leading[mainAxis])) + (node.style.padding.getWithFallback(trailingSpacing[mainAxis], trailing[mainAxis]) + node.style.border.getWithFallback(trailingSpacing[mainAxis], trailing[mainAxis])));
    float paddingAndBorderAxisCross = ((node.style.padding.getWithFallback(leadingSpacing[crossAxis], leading[crossAxis]) + node.style.border.getWithFallback(leadingSpacing[crossAxis], leading[crossAxis])) + (node.style.padding.getWithFallback(trailingSpacing[crossAxis], trailing[crossAxis]) + node.style.border.getWithFallback(trailingSpacing[crossAxis], trailing[crossAxis])));

    CSSMeasureMode measureModeMainDim = isMainAxisRow ? widthMeasureMode : heightMeasureMode;
    CSSMeasureMode measureModeCrossDim = isMainAxisRow ? heightMeasureMode : widthMeasureMode;

    // STEP 2: DETERMINE AVAILABLE SIZE IN MAIN AND CROSS DIRECTIONS
    float availableInnerWidth = availableWidth - marginAxisRow - paddingAndBorderAxisRow;
    float availableInnerHeight = availableHeight - marginAxisColumn - paddingAndBorderAxisColumn;
    float availableInnerMainDim = isMainAxisRow ? availableInnerWidth : availableInnerHeight;
    float availableInnerCrossDim = isMainAxisRow ? availableInnerHeight : availableInnerWidth;

    // STEP 3: DETERMINE FLEX BASIS FOR EACH ITEM
    CSSNodeDEPRECATED child;
    int i;
    float childWidth;
    float childHeight;
    CSSMeasureMode childWidthMeasureMode;
    CSSMeasureMode childHeightMeasureMode;
    for (i = 0; i < childCount; i++) {
      child = node.getChildAt(i);

      if (performLayout) {
        // Set the initial position (relative to the parent).
        CSSDirection childDirection = resolveDirection(child, direction);
        setPosition(child, childDirection);
      }

      // Absolute-positioned children don't participate in flex layout. Add them
      // to a list that we can process later.
      if (child.style.positionType == CSSPositionType.ABSOLUTE) {

        // Store a private linked list of absolutely positioned children
        // so that we can efficiently traverse them later.
        if (firstAbsoluteChild == null) {
          firstAbsoluteChild = child;
        }
        if (currentAbsoluteChild != null) {
          currentAbsoluteChild.nextChild = child;
        }
        currentAbsoluteChild = child;
        child.nextChild = null;
      } else {

        if (isMainAxisRow && (child.style.dimensions[dim[CSS_FLEX_DIRECTION_ROW]] >= 0.0)) {

          // The width is definite, so use that as the flex basis.
          child.layout.computedFlexBasis = Math.max(child.style.dimensions[DIMENSION_WIDTH], ((child.style.padding.getWithFallback(leadingSpacing[CSS_FLEX_DIRECTION_ROW], leading[CSS_FLEX_DIRECTION_ROW]) + child.style.border.getWithFallback(leadingSpacing[CSS_FLEX_DIRECTION_ROW], leading[CSS_FLEX_DIRECTION_ROW])) + (child.style.padding.getWithFallback(trailingSpacing[CSS_FLEX_DIRECTION_ROW], trailing[CSS_FLEX_DIRECTION_ROW]) + child.style.border.getWithFallback(trailingSpacing[CSS_FLEX_DIRECTION_ROW], trailing[CSS_FLEX_DIRECTION_ROW]))));
        } else if (!isMainAxisRow && (child.style.dimensions[dim[CSS_FLEX_DIRECTION_COLUMN]] >= 0.0)) {

          // The height is definite, so use that as the flex basis.
          child.layout.computedFlexBasis = Math.max(child.style.dimensions[DIMENSION_HEIGHT], ((child.style.padding.getWithFallback(leadingSpacing[CSS_FLEX_DIRECTION_COLUMN], leading[CSS_FLEX_DIRECTION_COLUMN]) + child.style.border.getWithFallback(leadingSpacing[CSS_FLEX_DIRECTION_COLUMN], leading[CSS_FLEX_DIRECTION_COLUMN])) + (child.style.padding.getWithFallback(trailingSpacing[CSS_FLEX_DIRECTION_COLUMN], trailing[CSS_FLEX_DIRECTION_COLUMN]) + child.style.border.getWithFallback(trailingSpacing[CSS_FLEX_DIRECTION_COLUMN], trailing[CSS_FLEX_DIRECTION_COLUMN]))));
        } else if (!isFlexBasisAuto(child) && !Float.isNaN(availableInnerMainDim)) {
          if (Float.isNaN(child.layout.computedFlexBasis)) {
            child.layout.computedFlexBasis = Math.max(child.style.flexBasis, ((child.style.padding.getWithFallback(leadingSpacing[mainAxis], leading[mainAxis]) + child.style.border.getWithFallback(leadingSpacing[mainAxis], leading[mainAxis])) + (child.style.padding.getWithFallback(trailingSpacing[mainAxis], trailing[mainAxis]) + child.style.border.getWithFallback(trailingSpacing[mainAxis], trailing[mainAxis]))));
          }
        } else {

          // Compute the flex basis and hypothetical main size (i.e. the clamped flex basis).
          childWidth = CSSConstants.UNDEFINED;
          childHeight = CSSConstants.UNDEFINED;
          childWidthMeasureMode = CSSMeasureMode.UNDEFINED;
          childHeightMeasureMode = CSSMeasureMode.UNDEFINED;

          if ((child.style.dimensions[dim[CSS_FLEX_DIRECTION_ROW]] >= 0.0)) {
            childWidth = child.style.dimensions[DIMENSION_WIDTH] + (child.style.margin.getWithFallback(leadingSpacing[CSS_FLEX_DIRECTION_ROW], leading[CSS_FLEX_DIRECTION_ROW]) + child.style.margin.getWithFallback(trailingSpacing[CSS_FLEX_DIRECTION_ROW], trailing[CSS_FLEX_DIRECTION_ROW]));
            childWidthMeasureMode = CSSMeasureMode.EXACTLY;
          }
          if ((child.style.dimensions[dim[CSS_FLEX_DIRECTION_COLUMN]] >= 0.0)) {
            childHeight = child.style.dimensions[DIMENSION_HEIGHT] + (child.style.margin.getWithFallback(leadingSpacing[CSS_FLEX_DIRECTION_COLUMN], leading[CSS_FLEX_DIRECTION_COLUMN]) + child.style.margin.getWithFallback(trailingSpacing[CSS_FLEX_DIRECTION_COLUMN], trailing[CSS_FLEX_DIRECTION_COLUMN]));
            childHeightMeasureMode = CSSMeasureMode.EXACTLY;
          }

          // The W3C spec doesn't say anything about the 'overflow' property,
          // but all major browsers appear to implement the following logic.
          if ((!isMainAxisRow && node.style.overflow == CSSOverflow.SCROLL) || node.style.overflow != CSSOverflow.SCROLL) {
            if (Float.isNaN(childWidth) && !Float.isNaN(availableInnerWidth)) {
              childWidth = availableInnerWidth;
              childWidthMeasureMode = CSSMeasureMode.AT_MOST;
            }
          }

          if ((isMainAxisRow && node.style.overflow == CSSOverflow.SCROLL) || node.style.overflow != CSSOverflow.SCROLL) {
            if (Float.isNaN(childHeight) && !Float.isNaN(availableInnerHeight)) {
              childHeight = availableInnerHeight;
              childHeightMeasureMode = CSSMeasureMode.AT_MOST;
            }
          }

          // If child has no defined size in the cross axis and is set to stretch, set the cross
          // axis to be measured exactly with the available inner width
          if (!isMainAxisRow &&
              !Float.isNaN(availableInnerWidth) &&
              !(child.style.dimensions[dim[CSS_FLEX_DIRECTION_ROW]] >= 0.0) &&
              widthMeasureMode == CSSMeasureMode.EXACTLY &&
              getAlignItem(node, child) == CSSAlign.STRETCH) {
            childWidth = availableInnerWidth;
            childWidthMeasureMode = CSSMeasureMode.EXACTLY;
          }
          if (isMainAxisRow &&
              !Float.isNaN(availableInnerHeight) &&
              !(child.style.dimensions[dim[CSS_FLEX_DIRECTION_COLUMN]] >= 0.0) &&
              heightMeasureMode == CSSMeasureMode.EXACTLY &&
              getAlignItem(node, child) == CSSAlign.STRETCH) {
            childHeight = availableInnerHeight;
            childHeightMeasureMode = CSSMeasureMode.EXACTLY;
          }

          // Measure the child
          layoutNodeInternal(layoutContext, child, childWidth, childHeight, direction, childWidthMeasureMode, childHeightMeasureMode, false, "measure");

          child.layout.computedFlexBasis = Math.max(isMainAxisRow ? child.layout.measuredDimensions[DIMENSION_WIDTH] : child.layout.measuredDimensions[DIMENSION_HEIGHT], ((child.style.padding.getWithFallback(leadingSpacing[mainAxis], leading[mainAxis]) + child.style.border.getWithFallback(leadingSpacing[mainAxis], leading[mainAxis])) + (child.style.padding.getWithFallback(trailingSpacing[mainAxis], trailing[mainAxis]) + child.style.border.getWithFallback(trailingSpacing[mainAxis], trailing[mainAxis]))));
        }
      }
    }

    // STEP 4: COLLECT FLEX ITEMS INTO FLEX LINES

    // Indexes of children that represent the first and last items in the line.
    int startOfLineIndex = 0;
    int endOfLineIndex = 0;

    // Number of lines.
    int lineCount = 0;

    // Accumulated cross dimensions of all lines so far.
    float totalLineCrossDim = 0;

    // Max main dimension of all the lines.
    float maxLineMainDim = 0;

    while (endOfLineIndex < childCount) {

      // Number of items on the currently line. May be different than the difference
      // between start and end indicates because we skip over absolute-positioned items.
      int itemsOnLine = 0;

      // sizeConsumedOnCurrentLine is accumulation of the dimensions and margin
      // of all the children on the current line. This will be used in order to
      // either set the dimensions of the node if none already exist or to compute
      // the remaining space left for the flexible children.
      float sizeConsumedOnCurrentLine = 0;

      float totalFlexGrowFactors = 0;
      float totalFlexShrinkScaledFactors = 0;

      i = startOfLineIndex;

      // Maintain a linked list of the child nodes that can shrink and/or grow.
      CSSNodeDEPRECATED firstRelativeChild = null;
      CSSNodeDEPRECATED currentRelativeChild = null;

      // Add items to the current line until it's full or we run out of items.
      while (i < childCount) {
        child = node.getChildAt(i);
        child.lineIndex = lineCount;

        if (child.style.positionType != CSSPositionType.ABSOLUTE) {
          float outerFlexBasis = child.layout.computedFlexBasis + (child.style.margin.getWithFallback(leadingSpacing[mainAxis], leading[mainAxis]) + child.style.margin.getWithFallback(trailingSpacing[mainAxis], trailing[mainAxis]));

          // If this is a multi-line flow and this item pushes us over the available size, we've
          // hit the end of the current line. Break out of the loop and lay out the current line.
          if (sizeConsumedOnCurrentLine + outerFlexBasis > availableInnerMainDim && isNodeFlexWrap && itemsOnLine > 0) {
            break;
          }

          sizeConsumedOnCurrentLine += outerFlexBasis;
          itemsOnLine++;

          if ((child.style.positionType == CSSPositionType.RELATIVE && (child.style.flexGrow != 0 || child.style.flexShrink != 0))) {
            totalFlexGrowFactors += getFlexGrowFactor(child);

            // Unlike the grow factor, the shrink factor is scaled relative to the child
            // dimension.
            totalFlexShrinkScaledFactors += getFlexShrinkFactor(child) * child.layout.computedFlexBasis;
          }

          // Store a private linked list of children that need to be layed out.
          if (firstRelativeChild == null) {
            firstRelativeChild = child;
          }
          if (currentRelativeChild != null) {
            currentRelativeChild.nextChild = child;
          }
          currentRelativeChild = child;
          child.nextChild = null;
        }

        i++;
        endOfLineIndex++;
      }

      // If we don't need to measure the cross axis, we can skip the entire flex step.
      boolean canSkipFlex = !performLayout && measureModeCrossDim == CSSMeasureMode.EXACTLY;

      // In order to position the elements in the main axis, we have two
      // controls. The space between the beginning and the first element
      // and the space between each two elements.
      float leadingMainDim = 0;
      float betweenMainDim = 0;

      // STEP 5: RESOLVING FLEXIBLE LENGTHS ON MAIN AXIS
      // Calculate the remaining available space that needs to be allocated.
      // If the main dimension size isn't known, it is computed based on
      // the line length, so there's no more space left to distribute.
      float remainingFreeSpace = 0;
      if (!Float.isNaN(availableInnerMainDim)) {
        remainingFreeSpace = availableInnerMainDim - sizeConsumedOnCurrentLine;
      } else if (sizeConsumedOnCurrentLine < 0) {
        // availableInnerMainDim is indefinite which means the node is being sized based on its content.
        // sizeConsumedOnCurrentLine is negative which means the node will allocate 0 pixels for
        // its content. Consequently, remainingFreeSpace is 0 - sizeConsumedOnCurrentLine.
        remainingFreeSpace = -sizeConsumedOnCurrentLine;
      }

      float originalRemainingFreeSpace = remainingFreeSpace;
      float deltaFreeSpace = 0;

      if (!canSkipFlex) {
        float childFlexBasis;
        float flexShrinkScaledFactor;
        float flexGrowFactor;
        float baseMainSize;
        float boundMainSize;

        // Do two passes over the flex items to figure out how to distribute the remaining space.
        // The first pass finds the items whose min/max constraints trigger, freezes them at those
        // sizes, and excludes those sizes from the remaining space. The second pass sets the size
        // of each flexible item. It distributes the remaining space amongst the items whose min/max
        // constraints didn't trigger in pass 1. For the other items, it sets their sizes by forcing
        // their min/max constraints to trigger again.
        //
        // This two pass approach for resolving min/max constraints deviates from the spec. The
        // spec (https://www.w3.org/TR/css-flexbox-1/#resolve-flexible-lengths) describes a process
        // that needs to be repeated a variable number of times. The algorithm implemented here
        // won't handle all cases but it was simpler to implement and it mitigates performance
        // concerns because we know exactly how many passes it'll do.

        // First pass: detect the flex items whose min/max constraints trigger
        float deltaFlexShrinkScaledFactors = 0;
        float deltaFlexGrowFactors = 0;
        currentRelativeChild = firstRelativeChild;
        while (currentRelativeChild != null) {
          childFlexBasis = currentRelativeChild.layout.computedFlexBasis;

          if (remainingFreeSpace < 0) {
            flexShrinkScaledFactor = getFlexShrinkFactor(currentRelativeChild) * childFlexBasis;

            // Is this child able to shrink?
            if (flexShrinkScaledFactor != 0) {
              baseMainSize = childFlexBasis +
                remainingFreeSpace / totalFlexShrinkScaledFactors * flexShrinkScaledFactor;
              boundMainSize = boundAxis(currentRelativeChild, mainAxis, baseMainSize);
              if (baseMainSize != boundMainSize) {
                // By excluding this item's size and flex factor from remaining, this item's
                // min/max constraints should also trigger in the second pass resulting in the
                // item's size calculation being identical in the first and second passes.
                deltaFreeSpace -= boundMainSize - childFlexBasis;
                deltaFlexShrinkScaledFactors -= flexShrinkScaledFactor;
              }
            }
          } else if (remainingFreeSpace > 0) {
            flexGrowFactor = getFlexGrowFactor(currentRelativeChild);

            // Is this child able to grow?
            if (flexGrowFactor != 0) {
              baseMainSize = childFlexBasis +
                remainingFreeSpace / totalFlexGrowFactors * flexGrowFactor;
              boundMainSize = boundAxis(currentRelativeChild, mainAxis, baseMainSize);
              if (baseMainSize != boundMainSize) {
                // By excluding this item's size and flex factor from remaining, this item's
                // min/max constraints should also trigger in the second pass resulting in the
                // item's size calculation being identical in the first and second passes.
                deltaFreeSpace -= boundMainSize - childFlexBasis;
                deltaFlexGrowFactors -= flexGrowFactor;
              }
            }
          }

          currentRelativeChild = currentRelativeChild.nextChild;
        }

        totalFlexShrinkScaledFactors += deltaFlexShrinkScaledFactors;
        totalFlexGrowFactors += deltaFlexGrowFactors;
        remainingFreeSpace += deltaFreeSpace;

        // Second pass: resolve the sizes of the flexible items
        deltaFreeSpace = 0;
        currentRelativeChild = firstRelativeChild;
        while (currentRelativeChild != null) {
          childFlexBasis = currentRelativeChild.layout.computedFlexBasis;
          float updatedMainSize = childFlexBasis;

          if (remainingFreeSpace < 0) {
            flexShrinkScaledFactor = getFlexShrinkFactor(currentRelativeChild) * childFlexBasis;

            // Is this child able to shrink?
            if (flexShrinkScaledFactor != 0) {
              updatedMainSize = boundAxis(currentRelativeChild, mainAxis, childFlexBasis +
                remainingFreeSpace / totalFlexShrinkScaledFactors * flexShrinkScaledFactor);
            }
          } else if (remainingFreeSpace > 0) {
            flexGrowFactor = getFlexGrowFactor(currentRelativeChild);

            // Is this child able to grow?
            if (flexGrowFactor != 0) {
              updatedMainSize = boundAxis(currentRelativeChild, mainAxis, childFlexBasis +
                remainingFreeSpace / totalFlexGrowFactors * flexGrowFactor);
            }
          }

          deltaFreeSpace -= updatedMainSize - childFlexBasis;

          if (isMainAxisRow) {
            childWidth = updatedMainSize + (currentRelativeChild.style.margin.getWithFallback(leadingSpacing[CSS_FLEX_DIRECTION_ROW], leading[CSS_FLEX_DIRECTION_ROW]) + currentRelativeChild.style.margin.getWithFallback(trailingSpacing[CSS_FLEX_DIRECTION_ROW], trailing[CSS_FLEX_DIRECTION_ROW]));
            childWidthMeasureMode = CSSMeasureMode.EXACTLY;

            if (!Float.isNaN(availableInnerCrossDim) &&
                !(currentRelativeChild.style.dimensions[dim[CSS_FLEX_DIRECTION_COLUMN]] >= 0.0) &&
                heightMeasureMode == CSSMeasureMode.EXACTLY &&
                getAlignItem(node, currentRelativeChild) == CSSAlign.STRETCH) {
              childHeight = availableInnerCrossDim;
              childHeightMeasureMode = CSSMeasureMode.EXACTLY;
            } else if (!(currentRelativeChild.style.dimensions[dim[CSS_FLEX_DIRECTION_COLUMN]] >= 0.0)) {
              childHeight = availableInnerCrossDim;
              childHeightMeasureMode = Float.isNaN(childHeight) ? CSSMeasureMode.UNDEFINED : CSSMeasureMode.AT_MOST;
            } else {
              childHeight = currentRelativeChild.style.dimensions[DIMENSION_HEIGHT] + (currentRelativeChild.style.margin.getWithFallback(leadingSpacing[CSS_FLEX_DIRECTION_COLUMN], leading[CSS_FLEX_DIRECTION_COLUMN]) + currentRelativeChild.style.margin.getWithFallback(trailingSpacing[CSS_FLEX_DIRECTION_COLUMN], trailing[CSS_FLEX_DIRECTION_COLUMN]));
              childHeightMeasureMode = CSSMeasureMode.EXACTLY;
            }
          } else {
            childHeight = updatedMainSize + (currentRelativeChild.style.margin.getWithFallback(leadingSpacing[CSS_FLEX_DIRECTION_COLUMN], leading[CSS_FLEX_DIRECTION_COLUMN]) + currentRelativeChild.style.margin.getWithFallback(trailingSpacing[CSS_FLEX_DIRECTION_COLUMN], trailing[CSS_FLEX_DIRECTION_COLUMN]));
            childHeightMeasureMode = CSSMeasureMode.EXACTLY;

            if (!Float.isNaN(availableInnerCrossDim) &&
                !(currentRelativeChild.style.dimensions[dim[CSS_FLEX_DIRECTION_ROW]] >= 0.0) &&
                widthMeasureMode == CSSMeasureMode.EXACTLY &&
                getAlignItem(node, currentRelativeChild) == CSSAlign.STRETCH) {
              childWidth = availableInnerCrossDim;
              childWidthMeasureMode = CSSMeasureMode.EXACTLY;
            } else if (!(currentRelativeChild.style.dimensions[dim[CSS_FLEX_DIRECTION_ROW]] >= 0.0)) {
              childWidth = availableInnerCrossDim;
              childWidthMeasureMode = Float.isNaN(childWidth) ? CSSMeasureMode.UNDEFINED : CSSMeasureMode.AT_MOST;
            } else {
              childWidth = currentRelativeChild.style.dimensions[DIMENSION_WIDTH] + (currentRelativeChild.style.margin.getWithFallback(leadingSpacing[CSS_FLEX_DIRECTION_ROW], leading[CSS_FLEX_DIRECTION_ROW]) + currentRelativeChild.style.margin.getWithFallback(trailingSpacing[CSS_FLEX_DIRECTION_ROW], trailing[CSS_FLEX_DIRECTION_ROW]));
              childWidthMeasureMode = CSSMeasureMode.EXACTLY;
            }
          }

          boolean requiresStretchLayout = !(currentRelativeChild.style.dimensions[dim[crossAxis]] >= 0.0) &&
            getAlignItem(node, currentRelativeChild) == CSSAlign.STRETCH;

          // Recursively call the layout algorithm for this child with the updated main size.
          layoutNodeInternal(layoutContext, currentRelativeChild, childWidth, childHeight, direction, childWidthMeasureMode, childHeightMeasureMode, performLayout && !requiresStretchLayout, "flex");

          currentRelativeChild = currentRelativeChild.nextChild;
        }
      }

      remainingFreeSpace = originalRemainingFreeSpace + deltaFreeSpace;

      // STEP 6: MAIN-AXIS JUSTIFICATION & CROSS-AXIS SIZE DETERMINATION

      // At this point, all the children have their dimensions set in the main axis.
      // Their dimensions are also set in the cross axis with the exception of items
      // that are aligned "stretch". We need to compute these stretch values and
      // set the final positions.

      // If we are using "at most" rules in the main axis, we won't distribute
      // any remaining space at this point.
      if (measureModeMainDim == CSSMeasureMode.AT_MOST) {
        remainingFreeSpace = 0;
      }

      // Use justifyContent to figure out how to allocate the remaining space
      // available in the main axis.
      if (justifyContent != CSSJustify.FLEX_START) {
        if (justifyContent == CSSJustify.CENTER) {
          leadingMainDim = remainingFreeSpace / 2;
        } else if (justifyContent == CSSJustify.FLEX_END) {
          leadingMainDim = remainingFreeSpace;
        } else if (justifyContent == CSSJustify.SPACE_BETWEEN) {
          remainingFreeSpace = Math.max(remainingFreeSpace, 0);
          if (itemsOnLine > 1) {
            betweenMainDim = remainingFreeSpace / (itemsOnLine - 1);
          } else {
            betweenMainDim = 0;
          }
        } else if (justifyContent == CSSJustify.SPACE_AROUND) {
          // Space on the edges is half of the space between elements
          betweenMainDim = remainingFreeSpace / itemsOnLine;
          leadingMainDim = betweenMainDim / 2;
        }
      }

      float mainDim = leadingPaddingAndBorderMain + leadingMainDim;
      float crossDim = 0;

      for (i = startOfLineIndex; i < endOfLineIndex; ++i) {
        child = node.getChildAt(i);

        if (child.style.positionType == CSSPositionType.ABSOLUTE &&
          !Float.isNaN(child.style.position.getWithFallback(leadingSpacing[mainAxis], leading[mainAxis]))) {
          if (performLayout) {
            // In case the child is position absolute and has left/top being
            // defined, we override the position to whatever the user said
            // (and margin/border).
            child.layout.position[pos[mainAxis]] =
              (Float.isNaN(child.style.position.getWithFallback(leadingSpacing[mainAxis], leading[mainAxis])) ?
              0 :
              child.style.position.getWithFallback(leadingSpacing[mainAxis], leading[mainAxis])) +
              node.style.border.getWithFallback(leadingSpacing[mainAxis], leading[mainAxis]) +
              child.style.margin.getWithFallback(leadingSpacing[mainAxis], leading[mainAxis]);
          }
        } else {
          if (performLayout) {
            // If the child is position absolute (without top/left) or relative,
            // we put it at the current accumulated offset.
            child.layout.position[pos[mainAxis]] += mainDim;
          }

          // Now that we placed the element, we need to update the variables.
          // We need to do that only for relative elements. Absolute elements
          // do not take part in that phase.
          if (child.style.positionType == CSSPositionType.RELATIVE) {
            if (canSkipFlex) {
              // If we skipped the flex step, then we can't rely on the measuredDims because
              // they weren't computed. This means we can't call getDimWithMargin.
              mainDim += betweenMainDim + (child.style.margin.getWithFallback(leadingSpacing[mainAxis], leading[mainAxis]) + child.style.margin.getWithFallback(trailingSpacing[mainAxis], trailing[mainAxis])) + child.layout.computedFlexBasis;
              crossDim = availableInnerCrossDim;
            } else {
              // The main dimension is the sum of all the elements dimension plus
              // the spacing.
              mainDim += betweenMainDim + (child.layout.measuredDimensions[dim[mainAxis]] + child.style.margin.getWithFallback(leadingSpacing[mainAxis], leading[mainAxis]) + child.style.margin.getWithFallback(trailingSpacing[mainAxis], trailing[mainAxis]));

              // The cross dimension is the max of the elements dimension since there
              // can only be one element in that cross dimension.
              crossDim = Math.max(crossDim, (child.layout.measuredDimensions[dim[crossAxis]] + child.style.margin.getWithFallback(leadingSpacing[crossAxis], leading[crossAxis]) + child.style.margin.getWithFallback(trailingSpacing[crossAxis], trailing[crossAxis])));
            }
          }
        }
      }

      mainDim += trailingPaddingAndBorderMain;

      float containerCrossAxis = availableInnerCrossDim;
      if (measureModeCrossDim == CSSMeasureMode.UNDEFINED || measureModeCrossDim == CSSMeasureMode.AT_MOST) {
        // Compute the cross axis from the max cross dimension of the children.
        containerCrossAxis = boundAxis(node, crossAxis, crossDim + paddingAndBorderAxisCross) - paddingAndBorderAxisCross;

        if (measureModeCrossDim == CSSMeasureMode.AT_MOST) {
          containerCrossAxis = Math.min(containerCrossAxis, availableInnerCrossDim);
        }
      }

      // If there's no flex wrap, the cross dimension is defined by the container.
      if (!isNodeFlexWrap && measureModeCrossDim == CSSMeasureMode.EXACTLY) {
        crossDim = availableInnerCrossDim;
      }

      // Clamp to the min/max size specified on the container.
      crossDim = boundAxis(node, crossAxis, crossDim + paddingAndBorderAxisCross) - paddingAndBorderAxisCross;

      // STEP 7: CROSS-AXIS ALIGNMENT
      // We can skip child alignment if we're just measuring the container.
      if (performLayout) {
        for (i = startOfLineIndex; i < endOfLineIndex; ++i) {
          child = node.getChildAt(i);

          if (child.style.positionType == CSSPositionType.ABSOLUTE) {
            // If the child is absolutely positioned and has a top/left/bottom/right
            // set, override all the previously computed positions to set it correctly.
            if (!Float.isNaN(child.style.position.getWithFallback(leadingSpacing[crossAxis], leading[crossAxis]))) {
              child.layout.position[pos[crossAxis]] =
                (Float.isNaN(child.style.position.getWithFallback(leadingSpacing[crossAxis], leading[crossAxis])) ?
                0 :
                child.style.position.getWithFallback(leadingSpacing[crossAxis], leading[crossAxis])) +
                node.style.border.getWithFallback(leadingSpacing[crossAxis], leading[crossAxis]) +
                child.style.margin.getWithFallback(leadingSpacing[crossAxis], leading[crossAxis]);
            } else {
              child.layout.position[pos[crossAxis]] = leadingPaddingAndBorderCross +
                child.style.margin.getWithFallback(leadingSpacing[crossAxis], leading[crossAxis]);
            }
          } else {
            float leadingCrossDim = leadingPaddingAndBorderCross;

            // For a relative children, we're either using alignItems (parent) or
            // alignSelf (child) in order to determine the position in the cross axis
            CSSAlign alignItem = getAlignItem(node, child);

            // If the child uses align stretch, we need to lay it out one more time, this time
            // forcing the cross-axis size to be the computed cross size for the current line.
            if (alignItem == CSSAlign.STRETCH) {
              childWidth = child.layout.measuredDimensions[DIMENSION_WIDTH] + (child.style.margin.getWithFallback(leadingSpacing[CSS_FLEX_DIRECTION_ROW], leading[CSS_FLEX_DIRECTION_ROW]) + child.style.margin.getWithFallback(trailingSpacing[CSS_FLEX_DIRECTION_ROW], trailing[CSS_FLEX_DIRECTION_ROW]));
              childHeight = child.layout.measuredDimensions[DIMENSION_HEIGHT] + (child.style.margin.getWithFallback(leadingSpacing[CSS_FLEX_DIRECTION_COLUMN], leading[CSS_FLEX_DIRECTION_COLUMN]) + child.style.margin.getWithFallback(trailingSpacing[CSS_FLEX_DIRECTION_COLUMN], trailing[CSS_FLEX_DIRECTION_COLUMN]));
              boolean isCrossSizeDefinite = false;

              if (isMainAxisRow) {
                isCrossSizeDefinite = (child.style.dimensions[dim[CSS_FLEX_DIRECTION_COLUMN]] >= 0.0);
                childHeight = crossDim;
              } else {
                isCrossSizeDefinite = (child.style.dimensions[dim[CSS_FLEX_DIRECTION_ROW]] >= 0.0);
                childWidth = crossDim;
              }

              // If the child defines a definite size for its cross axis, there's no need to stretch.
              if (!isCrossSizeDefinite) {
                childWidthMeasureMode = Float.isNaN(childWidth) ? CSSMeasureMode.UNDEFINED : CSSMeasureMode.EXACTLY;
                childHeightMeasureMode = Float.isNaN(childHeight) ? CSSMeasureMode.UNDEFINED : CSSMeasureMode.EXACTLY;
                layoutNodeInternal(layoutContext, child, childWidth, childHeight, direction, childWidthMeasureMode, childHeightMeasureMode, true, "stretch");
              }
            } else if (alignItem != CSSAlign.FLEX_START) {
              float remainingCrossDim = containerCrossAxis - (child.layout.measuredDimensions[dim[crossAxis]] + child.style.margin.getWithFallback(leadingSpacing[crossAxis], leading[crossAxis]) + child.style.margin.getWithFallback(trailingSpacing[crossAxis], trailing[crossAxis]));

              if (alignItem == CSSAlign.CENTER) {
                leadingCrossDim += remainingCrossDim / 2;
              } else { // CSSAlign.FLEX_END
                leadingCrossDim += remainingCrossDim;
              }
            }

            // And we apply the position
            child.layout.position[pos[crossAxis]] += totalLineCrossDim + leadingCrossDim;
          }
        }
      }

      totalLineCrossDim += crossDim;
      maxLineMainDim = Math.max(maxLineMainDim, mainDim);

      // Reset variables for new line.
      lineCount++;
      startOfLineIndex = endOfLineIndex;
      endOfLineIndex = startOfLineIndex;
    }

    // STEP 8: MULTI-LINE CONTENT ALIGNMENT
    if (lineCount > 1 && performLayout && !Float.isNaN(availableInnerCrossDim)) {
      float remainingAlignContentDim = availableInnerCrossDim - totalLineCrossDim;

      float crossDimLead = 0;
      float currentLead = leadingPaddingAndBorderCross;

      CSSAlign alignContent = node.style.alignContent;
      if (alignContent == CSSAlign.FLEX_END) {
        currentLead += remainingAlignContentDim;
      } else if (alignContent == CSSAlign.CENTER) {
        currentLead += remainingAlignContentDim / 2;
      } else if (alignContent == CSSAlign.STRETCH) {
        if (availableInnerCrossDim > totalLineCrossDim) {
          crossDimLead = (remainingAlignContentDim / lineCount);
        }
      }

      int endIndex = 0;
      for (i = 0; i < lineCount; ++i) {
        int startIndex = endIndex;
        int j;

        // compute the line's height and find the endIndex
        float lineHeight = 0;
        for (j = startIndex; j < childCount; ++j) {
          child = node.getChildAt(j);
          if (child.style.positionType != CSSPositionType.RELATIVE) {
            continue;
          }
          if (child.lineIndex != i) {
            break;
          }
          if ((child.layout.measuredDimensions[dim[crossAxis]] >= 0.0)) {
            lineHeight = Math.max(lineHeight,
              child.layout.measuredDimensions[dim[crossAxis]] + (child.style.margin.getWithFallback(leadingSpacing[crossAxis], leading[crossAxis]) + child.style.margin.getWithFallback(trailingSpacing[crossAxis], trailing[crossAxis])));
          }
        }
        endIndex = j;
        lineHeight += crossDimLead;

        if (performLayout) {
          for (j = startIndex; j < endIndex; ++j) {
            child = node.getChildAt(j);
            if (child.style.positionType != CSSPositionType.RELATIVE) {
              continue;
            }

            CSSAlign alignContentAlignItem = getAlignItem(node, child);
            if (alignContentAlignItem == CSSAlign.FLEX_START) {
              child.layout.position[pos[crossAxis]] = currentLead + child.style.margin.getWithFallback(leadingSpacing[crossAxis], leading[crossAxis]);
            } else if (alignContentAlignItem == CSSAlign.FLEX_END) {
              child.layout.position[pos[crossAxis]] = currentLead + lineHeight - child.style.margin.getWithFallback(trailingSpacing[crossAxis], trailing[crossAxis]) - child.layout.measuredDimensions[dim[crossAxis]];
            } else if (alignContentAlignItem == CSSAlign.CENTER) {
              childHeight = child.layout.measuredDimensions[dim[crossAxis]];
              child.layout.position[pos[crossAxis]] = currentLead + (lineHeight - childHeight) / 2;
            } else if (alignContentAlignItem == CSSAlign.STRETCH) {
              child.layout.position[pos[crossAxis]] = currentLead + child.style.margin.getWithFallback(leadingSpacing[crossAxis], leading[crossAxis]);
              // TODO(prenaux): Correctly set the height of items with indefinite
              //                (auto) crossAxis dimension.
            }
          }
        }

        currentLead += lineHeight;
      }
    }

    // STEP 9: COMPUTING FINAL DIMENSIONS
    node.layout.measuredDimensions[DIMENSION_WIDTH] = boundAxis(node, CSS_FLEX_DIRECTION_ROW, availableWidth - marginAxisRow);
    node.layout.measuredDimensions[DIMENSION_HEIGHT] = boundAxis(node, CSS_FLEX_DIRECTION_COLUMN, availableHeight - marginAxisColumn);

    // If the user didn't specify a width or height for the node, set the
    // dimensions based on the children.
    if (measureModeMainDim == CSSMeasureMode.UNDEFINED) {
      // Clamp the size to the min/max size, if specified, and make sure it
      // doesn't go below the padding and border amount.
      node.layout.measuredDimensions[dim[mainAxis]] = boundAxis(node, mainAxis, maxLineMainDim);
    } else if (measureModeMainDim == CSSMeasureMode.AT_MOST) {
      node.layout.measuredDimensions[dim[mainAxis]] = Math.max(
        Math.min(availableInnerMainDim + paddingAndBorderAxisMain,
          boundAxisWithinMinAndMax(node, mainAxis, maxLineMainDim)),
        paddingAndBorderAxisMain);
    }

    if (measureModeCrossDim == CSSMeasureMode.UNDEFINED) {
      // Clamp the size to the min/max size, if specified, and make sure it
      // doesn't go below the padding and border amount.
      node.layout.measuredDimensions[dim[crossAxis]] = boundAxis(node, crossAxis, totalLineCrossDim + paddingAndBorderAxisCross);
    } else if (measureModeCrossDim == CSSMeasureMode.AT_MOST) {
      node.layout.measuredDimensions[dim[crossAxis]] = Math.max(
        Math.min(availableInnerCrossDim + paddingAndBorderAxisCross,
          boundAxisWithinMinAndMax(node, crossAxis, totalLineCrossDim + paddingAndBorderAxisCross)),
        paddingAndBorderAxisCross);
    }

    // STEP 10: SIZING AND POSITIONING ABSOLUTE CHILDREN
    currentAbsoluteChild = firstAbsoluteChild;
    while (currentAbsoluteChild != null) {
      // Now that we know the bounds of the container, perform layout again on the
      // absolutely-positioned children.
      if (performLayout) {

        childWidth = CSSConstants.UNDEFINED;
        childHeight = CSSConstants.UNDEFINED;

        if ((currentAbsoluteChild.style.dimensions[dim[CSS_FLEX_DIRECTION_ROW]] >= 0.0)) {
          childWidth = currentAbsoluteChild.style.dimensions[DIMENSION_WIDTH] + (currentAbsoluteChild.style.margin.getWithFallback(leadingSpacing[CSS_FLEX_DIRECTION_ROW], leading[CSS_FLEX_DIRECTION_ROW]) + currentAbsoluteChild.style.margin.getWithFallback(trailingSpacing[CSS_FLEX_DIRECTION_ROW], trailing[CSS_FLEX_DIRECTION_ROW]));
        } else {
          // If the child doesn't have a specified width, compute the width based on the left/right offsets if they're defined.
          if (!Float.isNaN(currentAbsoluteChild.style.position.getWithFallback(leadingSpacing[CSS_FLEX_DIRECTION_ROW], leading[CSS_FLEX_DIRECTION_ROW])) &&
              !Float.isNaN(currentAbsoluteChild.style.position.getWithFallback(trailingSpacing[CSS_FLEX_DIRECTION_ROW], trailing[CSS_FLEX_DIRECTION_ROW]))) {
            childWidth = node.layout.measuredDimensions[DIMENSION_WIDTH] -
              (node.style.border.getWithFallback(leadingSpacing[CSS_FLEX_DIRECTION_ROW], leading[CSS_FLEX_DIRECTION_ROW]) + node.style.border.getWithFallback(trailingSpacing[CSS_FLEX_DIRECTION_ROW], trailing[CSS_FLEX_DIRECTION_ROW])) -
              ((Float.isNaN(currentAbsoluteChild.style.position.getWithFallback(leadingSpacing[CSS_FLEX_DIRECTION_ROW], leading[CSS_FLEX_DIRECTION_ROW])) ?
              0 :
              currentAbsoluteChild.style.position.getWithFallback(leadingSpacing[CSS_FLEX_DIRECTION_ROW], leading[CSS_FLEX_DIRECTION_ROW])) +
              (Float.isNaN(currentAbsoluteChild.style.position.getWithFallback(trailingSpacing[CSS_FLEX_DIRECTION_ROW], trailing[CSS_FLEX_DIRECTION_ROW])) ?
              0 :
              currentAbsoluteChild.style.position.getWithFallback(trailingSpacing[CSS_FLEX_DIRECTION_ROW], trailing[CSS_FLEX_DIRECTION_ROW])));
            childWidth = boundAxis(currentAbsoluteChild, CSS_FLEX_DIRECTION_ROW, childWidth);
          }
        }

        if ((currentAbsoluteChild.style.dimensions[dim[CSS_FLEX_DIRECTION_COLUMN]] >= 0.0)) {
          childHeight = currentAbsoluteChild.style.dimensions[DIMENSION_HEIGHT] + (currentAbsoluteChild.style.margin.getWithFallback(leadingSpacing[CSS_FLEX_DIRECTION_COLUMN], leading[CSS_FLEX_DIRECTION_COLUMN]) + currentAbsoluteChild.style.margin.getWithFallback(trailingSpacing[CSS_FLEX_DIRECTION_COLUMN], trailing[CSS_FLEX_DIRECTION_COLUMN]));
        } else {
          // If the child doesn't have a specified height, compute the height based on the top/bottom offsets if they're defined.
          if (!Float.isNaN(currentAbsoluteChild.style.position.getWithFallback(leadingSpacing[CSS_FLEX_DIRECTION_COLUMN], leading[CSS_FLEX_DIRECTION_COLUMN])) &&
              !Float.isNaN(currentAbsoluteChild.style.position.getWithFallback(trailingSpacing[CSS_FLEX_DIRECTION_COLUMN], trailing[CSS_FLEX_DIRECTION_COLUMN]))) {
            childHeight = node.layout.measuredDimensions[DIMENSION_HEIGHT] -
              (node.style.border.getWithFallback(leadingSpacing[CSS_FLEX_DIRECTION_COLUMN], leading[CSS_FLEX_DIRECTION_COLUMN]) + node.style.border.getWithFallback(trailingSpacing[CSS_FLEX_DIRECTION_COLUMN], trailing[CSS_FLEX_DIRECTION_COLUMN])) -
              ((Float.isNaN(currentAbsoluteChild.style.position.getWithFallback(leadingSpacing[CSS_FLEX_DIRECTION_COLUMN], leading[CSS_FLEX_DIRECTION_COLUMN])) ?
              0 :
              currentAbsoluteChild.style.position.getWithFallback(leadingSpacing[CSS_FLEX_DIRECTION_COLUMN], leading[CSS_FLEX_DIRECTION_COLUMN])) +
              (Float.isNaN(currentAbsoluteChild.style.position.getWithFallback(trailingSpacing[CSS_FLEX_DIRECTION_COLUMN], trailing[CSS_FLEX_DIRECTION_COLUMN])) ?
              0 :
              currentAbsoluteChild.style.position.getWithFallback(trailingSpacing[CSS_FLEX_DIRECTION_COLUMN], trailing[CSS_FLEX_DIRECTION_COLUMN])));
            childHeight = boundAxis(currentAbsoluteChild, CSS_FLEX_DIRECTION_COLUMN, childHeight);
          }
        }

        // If we're still missing one or the other dimension, measure the content.
        if (Float.isNaN(childWidth) || Float.isNaN(childHeight)) {
          childWidthMeasureMode = Float.isNaN(childWidth) ? CSSMeasureMode.UNDEFINED : CSSMeasureMode.EXACTLY;
          childHeightMeasureMode = Float.isNaN(childHeight) ? CSSMeasureMode.UNDEFINED : CSSMeasureMode.EXACTLY;

          // According to the spec, if the main size is not definite and the
          // child's inline axis is parallel to the main axis (i.e. it's
          // horizontal), the child should be sized using "UNDEFINED" in
          // the main size. Otherwise use "AT_MOST" in the cross axis.
          if (!isMainAxisRow && Float.isNaN(childWidth) && !Float.isNaN(availableInnerWidth)) {
            childWidth = availableInnerWidth;
            childWidthMeasureMode = CSSMeasureMode.AT_MOST;
          }

          layoutNodeInternal(layoutContext, currentAbsoluteChild, childWidth, childHeight, direction, childWidthMeasureMode, childHeightMeasureMode, false, "abs-measure");
          childWidth = currentAbsoluteChild.layout.measuredDimensions[DIMENSION_WIDTH] + (currentAbsoluteChild.style.margin.getWithFallback(leadingSpacing[CSS_FLEX_DIRECTION_ROW], leading[CSS_FLEX_DIRECTION_ROW]) + currentAbsoluteChild.style.margin.getWithFallback(trailingSpacing[CSS_FLEX_DIRECTION_ROW], trailing[CSS_FLEX_DIRECTION_ROW]));
          childHeight = currentAbsoluteChild.layout.measuredDimensions[DIMENSION_HEIGHT] + (currentAbsoluteChild.style.margin.getWithFallback(leadingSpacing[CSS_FLEX_DIRECTION_COLUMN], leading[CSS_FLEX_DIRECTION_COLUMN]) + currentAbsoluteChild.style.margin.getWithFallback(trailingSpacing[CSS_FLEX_DIRECTION_COLUMN], trailing[CSS_FLEX_DIRECTION_COLUMN]));
        }

        layoutNodeInternal(layoutContext, currentAbsoluteChild, childWidth, childHeight, direction, CSSMeasureMode.EXACTLY, CSSMeasureMode.EXACTLY, true, "abs-layout");

        if (!Float.isNaN(currentAbsoluteChild.style.position.getWithFallback(trailingSpacing[mainAxis], trailing[mainAxis])) &&
            Float.isNaN(currentAbsoluteChild.style.position.getWithFallback(leadingSpacing[mainAxis], leading[mainAxis]))) {
          currentAbsoluteChild.layout.position[leading[mainAxis]] =
            node.layout.measuredDimensions[dim[mainAxis]] -
            currentAbsoluteChild.layout.measuredDimensions[dim[mainAxis]] -
            (Float.isNaN(currentAbsoluteChild.style.position.getWithFallback(trailingSpacing[mainAxis], trailing[mainAxis])) ?  0 : currentAbsoluteChild.style.position.getWithFallback(trailingSpacing[mainAxis], trailing[mainAxis]));
        }

        if (!Float.isNaN(currentAbsoluteChild.style.position.getWithFallback(trailingSpacing[crossAxis], trailing[crossAxis])) &&
            Float.isNaN(currentAbsoluteChild.style.position.getWithFallback(leadingSpacing[crossAxis], leading[crossAxis]))) {
          currentAbsoluteChild.layout.position[leading[crossAxis]] =
            node.layout.measuredDimensions[dim[crossAxis]] -
            currentAbsoluteChild.layout.measuredDimensions[dim[crossAxis]] -
            (Float.isNaN(currentAbsoluteChild.style.position.getWithFallback(trailingSpacing[crossAxis], trailing[crossAxis])) ?  0 : currentAbsoluteChild.style.position.getWithFallback(trailingSpacing[crossAxis], trailing[crossAxis]));
        }
      }

      currentAbsoluteChild = currentAbsoluteChild.nextChild;
    }

    // STEP 11: SETTING TRAILING POSITIONS FOR CHILDREN
    if (performLayout) {
      boolean needsMainTrailingPos = false;
      boolean needsCrossTrailingPos = false;

      if (mainAxis == CSS_FLEX_DIRECTION_ROW_REVERSE ||
          mainAxis == CSS_FLEX_DIRECTION_COLUMN_REVERSE) {
        needsMainTrailingPos = true;
      }

      if (crossAxis == CSS_FLEX_DIRECTION_ROW_REVERSE ||
          crossAxis == CSS_FLEX_DIRECTION_COLUMN_REVERSE) {
        needsCrossTrailingPos = true;
      }

      // Set trailing position if necessary.
      if (needsMainTrailingPos || needsCrossTrailingPos) {
        for (i = 0; i < childCount; ++i) {
          child = node.getChildAt(i);

          if (needsMainTrailingPos) {
            child.layout.position[trailing[mainAxis]] =
              node.layout.measuredDimensions[dim[mainAxis]] -
              child.layout.measuredDimensions[dim[mainAxis]] -
              child.layout.position[pos[mainAxis]];
          }

          if (needsCrossTrailingPos) {
            child.layout.position[trailing[crossAxis]] =
              node.layout.measuredDimensions[dim[crossAxis]] -
              child.layout.measuredDimensions[dim[crossAxis]] -
              child.layout.position[pos[crossAxis]];
          }
        }
      }
    }
  }
}
