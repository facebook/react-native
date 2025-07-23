/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

 // [macOS]

#import "RCTViewKeyboardEvent.h"
#import <React/RCTAssert.h>

@implementation RCTViewKeyboardEvent

#if TARGET_OS_OSX 
+ (NSDictionary *)bodyFromEvent:(NSEvent *)event
{
  NSString *key = [self keyFromEvent:event];
  NSEventModifierFlags modifierFlags = event.modifierFlags;

  // when making changes here, also consider what should happen to RCTHandledKey. [macOS]
  return @{
    @"key" : key,
    @"capsLockKey" : (modifierFlags & NSEventModifierFlagCapsLock) ? @YES : @NO,
    @"shiftKey" : (modifierFlags & NSEventModifierFlagShift) ? @YES : @NO,
    @"ctrlKey" : (modifierFlags & NSEventModifierFlagControl) ? @YES : @NO,
    @"altKey" : (modifierFlags & NSEventModifierFlagOption) ? @YES : @NO,
    @"metaKey" : (modifierFlags & NSEventModifierFlagCommand) ? @YES : @NO,
    @"numericPadKey" : (modifierFlags & NSEventModifierFlagNumericPad) ? @YES : @NO,
    @"helpKey" : (modifierFlags & NSEventModifierFlagHelp) ? @YES : @NO,
    @"functionKey" : (modifierFlags & NSEventModifierFlagFunction) ? @YES : @NO,
  };
}

+ (NSString *)keyFromEvent:(NSEvent *)event
{
  NSString *key = event.charactersIgnoringModifiers;
  unichar const code = key.length > 0 ? [key characterAtIndex:0] : 0;

  if (event.keyCode == 48) {
    return @"Tab";
  } else if (event.keyCode == 53) {
    return @"Escape";
  } else if (code == NSEnterCharacter || code == NSNewlineCharacter || code == NSCarriageReturnCharacter) {
    return @"Enter";
  } else if (code == NSLeftArrowFunctionKey) {
    return @"ArrowLeft";
  } else if (code == NSRightArrowFunctionKey) {
    return @"ArrowRight";
  } else if (code == NSUpArrowFunctionKey) {
    return @"ArrowUp";
  } else if (code == NSDownArrowFunctionKey) {
    return @"ArrowDown";
  } else if (code == NSBackspaceCharacter || code == NSDeleteCharacter) {
    return @"Backspace";
  } else if (code == NSDeleteFunctionKey) {
    return @"Delete";
  } else if (code == NSHomeFunctionKey) {
    return @"Home";
  } else if (code == NSEndFunctionKey) {
    return @"End";
  } else if (code == NSPageUpFunctionKey) {
    return @"PageUp";
  } else if (code == NSPageDownFunctionKey) {
    return @"PageDown";
  } else if (code == NSF1FunctionKey) {
    return @"F1";
  } else if (code == NSF2FunctionKey) {
    return @"F2";
  } else if (code == NSF3FunctionKey) {
    return @"F3";
  } else if (code == NSF4FunctionKey) {
    return @"F4";
  } else if (code == NSF5FunctionKey) {
    return @"F5";
  } else if (code == NSF6FunctionKey) {
    return @"F6";
  } else if (code == NSF7FunctionKey) {
    return @"F7";
  } else if (code == NSF8FunctionKey) {
    return @"F8";
  } else if (code == NSF9FunctionKey) {
    return @"F9";
  } else if (code == NSF10FunctionKey) {
    return @"F10";
  } else if (code == NSF11FunctionKey) {
    return @"F11";
  } else if (code == NSF12FunctionKey) {
    return @"F12";
  }

  return key;
}

// Keyboard mappings are aligned cross-platform as much as possible as per this doc https://github.com/microsoft/react-native-windows/blob/master/vnext/proposals/active/keyboard-reconcile-desktop.md
+ (instancetype)keyEventFromEvent:(NSEvent *)event reactTag:(NSNumber *)reactTag
{
  // Ignore "dead keys" (key press that waits for another key to make a character)
  if (!event.charactersIgnoringModifiers.length) {
    return nil;
  }

  return [[self alloc] initWithName:(event.type == NSEventTypeKeyDown ? @"keyDown" : @"keyUp")
                            viewTag:reactTag
                               body:[self bodyFromEvent:event]];
}
#endif

@end
