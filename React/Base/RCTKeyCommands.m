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

#import "RCTDefines.h"
#import "RCTUtils.h"

#if RCT_DEV

static BOOL RCTIsIOS8OrEarlier()
{
  return [UIDevice currentDevice].systemVersion.floatValue < 9;
}

@interface RCTKeyCommand : NSObject <NSCopying>

@property (nonatomic, strong) UIKeyCommand *keyCommand;
@property (nonatomic, copy) void (^block)(UIKeyCommand *);

@end

@implementation RCTKeyCommand

- (instancetype)initWithKeyCommand:(UIKeyCommand *)keyCommand
                             block:(void (^)(UIKeyCommand *))block
{
  if ((self = [super init])) {
    _keyCommand = keyCommand;
    _block = block;
  }
  return self;
}

RCT_NOT_IMPLEMENTED(- (instancetype)init)

- (id)copyWithZone:(__unused NSZone *)zone
{
  return self;
}

- (NSUInteger)hash
{
  return _keyCommand.input.hash ^ _keyCommand.modifierFlags;
}

- (BOOL)isEqual:(RCTKeyCommand *)object
{
  if (![object isKindOfClass:[RCTKeyCommand class]]) {
    return NO;
  }
  return [self matchesInput:object.keyCommand.input
                      flags:object.keyCommand.modifierFlags];
}

- (BOOL)matchesInput:(NSString *)input flags:(UIKeyModifierFlags)flags
{
  return [_keyCommand.input isEqual:input] && _keyCommand.modifierFlags == flags;
}

- (NSString *)description
{
  return [NSString stringWithFormat:@"<%@:%p input=\"%@\" flags=%zd hasBlock=%@>",
          [self class], self, _keyCommand.input, _keyCommand.modifierFlags,
          _block ? @"YES" : @"NO"];
}

@end

@interface RCTKeyCommands ()

@property (nonatomic, strong) NSMutableSet<RCTKeyCommand *> *commands;

@end

@implementation UIResponder (RCTKeyCommands)

- (NSArray<UIKeyCommand *> *)RCT_keyCommands
{
  NSSet<RCTKeyCommand *> *commands = [RCTKeyCommands sharedInstance].commands;
  return [[commands valueForKeyPath:@"keyCommand"] allObjects];
}

- (void)RCT_handleKeyCommand:(UIKeyCommand *)key
{
  // NOTE: throttle the key handler because on iOS 9 the handleKeyCommand:
  // method gets called repeatedly if the command key is held down.

  static NSTimeInterval lastCommand = 0;
  if (RCTIsIOS8OrEarlier() || CACurrentMediaTime() - lastCommand > 0.5) {
    for (RCTKeyCommand *command in [RCTKeyCommands sharedInstance].commands) {
      if ([command.keyCommand.input isEqualToString:key.input] &&
          command.keyCommand.modifierFlags == key.modifierFlags) {
        if (command.block) {
          command.block(key);
          lastCommand = CACurrentMediaTime();
        }
      }
    }
  }
}

@end

@implementation UIApplication (RCTKeyCommands)

// Required for iOS 8.x
- (BOOL)RCT_sendAction:(SEL)action to:(id)target from:(id)sender forEvent:(UIEvent *)event
{
  if (action == @selector(RCT_handleKeyCommand:)) {
    [self RCT_handleKeyCommand:sender];
    return YES;
  }
  return [self RCT_sendAction:action to:target from:sender forEvent:event];
}

@end

@implementation RCTKeyCommands

+ (void)initialize
{
  if (RCTIsIOS8OrEarlier()) {

    //swizzle UIApplication
    RCTSwapInstanceMethods([UIApplication class],
                           @selector(keyCommands),
                           @selector(RCT_keyCommands));

    RCTSwapInstanceMethods([UIApplication class],
                           @selector(sendAction:to:from:forEvent:),
                           @selector(RCT_sendAction:to:from:forEvent:));
  } else {

    //swizzle UIResponder
    RCTSwapInstanceMethods([UIResponder class],
                           @selector(keyCommands),
                           @selector(RCT_keyCommands));
  }
}

+ (instancetype)sharedInstance
{
  static RCTKeyCommands *sharedInstance;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    sharedInstance = [self new];
  });

  return sharedInstance;
}

- (instancetype)init
{
  if ((self = [super init])) {
    _commands = [NSMutableSet new];
  }
  return self;
}

- (void)registerKeyCommandWithInput:(NSString *)input
                      modifierFlags:(UIKeyModifierFlags)flags
                             action:(void (^)(UIKeyCommand *))block
{
  RCTAssertMainThread();

  if (input.length && flags && RCTIsIOS8OrEarlier()) {

    // Workaround around the first cmd not working: http://openradar.appspot.com/19613391
    // You can register just the cmd key and do nothing. This ensures that
    // command-key modified commands will work first time. Fixed in iOS 9.

    [self registerKeyCommandWithInput:@""
                        modifierFlags:flags
                               action:nil];
  }

  UIKeyCommand *command = [UIKeyCommand keyCommandWithInput:input
                                              modifierFlags:flags
                                                     action:@selector(RCT_handleKeyCommand:)];

  RCTKeyCommand *keyCommand = [[RCTKeyCommand alloc] initWithKeyCommand:command block:block];
  [_commands removeObject:keyCommand];
  [_commands addObject:keyCommand];
}

- (void)unregisterKeyCommandWithInput:(NSString *)input
                        modifierFlags:(UIKeyModifierFlags)flags
{
  RCTAssertMainThread();

  for (RCTKeyCommand *command in _commands.allObjects) {
    if ([command matchesInput:input flags:flags]) {
      [_commands removeObject:command];
      break;
    }
  }
}

- (BOOL)isKeyCommandRegisteredForInput:(NSString *)input
                         modifierFlags:(UIKeyModifierFlags)flags
{
  RCTAssertMainThread();

  for (RCTKeyCommand *command in _commands) {
    if ([command matchesInput:input flags:flags]) {
      return YES;
    }
  }
  return NO;
}

@end

#else

@implementation RCTKeyCommands

+ (instancetype)sharedInstance
{
  return nil;
}

- (void)registerKeyCommandWithInput:(NSString *)input
                      modifierFlags:(UIKeyModifierFlags)flags
                             action:(void (^)(UIKeyCommand *))block {}

- (void)unregisterKeyCommandWithInput:(NSString *)input
                        modifierFlags:(UIKeyModifierFlags)flags {}

- (BOOL)isKeyCommandRegisteredForInput:(NSString *)input
                         modifierFlags:(UIKeyModifierFlags)flags
{
  return NO;
}

@end

#endif
