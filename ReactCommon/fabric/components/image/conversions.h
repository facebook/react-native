/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <better/map.h>
#include <folly/dynamic.h>
#include <react/graphics/conversions.h>
#include <react/imagemanager/primitives.h>

namespace facebook {
namespace react {

inline void fromRawValue(const RawValue &value, ImageSource &result) {
  if (value.hasType<std::string>()) {
    result = {
        /* .type = */ ImageSource::Type::Remote,
        /* .uri = */ (std::string)value,
    };
    return;
  }

  if (value.hasType<better::map<std::string, RawValue>>()) {
    auto items = (better::map<std::string, RawValue>)value;
    result = {};

    result.type = ImageSource::Type::Remote;

    if (items.find("__packager_asset") != items.end()) {
      result.type = ImageSource::Type::Local;
    }

    if (items.find("width") != items.end() &&
        items.find("height") != items.end() &&
        // The following checks have to be removed after codegen is shipped.
        // See T45151459.
        items.at("width").hasType<Float>() &&
        items.at("height").hasType<Float>()) {
      result.size = {(Float)items.at("width"), (Float)items.at("height")};
    }

    if (items.find("scale") != items.end() &&
        // The following checks have to be removed after codegen is shipped.
        // See T45151459.
        items.at("scale").hasType<Float>()) {
      result.scale = (Float)items.at("scale");
    } else {
      result.scale = items.find("deprecated") != items.end() ? 0.0 : 1.0;
    }

    if (items.find("url") != items.end()) {
      result.uri = (std::string)items.at("url");
    }

    if (items.find("uri") != items.end()) {
      result.uri = (std::string)items.at("uri");
    }

    if (items.find("bundle") != items.end()) {
      result.bundle = (std::string)items.at("bundle");
      result.type = ImageSource::Type::Local;
    }

    return;
  }

  abort();
}

inline std::string toString(const ImageSource &value) {
  return "{uri: " + value.uri + "}";
}

inline void fromRawValue(const RawValue &value, ImageResizeMode &result) {
  assert(value.hasType<std::string>());
  auto stringValue = (std::string)value;
  if (stringValue == "cover") {
    result = ImageResizeMode::Cover;
    return;
  }
  if (stringValue == "contain") {
    result = ImageResizeMode::Contain;
    return;
  }
  if (stringValue == "stretch") {
    result = ImageResizeMode::Stretch;
    return;
  }
  if (stringValue == "center") {
    result = ImageResizeMode::Center;
    return;
  }
  if (stringValue == "repeat") {
    result = ImageResizeMode::Repeat;
    return;
  }
  abort();
}

inline std::string toString(const ImageResizeMode &value) {
  switch (value) {
    case ImageResizeMode::Cover:
      return "cover";
    case ImageResizeMode::Contain:
      return "contain";
    case ImageResizeMode::Stretch:
      return "stretch";
    case ImageResizeMode::Center:
      return "center";
    case ImageResizeMode::Repeat:
      return "repeat";
  }
}

} // namespace react
} // namespace facebook
