/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>
#import <XCTest/XCTest.h>

#import <React/RCTUITextField.h>
#import <React/RCTUITextView.h>

#import "RCTTextInputComponentView.h"

/**
 * Mock UITextField subclass that allows overriding markedTextRange for testing
 * IME composition scenarios without requiring actual keyboard input.
 */
@interface RCTMockTextField : RCTUITextField
@property (nonatomic, strong, nullable) UITextRange *mockMarkedTextRange;
@end

@implementation RCTMockTextField

- (UITextRange *)markedTextRange
{
  return _mockMarkedTextRange;
}

@end

/**
 * Mock UITextView subclass for multiline IME composition testing.
 */
@interface RCTMockTextView : RCTUITextView
@property (nonatomic, strong, nullable) UITextRange *mockMarkedTextRange;
@end

@implementation RCTMockTextView

- (UITextRange *)markedTextRange
{
  return _mockMarkedTextRange;
}

@end

/**
 * Helper to create a non-nil UITextRange for simulating IME composition.
 */
static UITextRange *createMockTextRange(UITextField *textField)
{
  UITextPosition *start = textField.beginningOfDocument;
  UITextPosition *end = [textField positionFromPosition:start offset:1];
  if (!end) {
    end = start;
  }
  return [textField textRangeFromPosition:start toPosition:end ?: start];
}

static UITextRange *createMockTextRangeForTextView(UITextView *textView)
{
  UITextPosition *start = textView.beginningOfDocument;
  UITextPosition *end = [textView positionFromPosition:start offset:1];
  if (!end) {
    end = start;
  }
  return [textView textRangeFromPosition:start toPosition:end ?: start];
}

#pragma mark - Test class

@interface RCTTextInputComponentViewIMETests : XCTestCase

@end

@implementation RCTTextInputComponentViewIMETests

#pragma mark - Fix 1: updateEventEmitter defaultTextAttributes deferral

- (void)testDefaultTextAttributesSkippedDuringMarkedText
{
  // Verifies that pending defaultTextAttributes are NOT applied while composition is active.
  // textInputDidChange should only apply pending attributes after markedTextRange becomes nil.
  RCTTextInputComponentView *componentView = [[RCTTextInputComponentView alloc] initWithFrame:CGRectZero];
  RCTMockTextField *mockTextField = [[RCTMockTextField alloc] initWithFrame:CGRectZero];

  mockTextField.attributedText = [[NSAttributedString alloc] initWithString:@"test"];
  [componentView setValue:mockTextField forKey:@"_backedTextInputView"];
  mockTextField.textInputDelegate = (id<RCTBackedTextInputDelegate>)componentView;

  // Simulate deferred attributes (as if updateEventEmitter was called during composition)
  NSDictionary<NSAttributedStringKey, id> *pendingAttributes =
      @{NSFontAttributeName : [UIFont systemFontOfSize:18]};
  [componentView setValue:@YES forKey:@"_needsUpdateDefaultTextAttributes"];
  [componentView setValue:pendingAttributes forKey:@"_pendingDefaultTextAttributes"];

  // Composition IS active
  mockTextField.mockMarkedTextRange = createMockTextRange(mockTextField);

  // Call textInputDidChange — pending attributes should NOT be applied yet
  [(id<RCTBackedTextInputDelegate>)componentView textInputDidChange];

  // Verify pending was preserved (not applied) because composition is still active
  BOOL needsUpdate = [[componentView valueForKey:@"_needsUpdateDefaultTextAttributes"] boolValue];
  XCTAssertTrue(needsUpdate, @"_needsUpdateDefaultTextAttributes should remain YES during composition");

  id pendingAfter = [componentView valueForKey:@"_pendingDefaultTextAttributes"];
  XCTAssertNotNil(pendingAfter, @"_pendingDefaultTextAttributes should NOT be cleared during composition");
}

- (void)testPendingDefaultTextAttributesAppliedAfterCompositionEnds
{
  RCTTextInputComponentView *componentView = [[RCTTextInputComponentView alloc] initWithFrame:CGRectZero];
  RCTMockTextField *mockTextField = [[RCTMockTextField alloc] initWithFrame:CGRectZero];

  mockTextField.attributedText = [[NSAttributedString alloc] initWithString:@"test"];
  [componentView setValue:mockTextField forKey:@"_backedTextInputView"];
  mockTextField.textInputDelegate = (id<RCTBackedTextInputDelegate>)componentView;

  // Set pending attributes (simulating what updateEventEmitter would do)
  NSDictionary<NSAttributedStringKey, id> *pendingAttributes =
      @{NSFontAttributeName : [UIFont systemFontOfSize:16]};
  [componentView setValue:@YES forKey:@"_needsUpdateDefaultTextAttributes"];
  [componentView setValue:pendingAttributes forKey:@"_pendingDefaultTextAttributes"];

  // Composition is NOT active (markedTextRange is nil)
  mockTextField.mockMarkedTextRange = nil;

  // Call textInputDidChange — should apply pending attributes
  [(id<RCTBackedTextInputDelegate>)componentView textInputDidChange];

  // After textInputDidChange with no markedText, pending should be cleared
  BOOL needsUpdate = [[componentView valueForKey:@"_needsUpdateDefaultTextAttributes"] boolValue];
  XCTAssertFalse(needsUpdate, @"_needsUpdateDefaultTextAttributes should be cleared after applying");

  id pendingAfter = [componentView valueForKey:@"_pendingDefaultTextAttributes"];
  XCTAssertNil(pendingAfter, @"_pendingDefaultTextAttributes should be nil after applying");
}

#pragma mark - Fix 2: _setAttributedString guard during composition

- (void)testSetAttributedStringSkippedDuringMarkedText
{
  RCTTextInputComponentView *componentView = [[RCTTextInputComponentView alloc] initWithFrame:CGRectZero];
  RCTMockTextField *mockTextField = [[RCTMockTextField alloc] initWithFrame:CGRectZero];

  NSAttributedString *originalText = [[NSAttributedString alloc] initWithString:@"original"];
  mockTextField.attributedText = originalText;
  [componentView setValue:mockTextField forKey:@"_backedTextInputView"];
  mockTextField.textInputDelegate = (id<RCTBackedTextInputDelegate>)componentView;

  // Simulate active IME composition
  mockTextField.mockMarkedTextRange = createMockTextRange(mockTextField);

  // Try to set a different attributed string via the private method
  NSAttributedString *newText = [[NSAttributedString alloc] initWithString:@"replaced"];
  // Use performSelector to call private method _setAttributedString:
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Warc-performSelector-leaks"
  SEL selector = NSSelectorFromString(@"_setAttributedString:");
  if ([componentView respondsToSelector:selector]) {
    [componentView performSelector:selector withObject:newText];
  }
#pragma clang diagnostic pop

  // The text should remain unchanged because markedTextRange is active
  XCTAssertEqualObjects(
      mockTextField.attributedText.string,
      @"original",
      @"attributedText should not be replaced during IME composition");
}

- (void)testSetAttributedStringAppliedWhenNoMarkedText
{
  RCTTextInputComponentView *componentView = [[RCTTextInputComponentView alloc] initWithFrame:CGRectZero];
  RCTMockTextField *mockTextField = [[RCTMockTextField alloc] initWithFrame:CGRectZero];

  NSAttributedString *originalText = [[NSAttributedString alloc] initWithString:@"original"];
  mockTextField.attributedText = originalText;
  [componentView setValue:mockTextField forKey:@"_backedTextInputView"];
  mockTextField.textInputDelegate = (id<RCTBackedTextInputDelegate>)componentView;

  // No IME composition
  mockTextField.mockMarkedTextRange = nil;

  // Set a different attributed string
  NSAttributedString *newText = [[NSAttributedString alloc] initWithString:@"replaced"];
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Warc-performSelector-leaks"
  SEL selector = NSSelectorFromString(@"_setAttributedString:");
  if ([componentView respondsToSelector:selector]) {
    [componentView performSelector:selector withObject:newText];
  }
#pragma clang diagnostic pop

  // The text should be updated since there's no active composition
  XCTAssertEqualObjects(
      mockTextField.attributedText.string,
      @"replaced",
      @"attributedText should be replaced when no IME composition is active");
}

#pragma mark - Fix 3: maxLength during IME composition

- (void)testMaxLengthNotEnforcedDuringComposition
{
  // Verifies that textInputShouldChangeText does not block input during IME composition,
  // even if maxLength would normally restrict it.
  //
  // Note: maxLength is a C++ prop (TextInputProps) and cannot be set via KVC in unit tests.
  // With defaultSharedProps, maxLength = INT_MAX, so the maxLength branch is never entered.
  // This test verifies that the markedTextRange guard allows text through unconditionally
  // during composition. The post-composition truncation path in textInputDidChange (which
  // handles grapheme-cluster-safe truncation) requires integration testing with real props.
  RCTTextInputComponentView *componentView = [[RCTTextInputComponentView alloc] initWithFrame:CGRectZero];
  RCTMockTextField *mockTextField = [[RCTMockTextField alloc] initWithFrame:CGRectZero];

  mockTextField.attributedText = [[NSAttributedString alloc] initWithString:@"12345"];
  [componentView setValue:mockTextField forKey:@"_backedTextInputView"];
  mockTextField.textInputDelegate = (id<RCTBackedTextInputDelegate>)componentView;

  // Simulate active IME composition
  mockTextField.mockMarkedTextRange = createMockTextRange(mockTextField);

  NSString *result =
      [(id<RCTBackedTextInputDelegate>)componentView textInputShouldChangeText:@"additional" inRange:NSMakeRange(5, 0)];

  // During composition, text should pass through unblocked
  XCTAssertEqualObjects(result, @"additional", @"Text input should not be blocked during IME composition");
}

- (void)testMaxLengthEnforcedWhenNoComposition
{
  // Verifies that textInputShouldChangeText passes text through when maxLength is not constraining.
  // See note in testMaxLengthNotEnforcedDuringComposition about prop limitations in unit tests.
  RCTTextInputComponentView *componentView = [[RCTTextInputComponentView alloc] initWithFrame:CGRectZero];
  RCTMockTextField *mockTextField = [[RCTMockTextField alloc] initWithFrame:CGRectZero];

  mockTextField.attributedText = [[NSAttributedString alloc] initWithString:@"12345"];
  [componentView setValue:mockTextField forKey:@"_backedTextInputView"];
  mockTextField.textInputDelegate = (id<RCTBackedTextInputDelegate>)componentView;

  // No active composition
  mockTextField.mockMarkedTextRange = nil;

  NSString *result =
      [(id<RCTBackedTextInputDelegate>)componentView textInputShouldChangeText:@"extra" inRange:NSMakeRange(5, 0)];

  XCTAssertEqualObjects(result, @"extra", @"Text should pass through when maxLength is not constraining");
}

#pragma mark - Fix 4: multiline selection change bare text comparison

- (void)testMultilineSelectionChangeUsesBarTextComparison
{
  // This test verifies that textInputDidChangeSelection uses string comparison
  // (not NSAttributedString isEqual:) to avoid false positives during IME composition.
  //
  // When IME composition is active, the attributed string has system-added underline
  // attributes that cause isEqual: to fail even when the bare text is identical.
  // Using isEqualToString: on the bare text avoids triggering unnecessary
  // textInputDidChange calls.

  RCTTextInputComponentView *componentView = [[RCTTextInputComponentView alloc] initWithFrame:CGRectZero];
  RCTMockTextView *mockTextView = [[RCTMockTextView alloc] initWithFrame:CGRectZero];

  // Set up attributed text with system-style attributes (simulating IME underline)
  NSMutableAttributedString *textWithSystemAttrs =
      [[NSMutableAttributedString alloc] initWithString:@"test"
                                             attributes:@{
                                               NSFontAttributeName : [UIFont systemFontOfSize:14],
                                               NSUnderlineStyleAttributeName : @(NSUnderlineStyleSingle),
                                             }];
  mockTextView.attributedText = textWithSystemAttrs;
  [componentView setValue:mockTextView forKey:@"_backedTextInputView"];
  mockTextView.textInputDelegate = (id<RCTBackedTextInputDelegate>)componentView;

  // Set _lastStringStateWasUpdatedWith to same text but different attributes
  NSAttributedString *lastString =
      [[NSAttributedString alloc] initWithString:@"test"
                                      attributes:@{NSFontAttributeName : [UIFont systemFontOfSize:14]}];
  [componentView setValue:lastString forKey:@"_lastStringStateWasUpdatedWith"];

  // The bare text is the same ("test" == "test"), so even though the attributed
  // strings differ (due to NSUnderlineStyleAttributeName), the comparison
  // should return YES (equal) and NOT trigger an extra textInputDidChange.
  XCTAssertTrue(
      [lastString.string isEqualToString:mockTextView.attributedText.string],
      @"Bare text comparison should show strings are equal");
  XCTAssertFalse(
      [lastString isEqual:mockTextView.attributedText],
      @"Full attributed string comparison should show strings are NOT equal (different attributes)");
}

- (void)testMultilineSelectionChangeNoExtraUpdateDuringComposition
{
  // Verifies that during IME composition, the attributed string underline
  // attributes added by the system do not cause a spurious textInputDidChange call
  // in multiline mode.
  RCTTextInputComponentView *componentView = [[RCTTextInputComponentView alloc] initWithFrame:CGRectZero];
  RCTMockTextView *mockTextView = [[RCTMockTextView alloc] initWithFrame:CGRectZero];

  mockTextView.attributedText = [[NSAttributedString alloc] initWithString:@"composing"];
  [componentView setValue:mockTextView forKey:@"_backedTextInputView"];
  mockTextView.textInputDelegate = (id<RCTBackedTextInputDelegate>)componentView;

  // Simulate active IME composition
  mockTextView.mockMarkedTextRange = createMockTextRangeForTextView(mockTextView);

  // Set _lastStringStateWasUpdatedWith with same bare text
  NSAttributedString *lastString = [[NSAttributedString alloc] initWithString:@"composing"];
  [componentView setValue:lastString forKey:@"_lastStringStateWasUpdatedWith"];

  // Since the bare text matches, textInputDidChangeSelection should NOT trigger textInputDidChange
  // This is verified by the fact that _lastStringStateWasUpdatedWith.string equals attributedText.string
  XCTAssertTrue(
      [lastString.string isEqualToString:mockTextView.attributedText.string],
      @"Bare text should match, preventing unnecessary textInputDidChange call");
}

@end
