/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/imagemanager/ImageManager.h>
#include <react/renderer/imagemanager/ImageTelemetry.h>
#include <react/renderer/imagemanager/primitives.h>
#include <memory>
#include <string>
#include <vector>

namespace facebook::react {

struct FantomImageRequest {
  std::string uri;
  ImageRequestPriority priority;
};

inline std::string toString(ImageRequestPriority priority)
{
  switch (priority) {
    case ImageRequestPriority::Immediate:
      return "immediate";
    case ImageRequestPriority::Prefetch:
      return "prefetch";
  }
}

class FantomImageManager final : public ImageManager {
 public:
  FantomImageManager() : ImageManager(nullptr) {}

  ImageRequest requestImage(
      const ImageSource &imageSource,
      SurfaceId surfaceId,
      const ImageRequestParams &imageRequestParams,
      Tag /*tag*/) const override
  {
    requests_.push_back({imageSource.uri, imageRequestParams.priority});
    return {imageSource, std::make_shared<ImageTelemetry>(surfaceId), {}};
  }

  size_t getRequestCount(const std::string &uri) const
  {
    auto count = size_t{};
    for (const auto &request : requests_) {
      if (request.uri == uri) {
        ++count;
      }
    }
    return count;
  }

  std::string getLatestRequestPriority(const std::string &uri) const
  {
    for (auto it = requests_.rbegin(); it != requests_.rend(); ++it) {
      if (it->uri == uri) {
        return toString(it->priority);
      }
    }
    return "";
  }

  void clearRequests()
  {
    requests_.clear();
  }

 private:
  mutable std::vector<FantomImageRequest> requests_;
};

} // namespace facebook::react
