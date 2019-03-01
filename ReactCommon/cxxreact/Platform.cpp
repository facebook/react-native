// Copyright (c) 2004-present, Facebook, Inc.

// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

#include "Platform.h"

namespace facebook {
namespace react {

#if __clang__
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wglobal-constructors"
#endif

#if !defined(NOJSC) && (!V8_ENABLED)
namespace JSCNativeHooks {

Hook loggingHook = nullptr;
Hook nowHook = nullptr;
ConfigurationHook installPerfHooks = nullptr;

}
#endif // !defined(NOJSC)

#if __clang__
#pragma clang diagnostic pop
#endif

namespace Logging {
  static LoggingLevel s_loggingLevel = INFO;

  LoggingLevel getLevel() {
    return s_loggingLevel;
  }

  LoggingLevel forValue(int loggingLevel) {
    switch (loggingLevel) {
      case 10:
        return ERROR;
      break;
      case 15:
        return WARNING;
      break;
      case 50:
        return INFO;
      break;
      case 100:
      case 200:
        return VERBOSE;
      break;
    }
    return INFO;
  }

  void setLevel(LoggingLevel level) {
      s_loggingLevel = level;
  }
}

} }
