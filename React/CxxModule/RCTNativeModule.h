/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTModuleData.h>
#import <cxxreact/NativeModule.h>

namespace facebook {
namespace react {

class RCTNativeModule : public NativeModule {
 public:
  RCTNativeModule(RCTBridge *bridge, RCTModuleData *moduleData);

  std::string getName() override;
  std::string getSyncMethodName(unsigned int methodId) override;
  std::vector<MethodDescriptor> getMethods() override;
  folly::dynamic getConstants() override;
  void invoke(unsigned int methodId, folly::dynamic &&params, int callId)
      override;
  MethodCallResult callSerializableNativeHook(
      unsigned int reactMethodId,
      folly::dynamic &&params) override;

 private:
  __weak RCTBridge *m_bridge;
  RCTModuleData *m_moduleData;
};

} // namespace react
} // namespace facebook
