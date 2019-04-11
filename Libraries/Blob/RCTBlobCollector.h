/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <jsi/jsi.h>

using namespace facebook;

@class RCTBlobManager;

namespace facebook {
namespace react {

class JSI_EXPORT RCTBlobCollector : public jsi::HostObject {
 public:
  RCTBlobCollector(RCTBlobManager *blobManager, const std::string &blobId);
  ~RCTBlobCollector();

  static void install(RCTBlobManager *blobManager);

 private:
  const std::string blobId_;
  RCTBlobManager *blobManager_;
};

} // namespace react
} // namespace facebook
