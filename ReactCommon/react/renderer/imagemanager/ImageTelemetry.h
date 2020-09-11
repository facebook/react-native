/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <react/renderer/core/ReactPrimitives.h>

namespace facebook {
namespace react {

/*
 * Represents telemetry data associated with a image request
 */
class ImageTelemetry final {
 public:
  ImageTelemetry(SurfaceId const surfaceId) : surfaceId_(surfaceId) {}

  SurfaceId getSurfaceId() const;
  std::string getLoaderModuleName() const;
  void setLoaderModuleName(std::string const &loaderModuleName);

 private:
  const SurfaceId surfaceId_;
  std::string loaderModuleName_{""};
};

} // namespace react
} // namespace facebook
