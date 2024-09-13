/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTCxxMethod.h"

#import <React/RCTBridge+Private.h>
#import <React/RCTBridge.h>
#import <React/RCTConvert.h>
#import <React/RCTFollyConvert.h>
#import <cxxreact/JsArgumentHelpers.h>

#import "RCTCxxUtils.h"

#import <memory>

using facebook::xplat::module::CxxModule;
using namespace facebook::react;

@implementation RCTCxxMethod {
  std::unique_ptr<CxxModule::Method> _method;
}

- (instancetype)initWithCxxMethod:(const CxxModule::Method &)method
{
  if ((self = [super init])) {
    _method = std::make_unique<CxxModule::Method>(method);
  }
  return self;
}

- (const char *)JSMethodName
{
  return _method->name.c_str();
}

- (RCTFunctionType)functionType
{
  std::string type(_method->getType());
  if (type == "sync") {
    return RCTFunctionTypeSync;
  } else if (type == "async") {
    return RCTFunctionTypeNormal;
  } else {
    return RCTFunctionTypePromise;
  }
}

- (id)invokeWithBridge:(RCTBridge *)bridge module:(id)module arguments:(NSArray *)arguments
{
  // module is unused except for printing errors. The C++ object it represents
  // is also baked into _method.

  // the last N arguments are callbacks, according to the Method data.  The
  // preceding arguments are values which have already been parsed from JS: they
  // may be NSNumber (bool, int, double), NSString, NSArray, or NSObject.

  CxxModule::Callback first;
  CxxModule::Callback second;

  if (arguments.count < _method->callbacks) {
    RCTLogError(
        @"Method %@.%s expects at least %zu arguments, but got %tu",
        RCTBridgeModuleNameForClass([module class]),
        _method->name.c_str(),
        _method->callbacks,
        arguments.count);
    return nil;
  }

  if (_method->callbacks >= 1) {
    if (![arguments[arguments.count - 1] isKindOfClass:[NSNumber class]]) {
      RCTLogError(
          @"Argument %tu (%@) of %@.%s should be a function",
          arguments.count - 1,
          arguments[arguments.count - 1],
          RCTBridgeModuleNameForClass([module class]),
          _method->name.c_str());
      return nil;
    }

    NSNumber *id1;
    if (_method->callbacks == 2) {
      if (![arguments[arguments.count - 2] isKindOfClass:[NSNumber class]]) {
        RCTLogError(
            @"Argument %tu (%@) of %@.%s should be a function",
            arguments.count - 2,
            arguments[arguments.count - 2],
            RCTBridgeModuleNameForClass([module class]),
            _method->name.c_str());
        return nil;
      }

      id1 = arguments[arguments.count - 2];
      NSNumber *id2 = arguments[arguments.count - 1];

      second = ^(std::vector<folly::dynamic> args) {
        folly::dynamic obj = folly::dynamic::array;
        for (auto &arg : args) {
          obj.push_back(std::move(arg));
        }
        [bridge enqueueCallback:id2 args:convertFollyDynamicToId(std::move(obj))];
      };
    } else {
      id1 = arguments[arguments.count - 1];
    }

    first = ^(std::vector<folly::dynamic> args) {
      folly::dynamic obj = folly::dynamic::array;
      for (auto &arg : args) {
        obj.push_back(std::move(arg));
      }
      [bridge enqueueCallback:id1 args:convertFollyDynamicToId(std::move(obj))];
    };
  }

  folly::dynamic args = convertIdToFollyDynamic(arguments);
  args.resize(args.size() - _method->callbacks);

  try {
    if (_method->func) {
      _method->func(std::move(args), first, second);
      return nil;
    } else {
      auto result = _method->syncFunc(std::move(args));
      // TODO: we should convert this to JSValue directly
      return convertFollyDynamicToId(result);
    }
  } catch (const facebook::xplat::JsArgumentException &ex) {
    RCTLogError(
        @"Method %@.%s argument error: %s",
        RCTBridgeModuleNameForClass([module class]),
        _method->name.c_str(),
        ex.what());
    return nil;
  }
}

- (NSString *)description
{
  return [NSString stringWithFormat:@"<%@: %p; name = %s>", [self class], self, self.JSMethodName];
}

@end
