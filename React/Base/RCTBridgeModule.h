/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <Foundation/Foundation.h>

#import "RCTJSMethodRegistrar.h"

@class RCTBridge;

/**
 * The type of a block that is capable of sending a response to a bridged
 * operation. Use this for returning callback methods to JS.
 */
typedef void (^RCTResponseSenderBlock)(NSArray *response);

/**
 * Provides the interface needed to register a bridge module.
 */
@protocol RCTBridgeModule <RCTJSMethodRegistrar>
@optional

/**
 * A reference to the RCTBridge. Useful for modules that require access
 * to bridge features, such as sending events or making JS calls. This
 * will be set automatically by the bridge when it initializes the module.
* To implement this in your module, just add @synthesize bridge = _bridge;
 */
@property (nonatomic, strong) RCTBridge *bridge;

/**
 * The module name exposed to JS. If omitted, this will be inferred
 * automatically by using the native module's class name.
 */
+ (NSString *)moduleName;

/**
 * Place this macro inside the method body of any method you want to expose
 * to JS. The optional js_name argument will be used as the JS method name
 * (the method will be namespaced to the module name, as specified above).
 * If omitted, the JS method name will match the first part of the Objective-C
 * method selector name (up to the first colon).
 */
#define RCT_EXPORT(js_name) __attribute__((used, section("__DATA,RCTExport" \
))) static const char *__rct_export_entry__[] = { __func__, #js_name }

/**
 * Injects constants into JS. These constants are made accessible via
 * NativeModules.ModuleName.X. This method is called when the module is
 * registered by the bridge. It is only called once for the lifetime of the
 * bridge, so it is not suitable for returning dynamic values, but may be
 * used for long-lived values such as session keys, that are regenerated only
 * as part of a reload of the entire React application.
 */
- (NSDictionary *)constantsToExport;

/**
 * Notifies the module that a batch of JS method invocations has just completed.
 */
- (void)batchDidComplete;

@end
