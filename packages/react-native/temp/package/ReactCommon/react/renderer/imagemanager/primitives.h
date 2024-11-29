/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <string>
#include <vector>

#include <react/renderer/graphics/Float.h>
#include <react/renderer/graphics/Size.h>

namespace facebook::react {

class ImageSource {
 public:
  enum class Type { Invalid, Remote, Local };

  Type type{};
  std::string uri{};
  std::string bundle{};
  Float scale{3};
  Size size{0};
  std::vector<std::pair<std::string, std::string>> headers{};

  bool operator==(const ImageSource& rhs) const {
    return std::tie(this->type, this->uri) == std::tie(rhs.type, rhs.uri);
  }

  bool operator!=(const ImageSource& rhs) const {
    return !(*this == rhs);
  }
};

using ImageSources = std::vector<ImageSource>;

enum class ImageResizeMode {
  Cover,
  Contain,
  Stretch,
  Center,
  Repeat,
};

class ImageErrorInfo {
 public:
  std::string error{};
  int responseCode{};
  std::vector<std::pair<std::string, std::string>> httpResponseHeaders{};
};

} // namespace facebook::react
