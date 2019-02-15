/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <memory>

#import <Foundation/Foundation.h>

#import <React/RCTBridge.h>
#import <React/RCTBridgeModule.h>
#import <cxxreact/MessageQueueThread.h>
#import <jsireact/JSCallInvoker.h>
#import <jsireact/TurboModule.h>

#define RCT_IS_TURBO_MODULE_CLASS(klass) ((RCTTurboModuleEnabled() && [(klass) conformsToProtocol:@protocol(RCTTurboModule)]))
#define RCT_IS_TURBO_MODULE_INSTANCE(module) RCT_IS_TURBO_MODULE_CLASS([(module) class])

namespace facebook {
namespace react {

/**
 * ObjC++ specific TurboModule base class.
 */
class JSI_EXPORT ObjCTurboModule : public TurboModule {
public:
  ObjCTurboModule(const std::string &name, id<RCTTurboModule> instance, std::shared_ptr<JSCallInvoker> jsInvoker);

  virtual jsi::Value invokeMethod(
      jsi::Runtime &runtime,
      TurboModuleMethodValueKind valueKind,
      const std::string &methodName,
      const jsi::Value *args,
      size_t count) override;

  id<RCTTurboModule> instance_;
};

} // namespace react
} // namespace facebook

@protocol RCTTurboModule <NSObject>
@optional
/**
 * Used by TurboModules to get access to other TurboModules.
 *
 * Usage:
 * Place `@synthesize turboModuleLookupDelegate = _turboModuleLookupDelegate`
 * in the @implementation section of your TurboModule.
 */
@property (nonatomic, weak) id<RCTTurboModuleLookupDelegate> turboModuleLookupDelegate;

@optional
// This should be required, after migration is done.
- (std::shared_ptr<facebook::react::TurboModule>)getTurboModuleWithJsInvoker:(std::shared_ptr<facebook::react::JSCallInvoker>)jsInvoker;

@end

// TODO: Consolidate this extension with the one in RCTSurfacePresenter.
@interface RCTBridge ()

- (std::shared_ptr<facebook::react::MessageQueueThread>)jsMessageThread;

@end
