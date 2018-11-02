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
  std::weak_ptr<facebook::react::Instance> instance = this->getInstance();
  
  return
  {
    Method("foo", [instance = this->getInstance().lock()](dynamic args)
     {
       if (instance)
         instance->callJSFunction("RCTDeviceEventEmitter", "emit", dynamic::array(jsArgAsInt(args, 0)));
     })
  };
}
