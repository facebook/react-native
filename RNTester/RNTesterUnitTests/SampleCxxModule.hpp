//
//  SampleCxxModule.hpp
//  RNTesterUnitTests
//
//  Created by Julio Cesar Rocha on 11/1/18.
//  Copyright © 2018 Facebook. All rights reserved.
//

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
