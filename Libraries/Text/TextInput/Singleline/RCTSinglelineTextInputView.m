/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTSinglelineTextInputView.h>

#import <React/RCTBridge.h>

#include <React/RCTUITextField.h>
#if TARGET_OS_OSX // [macOS
#include <React/RCTUISecureTextField.h>
#endif // macOS]

@implementation RCTSinglelineTextInputView {
  RCTUITextField *_backedTextInputView;
  BOOL _useSecureTextField; // [macOS]
}

- (instancetype)initWithBridge:(RCTBridge *)bridge
{
  if (self = [super initWithBridge:bridge]) {
    // `submitBehavior` defaults to `"blurAndSubmit"` for <TextInput multiline={false}> by design.
    self.submitBehavior = @"blurAndSubmit";

    _backedTextInputView = [[RCTUITextField alloc] initWithFrame:self.bounds];
    _backedTextInputView.autoresizingMask = UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight;
#if TARGET_OS_OSX // [macOS
    _backedTextInputView.cell.scrollable = YES;
    _backedTextInputView.cell.usesSingleLineMode = YES;
#endif // macOS]
    _backedTextInputView.textInputDelegate = self;

    [self addSubview:_backedTextInputView];
  }

  return self;
}

- (id<RCTBackedTextInputViewProtocol>)backedTextInputView
{
  return _backedTextInputView;
}

#if TARGET_OS_OSX // [macOS
- (void)setReactPaddingInsets:(UIEdgeInsets)reactPaddingInsets
{
  [super setReactPaddingInsets:reactPaddingInsets];
  // We apply `paddingInsets` as `backedTextInputView`'s `textContainerInsets` on mac.
  ((RCTUITextField*)self.backedTextInputView).textContainerInset = reactPaddingInsets;
  [self setNeedsLayout];
}

- (void)setReactBorderInsets:(UIEdgeInsets)reactBorderInsets
{
  [super setReactBorderInsets:reactBorderInsets];
  // We apply `borderInsets` as `backedTextInputView`'s layout offset on mac.
  ((RCTUITextField*)self.backedTextInputView).frame = UIEdgeInsetsInsetRect(self.bounds, reactBorderInsets);
  [self setNeedsLayout];
}

- (void)setUseSecureTextField:(BOOL)useSecureTextField {
  if (_useSecureTextField != useSecureTextField) {
    _useSecureTextField = useSecureTextField;
    RCTUITextField *previousTextField = _backedTextInputView;
    if (useSecureTextField) {
      _backedTextInputView = [[RCTUISecureTextField alloc] initWithFrame:self.bounds];
    } else {
      _backedTextInputView = [[RCTUITextField alloc] initWithFrame:self.bounds];
    }
    _backedTextInputView.accessibilityElement = previousTextField.accessibilityElement;
    _backedTextInputView.accessibilityHelp = previousTextField.accessibilityHelp;
    _backedTextInputView.accessibilityIdentifier = previousTextField.accessibilityIdentifier;
    _backedTextInputView.accessibilityLabel = previousTextField.accessibilityLabel;
    _backedTextInputView.accessibilityRole = previousTextField.accessibilityRole;
    _backedTextInputView.caretHidden = previousTextField.caretHidden;
    _backedTextInputView.contextMenuHidden = previousTextField.contextMenuHidden;
    _backedTextInputView.defaultTextAttributes = previousTextField.defaultTextAttributes;
    _backedTextInputView.editable = previousTextField.editable;
    _backedTextInputView.placeholder = previousTextField.placeholder;
    _backedTextInputView.placeholderColor = previousTextField.placeholderColor;
    _backedTextInputView.selectionColor = previousTextField.selectionColor;
    _backedTextInputView.textAlignment = previousTextField.textAlignment;
    _backedTextInputView.textContainerInset = previousTextField.textContainerInset;
    _backedTextInputView.autoresizingMask = UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight;
    _backedTextInputView.textInputDelegate = self;
    _backedTextInputView.text = previousTextField.text;
    [self replaceSubview:previousTextField with:_backedTextInputView];
  }
}

- (void)setEnableFocusRing:(BOOL)enableFocusRing {
  [super setEnableFocusRing:enableFocusRing];
  if ([_backedTextInputView respondsToSelector:@selector(setEnableFocusRing:)]) {
    [_backedTextInputView setEnableFocusRing:enableFocusRing];
  }
}
#endif // macOS]

@end
