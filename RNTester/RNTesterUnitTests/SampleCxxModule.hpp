// Copyright (c) Facebook, Inc. and its affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

#ifndef SampleCxxModule_hpp
#define SampleCxxModule_hpp

#include <cxxreact/CxxModule.h>
#include <cxxreact/NativeModule.h>

//class SampleCxxModule : public facebook::xplat::module::CxxModule
//{
//public:
//  SampleCxxModule();
//
//  std::string getName() override;
//
//  std::map<std::string, folly::dynamic> getConstants() override;
//
//  std::vector<Method> getMethods() override;
//};

class SampleNativeModule : public facebook::react::NativeModule
{
  std::weak_ptr<facebook::react::Instance> m_wkInstance;
  
public:
  SampleNativeModule(std::shared_ptr<facebook::react::Instance> instance);

  std::string getName() override;
  std::vector<facebook::react::MethodDescriptor> getMethods() override;
  folly::dynamic getConstants() override;
  void invoke(unsigned int reactMethodId, folly::dynamic&& params, int callId) override;
  facebook::react::MethodCallResult callSerializableNativeHook(unsigned int reactMethodId, folly::dynamic&& args) override;
};

#endif /* SampleCxxModule_hpp */
