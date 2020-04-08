/*
* Copyright (c) Facebook, Inc. and its affiliates.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

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
      int64_t sum = 0;
      for(auto& val : args)
        sum += val.getInt();

      if (instance)
        instance->callJSFunction("MockedModule", "mockedMethod", dynamic::array(sum));
    })
  };
}
