/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTKeyCommands.h"

#import <UIKit/UIKit.h>

#import "RCTUtils.h"

@interface RCTKeyCommands ()

@property (nonatomic, strong) NSMutableDictionary *commandBindings;

- (void)RCT_handleKeyCommand:(UIKeyCommand *)key;

@end

@implementation UIApplication (RCTKeyCommands)

- (NSArray *)RCT_keyCommands
{
  NSDictionary *commandBindings = [RCTKeyCommands sharedInstance].commandBindings;
  return [[self RCT_keyCommands] arrayByAddingObjectsFromArray:[commandBindings allKeys]];
}

- (BOOL)RCT_sendAction:(SEL)action to:(id)target from:(id)sender forEvent:(UIEvent *)event
{
  if (action == @selector(RCT_handleKeyCommand:)) {
    [[RCTKeyCommands sharedInstance] RCT_handleKeyCommand:sender];
    return YES;
  }
  return [self RCT_sendAction:action to:target from:sender forEvent:event];
}

@end

@implementation RCTKeyCommands

+ (void)initialize
{
  //swizzle UIApplication
  RCTSwapInstanceMethods([UIApplication class], @selector(keyCommands), @selector(RCT_keyCommands));
  RCTSwapInstanceMethods([UIApplication class], @selector(sendAction:to:from:forEvent:), @selector(RCT_sendAction:to:from:forEvent:));
}

static RCTKeyCommands *RKKeyCommandsSharedInstance = nil;

+ (instancetype)sharedInstance
{
  static RCTKeyCommands *sharedInstance;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    sharedInstance = [[self alloc] init];
  });

  return sharedInstance;
}

- (instancetype)init
{
  if ((self = [super init])) {
    _commandBindings = [[NSMutableDictionary alloc] init];
  }
  return self;
}

- (void)RCT_handleKeyCommand:(UIKeyCommand *)key
{
  // NOTE: We should just be able to do commandBindings[key] here, but curiously, the
  // lookup seems to return nil sometimes, even if the key is found in the dictionary.
  // To fix this, we use a linear search, since there won't be many keys anyway

  [_commandBindings enumerateKeysAndObjectsUsingBlock:
   ^(UIKeyCommand *k, void (^block)(UIKeyCommand *), BOOL *stop) {
    if ([key.input isEqualToString:k.input] && key.modifierFlags == k.modifierFlags) {
      block(key);
    }
  }];
}

- (void)registerKeyCommandWithInput:(NSString *)input
                      modifierFlags:(UIKeyModifierFlags)flags
                             action:(void (^)(UIKeyCommand *))block
{
  RCTAssertMainThread();

  UIKeyCommand *command = [UIKeyCommand keyCommandWithInput:input
                                              modifierFlags:flags
                                                     action:@selector(RCT_handleKeyCommand:)];

  _commandBindings[command] = block ?: ^(UIKeyCommand *cmd) {};
}

- (void)unregisterKeyCommandWithInput:(NSString *)input
                        modifierFlags:(UIKeyModifierFlags)flags
{
  RCTAssertMainThread();

  for (UIKeyCommand *key in [_commandBindings allKeys]) {
    if ([key.input isEqualToString:input] && key.modifierFlags == flags) {
      [_commandBindings removeObjectForKey:key];
      break;
    }
  }
}

- (BOOL)isKeyCommandRegisteredForInput:(NSString *)input
                         modifierFlags:(UIKeyModifierFlags)flags
{
  RCTAssertMainThread();

  for (UIKeyCommand *key in [_commandBindings allKeys]) {
    if ([key.input isEqualToString:input] && key.modifierFlags == flags) {
      return YES;
    }
  }
  return NO;
}

@end
