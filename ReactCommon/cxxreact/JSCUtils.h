// Copyright 2004-present Facebook. All Rights Reserved.

#pragma once

#include <cxxreact/JSBigString.h>
#include <jschelpers/JavaScriptCore.h>
#include <jschelpers/Value.h>

namespace facebook {
namespace react {

String jsStringFromBigString(JSContextRef ctx, const JSBigString& bigstr);

}
}
