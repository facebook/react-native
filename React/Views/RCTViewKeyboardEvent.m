/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTViewKeyboardEvent.h"
#import <React/RCTAssert.h>

@implementation RCTViewKeyboardEvent

#if TARGET_OS_OSX // TODO(macOS GH#774)
+ (NSDictionary *)bodyFromEvent:(NSEvent *)event
{
  NSString *key = [self keyFromEvent:event];
  NSEventModifierFlags modifierFlags = event.modifierFlags;

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
#endif // TODO(macOS GH#774)

@end
