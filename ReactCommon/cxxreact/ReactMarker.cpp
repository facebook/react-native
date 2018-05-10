// Copyright 2004-present Facebook. All Rights Reserved.

#include "ReactMarker.h"

namespace facebook {
namespace react {
namespace ReactMarker {

#if __clang__
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wglobal-constructors"
#endif

LogTaggedMarker logTaggedMarker = nullptr;

#if __clang__
#pragma clang diagnostic pop
#endif

void logMarker(const ReactMarkerId markerId) {
  logTaggedMarker(markerId, nullptr);
}

}
}
}
