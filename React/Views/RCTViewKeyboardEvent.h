/*
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>
#import <React/RCTComponentEvent.h>

@interface RCTViewKeyboardEvent : RCTComponentEvent
+ (instancetype)keyDownEventWithReactTag:(NSNumber *)reactTag
                             capsLockKey:(BOOL)capsLockKey
                             shiftKey:(BOOL)shiftKey
                              ctrlKey:(BOOL)controlKey
                               altKey:(BOOL)optionKey
                              metaKey:(BOOL)commandKey
                        numericPadKey:(BOOL)numericPadKey
                              helpKey:(BOOL)helpKey
                          functionKey:(BOOL)functionKey
                         leftArrowKey:(BOOL)leftArrowKey
                        rightArrowKey:(BOOL)rightArrowKey
                           upArrowKey:(BOOL)upArrowKey
                         downArrowKey:(BOOL)downArrowKey
                                  key:(NSString *)key;

+ (instancetype)keyUpEventWithReactTag:(NSNumber *)reactTag
                           capsLockKey:(BOOL)capsLockKey
                              shiftKey:(BOOL)shiftKey
                               ctrlKey:(BOOL)controlKey
                                altKey:(BOOL)optionKey
                               metaKey:(BOOL)commandKey
                         numericPadKey:(BOOL)numericPadKey
                               helpKey:(BOOL)helpKey
                           functionKey:(BOOL)functionKey
                          leftArrowKey:(BOOL)leftArrowKey
                         rightArrowKey:(BOOL)rightArrowKey
                            upArrowKey:(BOOL)upArrowKey
                          downArrowKey:(BOOL)downArrowKey
                                   key:(NSString *)key;
@end
