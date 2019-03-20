/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <React/RCTBridge.h>
#import <React/RCTBridgeModule.h>
#import <React/RCTErrorCustomizer.h>

@class RCTJSStackFrame;

@interface RCTRedBox : NSObject <RCTBridgeModule>

- (void)registerErrorCustomizer:(id<RCTErrorCustomizer>)errorCustomizer;
- (void)showError:(NSError *)error;
- (void)showErrorMessage:(NSString *)message;
- (void)showErrorMessage:(NSString *)message withDetails:(NSString *)details;
- (void)showErrorMessage:(NSString *)message withRawStack:(NSString *)rawStack;
- (void)showErrorMessage:(NSString *)message withStack:(NSArray<NSDictionary *> *)stack;
- (void)updateErrorMessage:(NSString *)message withStack:(NSArray<NSDictionary *> *)stack;
- (void)showErrorMessage:(NSString *)message withParsedStack:(NSArray<RCTJSStackFrame *> *)stack;
- (void)updateErrorMessage:(NSString *)message withParsedStack:(NSArray<RCTJSStackFrame *> *)stack;

- (void)dismiss;

/** Overrides bridge.bundleURL. Modify on main thread only. You shouldn't need to use this. */
@property (nonatomic, strong) NSURL *overrideBundleURL;

/** Overrides the default behavior of calling [bridge reload] on reload. You shouldn't need to use this. */
@property (nonatomic, strong) dispatch_block_t overrideReloadAction;

@end

/**
 * This category makes the red box instance available via the RCTBridge, which
 * is useful for any class that needs to access the red box or error log.
 */
@interface RCTBridge (RCTRedBox)

@property (nonatomic, readonly) RCTRedBox *redBox;

@end
