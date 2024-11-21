//
//  RawPropsParserInterface.cpp
//  React-Fabric
//
//  Created by Hanno Gödecke on 21.11.2024.
//

#include <react/renderer/core/RawProps.h>
#include <react/renderer/core/RawPropsParserInterface.h>

namespace facebook::react {

const jsi::Value& RawPropsParserInterface::getJsiValue(const RawProps& rawProps) const noexcept {
  return rawProps.value_;
}

}
