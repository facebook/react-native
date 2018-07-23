/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ImageLocalData.h"

#include <fabric/components/image/conversions.h>
#include <fabric/debug/debugStringConvertibleUtils.h>

namespace facebook {
namespace react {

ImageSource ImageLocalData::getImageSource() const {
  return imageSource_;
}

const ImageRequest &ImageLocalData::getImageRequest() const {
  return imageRequest_;
}

#pragma mark - DebugStringConvertible

std::string ImageLocalData::getDebugName() const {
  return "ImageLocalData";
}

SharedDebugStringConvertibleList ImageLocalData::getDebugProps() const {
  return {
    debugStringConvertibleItem("imageSource", imageSource_)
  };
}

} // namespace react
} // namespace facebook
