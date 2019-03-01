/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTKeyCommands.h"

#import <UIKit/UIKit.h>

#import "RCTDefines.h"
#import "RCTUtils.h"

#if RCT_DEV

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
  return [NSString stringWithFormat:@"<%@:%p input=\"%@\" flags=%lld hasBlock=%@>",
          [self class], self, _keyCommand.input, (long long)_keyCommand.modifierFlags,
          _block ? @"YES" : @"NO"];
}

@end

@interface RCTKeyCommands ()

@property (nonatomic, strong) NSMutableSet<RCTKeyCommand *> *commands;

@end

@implementation UIResponder (RCTKeyCommands)

+ (UIResponder *)RCT_getFirstResponder:(UIResponder *)view
{
  UIResponder *firstResponder = nil;

  if (view.isFirstResponder) {
    return view;
  } else if ([view isKindOfClass:[UIViewController class]]) {
    if ([(UIViewController *)view parentViewController]) {
      firstResponder = [UIResponder RCT_getFirstResponder: [(UIViewController *)view parentViewController]];
    }
    return firstResponder ? firstResponder : [UIResponder RCT_getFirstResponder: [(UIViewController *)view view]];
  } else if ([view isKindOfClass:[UIView class]]) {
    for (UIView *subview in [(UIView *)view subviews]) {
      firstResponder = [UIResponder RCT_getFirstResponder: subview];
      if (firstResponder) {
        return firstResponder;
      }
    }
  }

  return firstResponder;
}

- (NSArray<UIKeyCommand *> *)RCT_keyCommands
{
  NSSet<RCTKeyCommand *> *commands = [RCTKeyCommands sharedInstance].commands;
  return [[commands valueForKeyPath:@"keyCommand"] allObjects];
}

/**
 * Single Press Key Command Response
 * Command + KeyEvent (Command + R/D, etc.)
 */
- (void)RCT_handleKeyCommand:(UIKeyCommand *)key
{
  // NOTE: throttle the key handler because on iOS 9 the handleKeyCommand:
  // method gets called repeatedly if the command key is held down.
  static NSTimeInterval lastCommand = 0;
  if (CACurrentMediaTime() - lastCommand > 0.5) {
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

/**
 * Double Press Key Command Response
 * Double KeyEvent (Double R, etc.)
 */
- (void)RCT_handleDoublePressKeyCommand:(UIKeyCommand *)key
{
  static BOOL firstPress = YES;
  static NSTimeInterval lastCommand = 0;
  static NSTimeInterval lastDoubleCommand = 0;
  static NSString *lastInput = nil;
  static UIKeyModifierFlags lastModifierFlags = 0;

  if (firstPress) {
    for (RCTKeyCommand *command in [RCTKeyCommands sharedInstance].commands) {
      if ([command.keyCommand.input isEqualToString:key.input] &&
          command.keyCommand.modifierFlags == key.modifierFlags &&
          command.block) {

        firstPress = NO;
        lastCommand = CACurrentMediaTime();
        lastInput = key.input;
        lastModifierFlags = key.modifierFlags;
        return;
      }
    }
  } else {
    // Second keyevent within 0.2 second,
    // with the same key as the first one.
    if (CACurrentMediaTime() - lastCommand < 0.2 &&
        lastInput == key.input &&
        lastModifierFlags == key.modifierFlags) {

      for (RCTKeyCommand *command in [RCTKeyCommands sharedInstance].commands) {
        if ([command.keyCommand.input isEqualToString:key.input] &&
            command.keyCommand.modifierFlags == key.modifierFlags &&
            command.block) {

          // NOTE: throttle the key handler because on iOS 9 the handleKeyCommand:
          // method gets called repeatedly if the command key is held down.
          if (CACurrentMediaTime() - lastDoubleCommand > 0.5) {
            command.block(key);
            lastDoubleCommand = CACurrentMediaTime();
          }
          firstPress = YES;
          return;
        }
      }
    }

    lastCommand = CACurrentMediaTime();
    lastInput = key.input;
    lastModifierFlags = key.modifierFlags;
  }
}

@end

@implementation RCTKeyCommands

+ (void)initialize
{
  // swizzle UIResponder
  RCTSwapInstanceMethods([UIResponder class],
                         @selector(keyCommands),
                         @selector(RCT_keyCommands));
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
  RCTAssertMainQueue();

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
  RCTAssertMainQueue();

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
  RCTAssertMainQueue();

  for (RCTKeyCommand *command in _commands) {
    if ([command matchesInput:input flags:flags]) {
      return YES;
    }
  }
  return NO;
}

- (void)registerDoublePressKeyCommandWithInput:(NSString *)input
                      modifierFlags:(UIKeyModifierFlags)flags
                             action:(void (^)(UIKeyCommand *))block
{
  RCTAssertMainQueue();

  UIKeyCommand *command = [UIKeyCommand keyCommandWithInput:input
                                              modifierFlags:flags
                                                     action:@selector(RCT_handleDoublePressKeyCommand:)];

  RCTKeyCommand *keyCommand = [[RCTKeyCommand alloc] initWithKeyCommand:command block:block];
  [_commands removeObject:keyCommand];
  [_commands addObject:keyCommand];
}

- (void)unregisterDoublePressKeyCommandWithInput:(NSString *)input
                        modifierFlags:(UIKeyModifierFlags)flags
{
  RCTAssertMainQueue();

  for (RCTKeyCommand *command in _commands.allObjects) {
    if ([command matchesInput:input flags:flags]) {
      [_commands removeObject:command];
      break;
    }
  }
}

- (BOOL)isDoublePressKeyCommandRegisteredForInput:(NSString *)input
                         modifierFlags:(UIKeyModifierFlags)flags
{
  RCTAssertMainQueue();

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

- (void)registerDoublePressKeyCommandWithInput:(NSString *)input
                      modifierFlags:(UIKeyModifierFlags)flags
                             action:(void (^)(UIKeyCommand *))block {}

- (void)unregisterDoublePressKeyCommandWithInput:(NSString *)input
                        modifierFlags:(UIKeyModifierFlags)flags {}

- (BOOL)isDoublePressKeyCommandRegisteredForInput:(NSString *)input
                         modifierFlags:(UIKeyModifierFlags)flags
{
  return NO;
}

@end

#endif
