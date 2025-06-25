/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <string>
#include <vector>

#include <react/renderer/core/propsConversions.h>
#include <react/renderer/graphics/Float.h>
#include <react/renderer/graphics/Size.h>

namespace facebook::react {

class ImageSource {
 public:
  enum class Type { Invalid, Remote, Local };
  enum class CacheStategy { Default, Reload, ForceCache, OnlyIfCached };

  Type type{};
  std::string uri{};
  std::string bundle{};
  Float scale{3};
  Size size{0};
  std::string body{};
  std::string method{};
  CacheStategy cache = CacheStategy::Default;
  std::vector<std::pair<std::string, std::string>> headers{};

  bool operator==(const ImageSource& rhs) const {
    return std::tie(this->type, this->uri) == std::tie(rhs.type, rhs.uri);
  }

  bool operator!=(const ImageSource& rhs) const {
    return !(*this == rhs);
  }

#ifdef RN_SERIALIZABLE_STATE
  folly::dynamic toDynamic() const {
    folly::dynamic imageSourceResult = folly::dynamic::object();
    switch (type) {
      case ImageSource::Type::Invalid:
        imageSourceResult["type"] = "invalid";
        break;
      case ImageSource::Type::Remote:
        imageSourceResult["type"] = "remote";
        break;
      case ImageSource::Type::Local:
        imageSourceResult["type"] = "local";
        break;
    }

    imageSourceResult["uri"] = uri;
    imageSourceResult["bundle"] = bundle;
    imageSourceResult["scale"] = scale;

    folly::dynamic sizeResult = folly::dynamic::object();
    sizeResult["width"] = size.width;
    sizeResult["height"] = size.height;
    imageSourceResult["size"] = sizeResult;

    imageSourceResult["body"] = body;
    imageSourceResult["method"] = method;

    switch (cache) {
      case ImageSource::CacheStategy::Default:
        imageSourceResult["cache"] = "default";
        break;
      case ImageSource::CacheStategy::Reload:
        imageSourceResult["cache"] = "reload";
        break;
      case ImageSource::CacheStategy::ForceCache:
        imageSourceResult["cache"] = "force-cache";
        break;
      case ImageSource::CacheStategy::OnlyIfCached:
        imageSourceResult["cache"] = "only-if-cached";
        break;
    }

    folly::dynamic headersObject = folly::dynamic::object();
    for (const auto& header : headers) {
      headersObject[header.first] = header.second;
    }
    imageSourceResult["headers"] = headersObject;
    return imageSourceResult;
  }

#endif
};

#ifdef RN_SERIALIZABLE_STATE
inline folly::dynamic toDynamic(const ImageSource& imageSource) {
  return imageSource.toDynamic();
}
#endif

using ImageSources = std::vector<ImageSource>;

enum class ImageResizeMode {
  Cover,
  Contain,
  Stretch,
  Center,
  Repeat,
  None,
};

class ImageErrorInfo {
 public:
  std::string error{};
  int responseCode{};
  std::vector<std::pair<std::string, std::string>> httpResponseHeaders{};
};

} // namespace facebook::react
