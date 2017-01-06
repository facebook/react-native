// Copyright 2004-present Facebook. All Rights Reserved.

#pragma once

#include <jschelpers/Value.h>

#include "Executor.h"

namespace facebook {
namespace react {

String jsStringFromBigString(JSContextRef ctx, const JSBigString& bigstr);

}
}
