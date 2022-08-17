/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <array>
#include <vector>
#include "Dimension.h"
#include "FlexLayoutEnums.h"
#include "FlexLayoutMacros.h"
#include "Rounding.h"
#include "Utils.h"

namespace facebook {
namespace flexlayout {
namespace layoutoutput {

struct None {};
constexpr auto none = None{};

struct MeasureParams {
  Float minWidth = -1;
  Float maxWidth = -1;
  Float minHeight = -1;
  Float maxHeight = -1;

  auto haveFixedWidth() const -> bool {
    return minWidth == maxWidth;
  }

  auto haveFixedHeight() const -> bool {
    return minHeight == maxHeight;
  }

  auto operator==(const MeasureParams& other) const -> bool {
    return minWidth == other.minWidth && maxWidth == other.maxWidth &&
        minHeight == other.minHeight && maxHeight == other.maxHeight;
  }
};

struct LayoutOutputBase {
  struct Child {
    Float left;
    Float top;
    // Width and height need to have default values not equal to zero otherwise
    // we won't be able to discern the case when the child was never measured at
    // all. In canBeReusedFor(), if width and height were to have default values
    // of zero and measureParams are {0, 0, 0, 0} (i.e. have fixed width and
    // height equal to 0) fixedWidthMatchesMeasured[Width|Height] would be true
    // even though the child was never measured in the first place. This means
    // we would never invoke the measure function at all which is incorrect.
    Float width = UNDEFINED;
    Float height = UNDEFINED;
    bool enableTextRounding = false;
    Float baseline = UNDEFINED;
    MeasureParams lastMeasureParams;

    auto canBeReusedFor(const MeasureParams& measureParams) const -> bool {
      const auto sameWidthRange =
          utils::FlexLayoutFloatsEqual(
              measureParams.minWidth, lastMeasureParams.minWidth) &&
          utils::FlexLayoutFloatsEqual(
              measureParams.maxWidth, lastMeasureParams.maxWidth);

      const auto fixedWidthMatchesMeasuredWidth =
          measureParams.haveFixedWidth() && measureParams.minWidth == width;

      const auto measuredWidthMatchesStricterRange =
          !measureParams.haveFixedWidth() &&
          !lastMeasureParams.haveFixedWidth() &&
          measureParams.maxWidth <= lastMeasureParams.maxWidth &&
          width <= measureParams.maxWidth;

      const auto widthIsCompatible = sameWidthRange ||
          fixedWidthMatchesMeasuredWidth || measuredWidthMatchesStricterRange;

      const auto sameHeightRange =
          utils::FlexLayoutFloatsEqual(
              measureParams.minHeight, lastMeasureParams.minHeight) &&
          utils::FlexLayoutFloatsEqual(
              measureParams.maxHeight, lastMeasureParams.maxHeight);

      const auto fixedHeightMatchesMeasuredHeight =
          measureParams.haveFixedHeight() && measureParams.minHeight == height;

      const auto measuredHeightMatchesStricterRange =
          !measureParams.haveFixedHeight() &&
          !lastMeasureParams.haveFixedHeight() &&
          measureParams.maxHeight <= lastMeasureParams.maxHeight &&
          height <= measureParams.maxHeight;

      const auto heightIsCompatible = sameHeightRange ||
          fixedHeightMatchesMeasuredHeight ||
          measuredHeightMatchesStricterRange;

      return measureParams == lastMeasureParams ||
          (widthIsCompatible && heightIsCompatible);
    }

    void setStartPositionOnAxis(
        const Float position,
        const FlexDirection axis) {
      // https://www.w3.org/TR/css-flexbox-1/#axis-mapping
      const auto startEdge = [&]() {
        switch (axis) {
          case FlexDirection::Row:
            return Edge::Left;
          case FlexDirection::RowReverse:
            return Edge::Right;
          case FlexDirection::Column:
            return Edge::Top;
          case FlexDirection::ColumnReverse:
            return Edge::Bottom;
        }
      }();
      setPositionForEdge(position, startEdge);
    }

    void setEndPositionOnAxis(const Float position, const FlexDirection axis) {
      // https://www.w3.org/TR/css-flexbox-1/#axis-mapping
      const auto endEdge = [&]() {
        switch (axis) {
          case FlexDirection::Row:
            return Edge::Right;
          case FlexDirection::RowReverse:
            return Edge::Left;
          case FlexDirection::Column:
            return Edge::Bottom;
          case FlexDirection::ColumnReverse:
            return Edge::Top;
        }
      }();
      setPositionForEdge(position, endEdge);
    }

    void roundToPixelGrid(const double pointScaleFactor) {
      // Convert from float to double as it matters for rounding precision
      const double leftAsDouble = left;
      const double topAsDouble = top;

      // This used to depend on NodeType (Default or Text), not sure if we need
      // this now
      const bool textRounding = enableTextRounding;

      left = algo::RoundValueToPixelGrid(
          leftAsDouble, pointScaleFactor, false, textRounding);
      top = algo::RoundValueToPixelGrid(
          topAsDouble, pointScaleFactor, false, textRounding);

      // We multiply dimension by scale factor and if the result is close to the
      // whole number, we don't have any fraction To verify if the result is
      // close to whole number we want to check both floor and ceil numbers
      const bool hasFractionalWidth =
          !utils::FlexLayoutDoubleEqual(
              fmod((double)width * pointScaleFactor, 1.0), 0) &&
          !utils::FlexLayoutDoubleEqual(
              fmod((double)width * pointScaleFactor, 1.0), 1.0);
      const bool hasFractionalHeight =
          !utils::FlexLayoutDoubleEqual(
              fmod((double)height * pointScaleFactor, 1.0), 0) &&
          !utils::FlexLayoutDoubleEqual(
              fmod((double)height * pointScaleFactor, 1.0), 1.0);

      width = algo::RoundValueToPixelGrid(
                  leftAsDouble + width,
                  pointScaleFactor,
                  (textRounding && hasFractionalWidth),
                  (textRounding && !hasFractionalWidth)) -
          algo::RoundValueToPixelGrid(
                  leftAsDouble, pointScaleFactor, false, textRounding);

      height = algo::RoundValueToPixelGrid(
                   topAsDouble + height,
                   pointScaleFactor,
                   (textRounding && hasFractionalHeight),
                   (textRounding && !hasFractionalHeight)) -
          algo::RoundValueToPixelGrid(
                   topAsDouble, pointScaleFactor, false, textRounding);
    }

   private:
    void setPositionForEdge(const Float position, const Edge edge) {
      switch (edge) {
        case Edge::Left:
          left = position;
          break;
        case Edge::Top:
          top = position;
          break;
        case Edge::Right:
          left = position - width;
          break;
        case Edge::Bottom:
          top = position - height;
          break;
      }
    }
  };

  Float width;
  Float height;
  Float baseline = UNDEFINED;

  void
  setSize(const FlexDirection axis, const Float mainDim, const Float crossDim) {
    switch (axis) {
      case FlexDirection::Row:
      case FlexDirection::RowReverse:
        width = mainDim;
        height = crossDim;
        break;
      case FlexDirection::Column:
      case FlexDirection::ColumnReverse:
        width = crossDim;
        height = mainDim;
        break;
    }
  }

  void roundToPixelGrid(const double pointScaleFactor) {
    // This used to depend on NodeType (Default or Text), not sure if we need
    // this now
    const bool textRounding = false;

    // We multiply dimension by scale factor and if the result is close to the
    // whole number, we don't have any fraction To verify if the result is close
    // to whole number we want to check both floor and ceil numbers
    const bool hasFractionalWidth =
        !utils::FlexLayoutDoubleEqual(
            fmod((double)width * pointScaleFactor, 1.0), 0) &&
        !utils::FlexLayoutDoubleEqual(
            fmod((double)width * pointScaleFactor, 1.0), 1.0);
    const bool hasFractionalHeight =
        !utils::FlexLayoutDoubleEqual(
            fmod((double)height * pointScaleFactor, 1.0), 0) &&
        !utils::FlexLayoutDoubleEqual(
            fmod((double)height * pointScaleFactor, 1.0), 1.0);

    width = algo::RoundValueToPixelGrid(
        width,
        pointScaleFactor,
        (textRounding && hasFractionalWidth),
        (textRounding && !hasFractionalWidth));

    height = algo::RoundValueToPixelGrid(
        height,
        pointScaleFactor,
        (textRounding && hasFractionalHeight),
        (textRounding && !hasFractionalHeight));
  }
};

template <typename MeasureResult>
class FLEX_LAYOUT_EXPORT LayoutOutput : public LayoutOutputBase {
 public:
  struct Child : LayoutOutputBase::Child {
    MeasureResult measureResult;

    void setMeasureOutput(
        MeasureOutput<MeasureResult> mo,
        const MeasureParams& params) {
      width = mo.width;
      height = mo.height;
      baseline = mo.baseline;
      measureResult = std::move(mo.result);
      lastMeasureParams = params;
    }
  };

  void roundToPixelGrid(const double pointScaleFactor) {
    if (pointScaleFactor == 0.0f) {
      return;
    }

    LayoutOutputBase::roundToPixelGrid(pointScaleFactor);
    for (auto& child : children) {
      child.roundToPixelGrid(pointScaleFactor);
    }
  }

  std::vector<Child> children = {};
};

} // namespace layoutoutput
} // namespace flexlayout
} // namespace facebook
