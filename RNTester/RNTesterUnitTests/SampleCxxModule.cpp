//
//  SampleCxxModule.cpp
//  RNTesterUnitTests
//
//  Created by Julio Cesar Rocha on 11/1/18.
//  Copyright © 2018 Facebook. All rights reserved.
//

#include "SampleCxxModule.hpp"

#include <cxxreact/Instance.h>
#include <cxxreact/JsArgumentHelpers.h>

using namespace facebook::react;

using facebook::xplat::jsArgAsInt;
using folly::dynamic;
using std::map;
using std::string;
using std::vector;

SampleCxxModule::SampleCxxModule()
{
}

string SampleCxxModule::getName()
{
  return "SampleCxxModule";
}

map<string, dynamic> SampleCxxModule::getConstants()
{
  return {};
}

vector<SampleCxxModule::Method> SampleCxxModule::getMethods()
{
  return
  {
    Method("sum", [instance = this->getInstance().lock()](dynamic args)
     {
       auto sum = jsArgAsInt(args, 0) + jsArgAsInt(args, 1);
       if (instance)
         instance->callJSFunction("MockedModule", "mockedMethod", dynamic::array(jsArgAsInt(args, 0), sum));
     })
  };
}
