/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <memory>

namespace facebook {
namespace react {

/*
 * Represents retrieved image bitmap and any assotiated platform-specific info.
 */
class ImageResponse final {
 public:
  ImageResponse(const std::shared_ptr<void> &image);

  std::shared_ptr<void> getImage() const;

 private:
  std::shared_ptr<void> image_;
};

} // namespace react
} // namespace facebook
