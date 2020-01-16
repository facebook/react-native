/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <string>
#include <vector>

#include <react/graphics/Geometry.h>

namespace facebook {
namespace react {

class ImageSource {
 public:
  enum class Type { Invalid, Remote, Local };

  Type type{};
  std::string uri{};
  std::string bundle{};
  Float scale{3};
  Size size{0};

  bool operator==(const ImageSource &rhs) const {
    return std::tie(this->type, this->uri) == std::tie(rhs.type, rhs.uri);
  }

  bool operator!=(const ImageSource &rhs) const {
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

} // namespace react
} // namespace facebook
