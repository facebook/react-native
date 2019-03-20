/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

@interface RCTKeyCommands : NSObject

+ (instancetype)sharedInstance;

/**
 * Register a single-press keyboard command.
 */
- (void)registerKeyCommandWithInput:(NSString *)input
                      modifierFlags:(UIKeyModifierFlags)flags
                             action:(void (^)(UIKeyCommand *command))block;

/**
 * Unregister a single-press keyboard command.
 */
- (void)unregisterKeyCommandWithInput:(NSString *)input
                        modifierFlags:(UIKeyModifierFlags)flags;

/**
 * Check if a single-press command is registered.
 */
- (BOOL)isKeyCommandRegisteredForInput:(NSString *)input
                         modifierFlags:(UIKeyModifierFlags)flags;

/**
 * Register a double-press keyboard command.
 */
- (void)registerDoublePressKeyCommandWithInput:(NSString *)input
                      modifierFlags:(UIKeyModifierFlags)flags
                             action:(void (^)(UIKeyCommand *command))block;

/**
 * Unregister a double-press keyboard command.
 */
- (void)unregisterDoublePressKeyCommandWithInput:(NSString *)input
                        modifierFlags:(UIKeyModifierFlags)flags;

/**
 * Check if a double-press command is registered.
 */
- (BOOL)isDoublePressKeyCommandRegisteredForInput:(NSString *)input
                         modifierFlags:(UIKeyModifierFlags)flags;

@end
