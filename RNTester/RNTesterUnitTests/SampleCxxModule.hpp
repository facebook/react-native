// Copyright (c) Facebook, Inc. and its affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

#ifndef SampleCxxModule_hpp
#define SampleCxxModule_hpp

#include <cxxreact/CxxModule.h>

class SampleCxxModule : public facebook::xplat::module::CxxModule
{
public:
  SampleCxxModule();
  
  std::string getName();
  
  std::map<std::string, folly::dynamic> getConstants();
  std::vector<Method> getMethods();
};

#endif /* SampleCxxModule_hpp */
