/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <React/RCTModuleData.h>
#import <cxxreact/NativeModule.h>

namespace facebook {
namespace react {

class RCTNativeModule : public NativeModule {
 public:
  RCTNativeModule(RCTBridge *bridge, RCTModuleData *moduleData);

  std::string getName() override;
  std::vector<MethodDescriptor> getMethods() override;
  folly::dynamic getConstants() override;
  void invoke(unsigned int methodId, folly::dynamic &&params, int callId) override;
  MethodCallResult callSerializableNativeHook(unsigned int reactMethodId, folly::dynamic &&params) override;

 private:
  __weak RCTBridge *m_bridge;
  RCTModuleData *m_moduleData;
  MethodCallResult invokeInner(unsigned int methodId, const folly::dynamic &&params);
};

}
}
