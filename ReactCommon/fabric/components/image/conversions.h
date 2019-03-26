/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <fabric/imagemanager/primitives.h>
#include <fabric/graphics/conversions.h>
#include <folly/dynamic.h>

namespace facebook {
namespace react {

inline void fromDynamic(const folly::dynamic &value, ImageSource &result) {
  if (value.isString()) {
    result = {
      .type = ImageSource::Type::Remote,
      .uri = value.asString()
    };
    return;
  }

  if (value.isObject()) {
    result = {};

    result.type = ImageSource::Type::Remote;

    if (value.count("__packager_asset")) {
      result.type = ImageSource::Type::Local;
    }

    if (value.count("width") && value.count("height")) {
      fromDynamic(value, result.size);
    }

    if (value.count("scale")) {
      result.scale = (Float)value["scale"].asDouble();
    } else {
      result.scale = value.count("deprecated") ? 0.0 : 1.0;
    }

    if (value.count("url")) {
      result.uri = value["url"].asString();
    }

    if (value.count("uri")) {
      result.uri = value["uri"].asString();
    }

    if (value.count("bundle")) {
      result.bundle = value["bundle"].asString();
      result.type = ImageSource::Type::Local;
    }

    return;
  }

  abort();
}

inline std::string toString(const ImageSource &value) {
  return "{uri: " + value.uri + "}";
}

inline void fromDynamic(const folly::dynamic &value, ImageResizeMode &result) {
  assert(value.isString());
  auto stringValue = value.asString();
  if (stringValue == "cover") { result = ImageResizeMode::Cover; return; }
  if (stringValue == "contain") { result = ImageResizeMode::Contain; return; }
  if (stringValue == "stretch") { result = ImageResizeMode::Stretch; return; }
  if (stringValue == "center") { result = ImageResizeMode::Center; return; }
  if (stringValue == "repeat") { result = ImageResizeMode::Repeat; return; }
  abort();
}

inline std::string toString(const ImageResizeMode &value) {
  switch (value) {
    case ImageResizeMode::Cover: return "cover";
    case ImageResizeMode::Contain: return "contain";
    case ImageResizeMode::Stretch: return "stretch";
    case ImageResizeMode::Center: return "center";
    case ImageResizeMode::Repeat: return "repeat";
  }
}

} // namespace react
} // namespace facebook
