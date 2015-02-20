// Copyright 2004-present Facebook. All Rights Reserved.

#import <UIKit/UIKit.h>

@interface RCTKeyCommands : NSObject

+ (instancetype)sharedInstance;

/**
 * Register a keyboard command.
 */
- (void)registerKeyCommandWithInput:(NSString *)input
                      modifierFlags:(UIKeyModifierFlags)flags
                             action:(void (^)(UIKeyCommand *command))block;

/**
 * Unregister a keyboard command.
 */
- (void)unregisterKeyCommandWithInput:(NSString *)input
                        modifierFlags:(UIKeyModifierFlags)flags;

/**
 * Check if a command is registered.
 */
- (BOOL)isKeyCommandRegisteredForInput:(NSString *)input
                         modifierFlags:(UIKeyModifierFlags)flags;

@end
