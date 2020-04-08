/*
* Copyright (c) Facebook, Inc. and its affiliates.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

#ifndef SampleCxxModule_hpp
#define SampleCxxModule_hpp

#include <cxxreact/CxxModule.h>
#include <cxxreact/NativeModule.h>

class SampleCxxModule : public facebook::xplat::module::CxxModule
{
public:
  SampleCxxModule();

  std::string getName() override;

  std::map<std::string, folly::dynamic> getConstants() override;

  std::vector<Method> getMethods() override;
};

#endif /* SampleCxxModule_hpp */
