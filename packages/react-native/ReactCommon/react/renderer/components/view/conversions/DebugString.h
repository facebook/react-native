/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/components/view/primitives.h>
#include <react/renderer/debug/flags.h>
#include <react/renderer/graphics/Float.h>
#include <react/renderer/graphics/Transform.h>
#include <yoga/YGEnums.h>
#include <yoga/style/Style.h>
#include <string>

namespace facebook::react {

#if RN_DEBUG_STRING_CONVERTIBLE
template <size_t N>
inline std::string toString(const std::array<float, N> vec)
{
  std::string s;

  s.append("{");
  for (size_t i = 0; i < N - 1; i++) {
    s.append(std::to_string(vec[i]) + ", ");
  }
  s.append(std::to_string(vec[N - 1]));
  s.append("}");

  return s;
}

inline std::string toString(const yoga::Direction &value)
{
  return YGDirectionToString(yoga::unscopedEnum(value));
}

inline std::string toString(const yoga::FlexDirection &value)
{
  return YGFlexDirectionToString(yoga::unscopedEnum(value));
}

inline std::string toString(const yoga::Justify &value)
{
  return YGJustifyToString(yoga::unscopedEnum(value));
}

inline std::string toString(const yoga::Align &value)
{
  return YGAlignToString(yoga::unscopedEnum(value));
}

inline std::string toString(const yoga::PositionType &value)
{
  return YGPositionTypeToString(yoga::unscopedEnum(value));
}

inline std::string toString(const yoga::Wrap &value)
{
  return YGWrapToString(yoga::unscopedEnum(value));
}

inline std::string toString(const yoga::Overflow &value)
{
  return YGOverflowToString(yoga::unscopedEnum(value));
}

inline std::string toString(const yoga::Display &value)
{
  return YGDisplayToString(yoga::unscopedEnum(value));
}

inline std::string toString(const yoga::Style::Length &length)
{
  if (length.isUndefined()) {
    return "undefined";
  } else if (length.isAuto()) {
    return "auto";
  } else if (length.isPoints()) {
    return std::to_string(length.value().unwrap());
  } else if (length.isPercent()) {
    return std::to_string(length.value().unwrap()) + "%";
  } else {
    return "unknown";
  }
}

inline std::string toString(const yoga::Style::SizeLength &length)
{
  if (length.isUndefined()) {
    return "undefined";
  } else if (length.isAuto()) {
    return "auto";
  } else if (length.isPoints()) {
    return std::to_string(length.value().unwrap());
  } else if (length.isPercent()) {
    return std::to_string(length.value().unwrap()) + "%";
  } else if (length.isMaxContent()) {
    return "max-content";
  } else if (length.isFitContent()) {
    return "fit-content";
  } else if (length.isStretch()) {
    return "stretch";
  } else {
    return "unknown";
  }
}

inline std::string toString(const yoga::FloatOptional &value)
{
  if (value.isUndefined()) {
    return "undefined";
  }

  return std::to_string(value.unwrap());
}

inline std::string toString(const LayoutConformance &value)
{
  switch (value) {
    case LayoutConformance::Strict:
      return "strict";
    case LayoutConformance::Compatibility:
      return "compatibility";
  }
}

inline std::string toString(const std::array<Float, 16> &m)
{
  std::string result;
  result += "[ " + std::to_string(m[0]) + " " + std::to_string(m[1]) + " " + std::to_string(m[2]) + " " +
      std::to_string(m[3]) + " ]\n";
  result += "[ " + std::to_string(m[4]) + " " + std::to_string(m[5]) + " " + std::to_string(m[6]) + " " +
      std::to_string(m[7]) + " ]\n";
  result += "[ " + std::to_string(m[8]) + " " + std::to_string(m[9]) + " " + std::to_string(m[10]) + " " +
      std::to_string(m[11]) + " ]\n";
  result += "[ " + std::to_string(m[12]) + " " + std::to_string(m[13]) + " " + std::to_string(m[14]) + " " +
      std::to_string(m[15]) + " ]";
  return result;
}

inline std::string toString(const Transform &transform)
{
  std::string result = "[";
  bool first = true;

  for (const auto &operation : transform.operations) {
    if (!first) {
      result += ", ";
    }
    first = false;

    switch (operation.type) {
      case TransformOperationType::Perspective: {
        result += "{\"perspective\": " + std::to_string(operation.x.value) + "}";
        break;
      }
      case TransformOperationType::Rotate: {
        if (operation.x.value != 0 && operation.y.value == 0 && operation.z.value == 0) {
          result += R"({"rotateX": ")" + std::to_string(operation.x.value) + "rad\"}";
        } else if (operation.x.value == 0 && operation.y.value != 0 && operation.z.value == 0) {
          result += R"({"rotateY": ")" + std::to_string(operation.y.value) + "rad\"}";
        } else if (operation.x.value == 0 && operation.y.value == 0 && operation.z.value != 0) {
          result += R"({"rotateZ": ")" + std::to_string(operation.z.value) + "rad\"}";
        }
        break;
      }
      case TransformOperationType::Scale: {
        if (operation.x.value == operation.y.value && operation.x.value == operation.z.value) {
          result += "{\"scale\": " + std::to_string(operation.x.value) + "}";
        } else if (operation.y.value == 1 && operation.z.value == 1) {
          result += "{\"scaleX\": " + std::to_string(operation.x.value) + "}";
        } else if (operation.x.value == 1 && operation.z.value == 1) {
          result += "{\"scaleY\": " + std::to_string(operation.y.value) + "}";
        } else if (operation.x.value == 1 && operation.y.value == 1) {
          result += "{\"scaleZ\": " + std::to_string(operation.z.value) + "}";
        }
        break;
      }
      case TransformOperationType::Translate: {
        if (operation.x.value != 0 && operation.y.value != 0 && operation.z.value == 0) {
          result += "{\"translate\": [";
          result += std::to_string(operation.x.value) + ", " + std::to_string(operation.y.value);
          result += "]}";
        } else if (operation.x.value != 0 && operation.y.value == 0) {
          result += "{\"translateX\": " + std::to_string(operation.x.value) + "}";
        } else if (operation.x.value == 0 && operation.y.value != 0) {
          result += "{\"translateY\": " + std::to_string(operation.y.value) + "}";
        }
        break;
      }
      case TransformOperationType::Skew: {
        if (operation.x.value != 0 && operation.y.value == 0) {
          result += R"({"skewX": ")" + std::to_string(operation.x.value) + "rad\"}";
        } else if (operation.x.value == 0 && operation.y.value != 0) {
          result += R"({"skewY": ")" + std::to_string(operation.y.value) + "rad\"}";
        }
        break;
      }
      case TransformOperationType::Arbitrary: {
        result += "{\"matrix\": " + toString(transform.matrix) + "}";
        break;
      }
      case TransformOperationType::Identity: {
        result += "{\"identity\": true}";
        break;
      }
    }
  }

  result += "]";
  return result;
}
#endif

} // namespace facebook::react
