/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTBackedTextInputDelegate.h>
#import <React/RCTBackedTextInputViewProtocol.h>
#import <React/RCTTextInputComponentView.h>
#import <React/RCTTextInputUtils.h>
#import <React/RCTUITextField.h>
#import <React/RCTUITextView.h>
#import <XCTest/XCTest.h>
#import <react/renderer/components/iostextinput/TextInputShadowNode.h>
#import <react/renderer/textlayoutmanager/RCTAttributedTextUtils.h>

#if TARGET_OS_IOS

using namespace facebook::react;

@interface RCTTextInputComponentView (Tests)
- (void)_setAttributedStringFromJS:(NSAttributedString *)attributedString;
- (void)textInputDidChange;
- (void)textInputDidChangeSelection;
- (void)setTextAndSelection:(NSInteger)eventCount
                      value:(NSString *__nullable)value
                      start:(NSInteger)start
                        end:(NSInteger)end;
@end

// Types `text` at the selection one key (composed character sequence) at a time, as UIKit does: asks the delegate
// (-textInputShouldChangeText:inRange:, which sends onKeyPress and applies maxLength), puts the text it allows in
// place of the selection with the typing attributes, moves the caret after it and reports the change. A "\b" key is
// a backspace: it deletes the selection, or the character before the caret.
static void
RCTTestTypeKeys(UIView<RCTBackedTextInputViewProtocol> *input, NSString *text, void (^setText)(NSAttributedString *))
{
  [text enumerateSubstringsInRange:NSMakeRange(0, text.length)
                           options:NSStringEnumerationByComposedCharacterSequences
                        usingBlock:^(NSString *key, NSRange, NSRange, BOOL *) {
                          UITextRange *selection = input.selectedTextRange;
                          NSInteger start = [input offsetFromPosition:input.beginningOfDocument
                                                           toPosition:selection.start];
                          NSInteger end = [input offsetFromPosition:input.beginningOfDocument toPosition:selection.end];
                          NSRange range = NSMakeRange(start, end - start);
                          if ([key isEqualToString:@"\b"]) {
                            if (range.length == 0) {
                              if (start == 0) {
                                return;
                              }
                              range = [input.attributedText.string rangeOfComposedCharacterSequenceAtIndex:start - 1];
                            }
                            key = @"";
                          }
                          NSString *allowed = [input.textInputDelegate textInputShouldChangeText:key inRange:range];
                          if (allowed == nil) {
                            return;
                          }
                          NSMutableAttributedString *typed = [input.attributedText mutableCopy];
                          [typed replaceCharactersInRange:range
                                     withAttributedString:[[NSAttributedString alloc]
                                                              initWithString:allowed
                                                                  attributes:input.typingAttributes]];
                          setText(typed);
                          UITextPosition *caret = [input positionFromPosition:input.beginningOfDocument
                                                                       offset:range.location + allowed.length];
                          [input setSelectedTextRange:[input textRangeFromPosition:caret toPosition:caret]
                                       notifyDelegate:NO];
                          [input.textInputDelegate textInputDidChange];
                        }];
}

// IME composition, as UIKit does for a composition key: asks the delegate, shows `markedText` in place of the
// selection, marked, and reports the change.
static void RCTTestSetMarkedText(UIView<RCTBackedTextInputViewProtocol> *input, NSString *markedText)
{
  UITextRange *selection = input.markedTextRange ?: input.selectedTextRange;
  NSInteger start = [input offsetFromPosition:input.beginningOfDocument toPosition:selection.start];
  NSInteger end = [input offsetFromPosition:input.beginningOfDocument toPosition:selection.end];
  if ([input.textInputDelegate textInputShouldChangeText:markedText inRange:NSMakeRange(start, end - start)] == nil) {
    return;
  }
  [input setMarkedText:markedText selectedRange:NSMakeRange(markedText.length, 0)];
  [input.textInputDelegate textInputDidChange];
}

// Like UIKit, delivers the keys (or a composition) queued behind -setAttributedText: inside it: before the new text is
// assigned (a text field), or after (a text view can).
static void RCTTestSetAttributedText(
    UIView<RCTBackedTextInputViewProtocol> *input,
    NSAttributedString *attributedText,
    NSString *keys,
    NSString *markedText,
    BOOL keysArriveAfterAssignment,
    void (^setText)(NSAttributedString *))
{
  if (!keysArriveAfterAssignment) {
    if (keys != nil) {
      RCTTestTypeKeys(input, keys, setText);
    }
    if (markedText != nil) {
      RCTTestSetMarkedText(input, markedText);
    }
  }
  setText(attributedText);
  if (keysArriveAfterAssignment) {
    if (keys != nil) {
      RCTTestTypeKeys(input, keys, setText);
    }
    if (markedText != nil) {
      RCTTestSetMarkedText(input, markedText);
    }
  }
}

@protocol RCTTestKeysDuringWrite <RCTBackedTextInputViewProtocol>
@property (nonatomic, copy, nullable) NSString *keysDuringNextWrite;
@property (nonatomic, copy, nullable) NSString *markedTextDuringNextWrite;
// Keys UIKit delivers inside -replaceRange:withText:, before the edit applies.
@property (nonatomic, copy, nullable) NSString *keysDuringNextReplace;
@property (nonatomic, assign) BOOL keysArriveAfterAssignment;
@property (nonatomic, assign) NSUInteger writeCount;
@end

@interface RCTKeysDuringWriteTextField : RCTUITextField <RCTTestKeysDuringWrite>
@end

@implementation RCTKeysDuringWriteTextField

@synthesize keysDuringNextWrite = _keysDuringNextWrite;
@synthesize markedTextDuringNextWrite = _markedTextDuringNextWrite;
@synthesize keysDuringNextReplace = _keysDuringNextReplace;
@synthesize keysArriveAfterAssignment = _keysArriveAfterAssignment;
@synthesize writeCount = _writeCount;

- (void)setAttributedText:(NSAttributedString *)attributedText
{
  NSString *keys = self.keysDuringNextWrite;
  NSString *markedText = self.markedTextDuringNextWrite;
  self.keysDuringNextWrite = nil;
  self.markedTextDuringNextWrite = nil;
  self.writeCount++;
  RCTTestSetAttributedText(
      self, attributedText, keys, markedText, self.keysArriveAfterAssignment, ^(NSAttributedString *text) {
        [super setAttributedText:text];
      });
}

- (void)replaceRange:(UITextRange *)range withText:(NSString *)text
{
  NSString *keys = self.keysDuringNextReplace;
  self.keysDuringNextReplace = nil;
  if (keys != nil) {
    RCTTestTypeKeys(self, keys, ^(NSAttributedString *typed) {
      [super setAttributedText:typed];
    });
  }
  [super replaceRange:range withText:text];
}
@end

@interface RCTKeysDuringWriteTextView : RCTUITextView <RCTTestKeysDuringWrite>
@end

@implementation RCTKeysDuringWriteTextView

@synthesize keysDuringNextWrite = _keysDuringNextWrite;
@synthesize markedTextDuringNextWrite = _markedTextDuringNextWrite;
@synthesize keysDuringNextReplace = _keysDuringNextReplace;
@synthesize keysArriveAfterAssignment = _keysArriveAfterAssignment;
@synthesize writeCount = _writeCount;

- (void)setAttributedText:(NSAttributedString *)attributedText
{
  NSString *keys = self.keysDuringNextWrite;
  NSString *markedText = self.markedTextDuringNextWrite;
  self.keysDuringNextWrite = nil;
  self.markedTextDuringNextWrite = nil;
  self.writeCount++;
  RCTTestSetAttributedText(
      self, attributedText, keys, markedText, self.keysArriveAfterAssignment, ^(NSAttributedString *text) {
        [super setAttributedText:text];
      });
}

- (void)replaceRange:(UITextRange *)range withText:(NSString *)text
{
  NSString *keys = self.keysDuringNextReplace;
  self.keysDuringNextReplace = nil;
  if (keys != nil) {
    RCTTestTypeKeys(self, keys, ^(NSAttributedString *typed) {
      [super setAttributedText:typed];
    });
  }
  [super replaceRange:range withText:text];
}
@end

// The paragraph style UIKit gives text typed into a text field whose text attributes set none.
static NSParagraphStyle *RCTTestUIKitParagraphStyle(void)
{
  NSMutableParagraphStyle *style = [NSParagraphStyle.defaultParagraphStyle mutableCopy];
  style.lineBreakMode = NSLineBreakByTruncatingTail;
  style.baseWritingDirection = NSWritingDirectionLeftToRight;
  return style;
}

static NSAttributedString *RCTTestStyled(NSString *text, UIColor *color)
{
  return [[NSAttributedString alloc] initWithString:text
                                         attributes:@{
                                           NSFontAttributeName : [UIFont boldSystemFontOfSize:16],
                                           NSForegroundColorAttributeName : color,
                                         }];
}

// Records what the view reports to JS outside writes from JS: "change" (onChange) and "selection"
// (onSelectionChange).
@interface RCTTestTextInputComponentView : RCTTextInputComponentView
@property (nonatomic, strong) NSMutableArray<NSString *> *reports;
@end

@implementation RCTTestTextInputComponentView

- (void)textInputDidChange
{
  if (![[self valueForKey:@"_comingFromJS"] boolValue]) {
    [self.reports addObject:@"change"];
  }
  [super textInputDidChange];
}

- (void)textInputDidChangeSelection
{
  if (![[self valueForKey:@"_comingFromJS"] boolValue]) {
    [self.reports addObject:@"selection"];
  }
  [super textInputDidChangeSelection];
}

@end

@interface RCTTextInputComponentViewTests : XCTestCase
@end

@implementation RCTTextInputComponentViewTests {
  UIWindow *_window;
  RCTTextInputComponentView *_view;
  UIView<RCTTestKeysDuringWrite> *_input;
  State::Shared _state;
}

- (void)tearDown
{
  [_input resignFirstResponder];
  _window.hidden = YES;
  _window = nil;
  _view = nil;
  _input = nil;
  _state = nullptr;
  [super tearDown];
}

// A focused TextInput whose backed text input delivers keys during writes, with an empty state from JS.
- (void)makeInputMultiline:(BOOL)multiline maxLength:(int)maxLength
{
  _window = [[UIWindow alloc] initWithFrame:CGRectMake(0, 0, 320, 480)];
  _view = [[RCTTestTextInputComponentView alloc] initWithFrame:CGRectMake(0, 0, 300, 80)];
  auto props = std::make_shared<TextInputProps>();
  props->multiline = multiline;
  if (maxLength > 0) {
    props->maxLength = maxLength;
  }
  [_view updateProps:props oldProps:nullptr];

  UIView<RCTBackedTextInputViewProtocol> *original = [_view valueForKey:@"_backedTextInputView"];
  _input = multiline ? [[RCTKeysDuringWriteTextView alloc] initWithFrame:original.frame]
                     : [[RCTKeysDuringWriteTextField alloc] initWithFrame:original.frame];
  RCTCopyBackedTextInput(original, _input);
  _input.textInputDelegate = (id<RCTBackedTextInputDelegate>)_view;
  [original removeFromSuperview];
  [_view setValue:_input forKey:@"_backedTextInputView"];
  [_view addSubview:_input];

  [_window addSubview:_view];
  [_window makeKeyAndVisible];
  [self sendStateFromJS:[NSAttributedString new]];
  [_input becomeFirstResponder];
  _input.writeCount = 0;
}

- (void)typeKeys:(NSString *)keys
{
  UIView<RCTTestKeysDuringWrite> *input = _input;
  NSUInteger writes = input.writeCount;
  RCTTestTypeKeys(input, keys, ^(NSAttributedString *text) {
    input.attributedText = text;
  });
  input.writeCount = writes;
}

// Sets the input's text without telling anyone, as UIKit adjusts the attributes of the text it shows.
- (void)setTextQuietly:(NSAttributedString *)text
{
  NSUInteger writes = _input.writeCount;
  _input.attributedText = text;
  _input.writeCount = writes;
}

// Commits a state as Fabric does: the text JS holds, with the view's current event count.
- (void)sendStateFromJS:(NSAttributedString *)text
{
  NSNumber *eventCount = [_view valueForKey:@"_mostRecentEventCount"];
  auto data = TextInputState{};
  data.attributedStringBox = RCTAttributedStringBoxFromNSAttributedString(text);
  data.mostRecentEventCount = eventCount.longLongValue;
  State::Shared state = std::make_shared<const TextInputShadowNode::ConcreteState>(
      std::make_shared<const TextInputState>(std::move(data)), ShadowNodeFamily::Weak{});
  [_view updateState:state oldState:_state];
  _state = state;
}

// Keys queued while a state is committed arrive inside the write if there is one, or after it.
- (void)sendStateFromJS:(NSAttributedString *)text whileTyping:(NSString *)keys
{
  _input.keysDuringNextWrite = keys;
  [self sendStateFromJS:text];
  if (_input.keysDuringNextWrite != nil) {
    _input.keysDuringNextWrite = nil;
    [self typeKeys:keys];
  }
}

- (NSAttributedString *)textWithDefaultAttributes:(NSString *)text
{
  NSMutableDictionary<NSAttributedStringKey, id> *attributes = [_input.defaultTextAttributes mutableCopy];
  [attributes removeObjectForKey:RCTAttributedStringEventEmitterKey];
  return [[NSAttributedString alloc] initWithString:text attributes:attributes];
}

- (NSAttributedString *)textWithDefaultAttributes:(NSString *)text paragraphStyle:(NSParagraphStyle *)paragraphStyle
{
  NSMutableAttributedString *styled = [[self textWithDefaultAttributes:text] mutableCopy];
  [styled addAttribute:NSParagraphStyleAttributeName value:paragraphStyle range:NSMakeRange(0, styled.length)];
  return styled;
}

#pragma mark - States that change nothing the field shows

- (void)testControlledValueEqualToTheTypedTextIsNotWrittenWhileKeysArrive
{
  // A controlled `value` equal to what was typed: the state is built from props, without the paragraph style and the
  // event emitter UIKit gave the typed text.
  [self makeInputMultiline:NO maxLength:0];
  [self typeKeys:@"p"];
  NSMutableAttributedString *shown = [_input.attributedText mutableCopy];
  [shown addAttribute:NSParagraphStyleAttributeName value:RCTTestUIKitParagraphStyle() range:NSMakeRange(0, 1)];
  [self setTextQuietly:shown];

  [self sendStateFromJS:[self textWithDefaultAttributes:@"p"] whileTyping:@"ri"];

  XCTAssertEqualObjects(_input.attributedText.string, @"pri");
  XCTAssertEqual(_input.writeCount, 0u);
}

- (void)testFirstCharacterWithTheInputsDefaultAttributesIsNotWrittenWhileKeysArrive
{
  // UIKit gives the first character typed into an empty field the field's default attributes (here a background
  // color) after it reached JS; the state, built from props, does not have them.
  [self makeInputMultiline:NO maxLength:0];
  NSMutableDictionary<NSAttributedStringKey, id> *defaults = [_input.defaultTextAttributes mutableCopy];
  defaults[NSFontAttributeName] = [UIFont systemFontOfSize:20];
  NSAttributedString *state = [[NSAttributedString alloc] initWithString:@"/" attributes:defaults];
  defaults[NSBackgroundColorAttributeName] = UIColor.clearColor;
  _input.defaultTextAttributes = defaults;
  [self typeKeys:@"/"];
  NSMutableDictionary<NSAttributedStringKey, id> *shown = [defaults mutableCopy];
  shown[NSParagraphStyleAttributeName] = RCTTestUIKitParagraphStyle();
  [self setTextQuietly:[[NSAttributedString alloc] initWithString:@"/" attributes:shown]];

  [self sendStateFromJS:state whileTyping:@"pr"];

  XCTAssertEqualObjects(_input.attributedText.string, @"/pr");
  XCTAssertEqual(_input.writeCount, 0u);
}

- (void)testSingleLineStateWithALineHeightIsNotWrittenWhileKeysArrive
{
  // `lineHeight` on a single-line input: a text field shows the text without the line height, with its own writing
  // direction and line break mode.
  [self makeInputMultiline:NO maxLength:0];
  NSMutableParagraphStyle *stateStyle = [NSMutableParagraphStyle new];
  stateStyle.minimumLineHeight = 26;
  stateStyle.maximumLineHeight = 26;
  NSMutableParagraphStyle *shownStyle = [RCTTestUIKitParagraphStyle() mutableCopy];
  [self typeKeys:@"p"];
  [self setTextQuietly:[self textWithDefaultAttributes:@"p" paragraphStyle:shownStyle]];

  [self sendStateFromJS:[self textWithDefaultAttributes:@"p" paragraphStyle:stateStyle] whileTyping:@"ri"];

  XCTAssertEqualObjects(_input.attributedText.string, @"pri");
  XCTAssertEqual(_input.writeCount, 0u);
}

- (void)testStateWithoutAParagraphStyleIsNotWrittenOverUIKitsInitialTypingParagraphStyle
{
  // After a write (a nested <Text> restyle), UIKit can show typed text with the paragraph style of its initial typing
  // attributes (another line break strategy than the default one). A state without a paragraph style is the same text.
  [self makeInputMultiline:NO maxLength:0];
  NSParagraphStyle *typingStyle =
      [[_view valueForKey:@"_originalTypingAttributes"] objectForKey:NSParagraphStyleAttributeName];
  XCTAssertNotNil(typingStyle);
  [self typeKeys:@"p"];
  NSMutableAttributedString *shown = [RCTTestStyled(@"p", UIColor.blueColor) mutableCopy];
  [shown addAttribute:NSParagraphStyleAttributeName value:typingStyle range:NSMakeRange(0, 1)];
  [self setTextQuietly:shown];

  [self sendStateFromJS:RCTTestStyled(@"p", UIColor.blueColor) whileTyping:@"ri"];

  XCTAssertEqualObjects(_input.attributedText.string, @"pri");
  XCTAssertEqual(_input.writeCount, 0u);
}

#pragma mark - States that change what the field shows

- (void)testMultilineStateWithAnotherLineHeightIsWritten
{
  [self makeInputMultiline:YES maxLength:0];
  NSMutableParagraphStyle *style = [NSMutableParagraphStyle new];
  style.minimumLineHeight = 26;
  style.maximumLineHeight = 26;
  [self setTextQuietly:[self textWithDefaultAttributes:@"abc" paragraphStyle:style]];
  NSMutableParagraphStyle *taller = [style mutableCopy];
  taller.minimumLineHeight = 30;
  taller.maximumLineHeight = 30;

  [self sendStateFromJS:[self textWithDefaultAttributes:@"abc" paragraphStyle:taller]];

  NSParagraphStyle *shown = [_input.attributedText attribute:NSParagraphStyleAttributeName
                                                     atIndex:0
                                              effectiveRange:NULL];
  XCTAssertEqual(shown.minimumLineHeight, 30);
}

- (void)testMultilineStateWithAnotherLineBreakModeIsWritten
{
  // `lineBreakModeIOS` changed by JS: a text view's -setDefaultTextAttributes: only sets the typing attributes, so the
  // text it shows gets the new mode from the state.
  [self makeInputMultiline:YES maxLength:0];
  NSMutableParagraphStyle *wordWrapping = [NSMutableParagraphStyle new];
  wordWrapping.lineBreakMode = NSLineBreakByWordWrapping;
  NSMutableParagraphStyle *charWrapping = [NSMutableParagraphStyle new];
  charWrapping.lineBreakMode = NSLineBreakByCharWrapping;
  [self setTextQuietly:[self textWithDefaultAttributes:@"abc def" paragraphStyle:wordWrapping]];

  [self sendStateFromJS:[self textWithDefaultAttributes:@"abc def" paragraphStyle:charWrapping]];

  NSParagraphStyle *shown = [_input.attributedText attribute:NSParagraphStyleAttributeName
                                                     atIndex:0
                                              effectiveRange:NULL];
  XCTAssertEqual(shown.lineBreakMode, NSLineBreakByCharWrapping);
}

- (void)testStateThatRestylesTheTextIsWritten
{
  [self makeInputMultiline:NO maxLength:0];
  [self typeKeys:@"abc"];
  NSMutableAttributedString *restyled = [[self textWithDefaultAttributes:@"abc"] mutableCopy];
  [restyled addAttribute:NSForegroundColorAttributeName value:UIColor.redColor range:NSMakeRange(0, 3)];

  [self sendStateFromJS:restyled];

  XCTAssertEqualObjects(
      [_input.attributedText attribute:NSForegroundColorAttributeName atIndex:0 effectiveRange:NULL], UIColor.redColor);
}

- (void)testStateWithOtherTextIsWritten
{
  [self makeInputMultiline:NO maxLength:0];
  [self typeKeys:@"abc"];

  [self sendStateFromJS:[self textWithDefaultAttributes:@"ABC"]];

  XCTAssertEqualObjects(_input.attributedText.string, @"ABC");
}

#pragma mark - Keys typed while JS's text is written (they are put back)

- (void)setTextAndSelectionFromJS:(NSString *)value start:(NSInteger)start end:(NSInteger)end
{
  NSNumber *eventCount = [_view valueForKey:@"_mostRecentEventCount"];
  [_view setTextAndSelection:eventCount.integerValue value:value start:start end:end];
}

- (NSMutableArray<NSString *> *)reports
{
  RCTTestTextInputComponentView *view = (RCTTestTextInputComponentView *)_view;
  view.reports = view.reports ?: [NSMutableArray new];
  return view.reports;
}

- (NSInteger)caret
{
  return [_input offsetFromPosition:_input.beginningOfDocument toPosition:_input.selectedTextRange.start];
}

- (void)selectFrom:(NSInteger)start length:(NSInteger)length
{
  UITextPosition *from = [_input positionFromPosition:_input.beginningOfDocument offset:start];
  UITextPosition *to = [_input positionFromPosition:_input.beginningOfDocument offset:start + length];
  [_input setSelectedTextRange:[_input textRangeFromPosition:from toPosition:to] notifyDelegate:NO];
}

- (void)moveCaretTo:(NSInteger)offset
{
  UITextPosition *position = [_input positionFromPosition:_input.beginningOfDocument offset:offset];
  [_input setSelectedTextRange:[_input textRangeFromPosition:position toPosition:position] notifyDelegate:NO];
}

- (void)testKeysTypedWhileJSRestylesTheTextAreKept
{
  // A nested <Text> styles the first character: JS writes "p" with the child's attributes, and "ri" arrive meanwhile.
  [self makeInputMultiline:NO maxLength:0];
  [self typeKeys:@"p"];
  [self.reports removeAllObjects];

  [self sendStateFromJS:RCTTestStyled(@"p", UIColor.blueColor) whileTyping:@"ri"];

  XCTAssertEqualObjects(_input.attributedText.string, @"pri");
  // JS hears about the keys (onChange) and then the caret they moved (onSelectionChange).
  XCTAssertEqualObjects(self.reports, (@[ @"change", @"selection" ]));
  // JS's style was applied, and the restored keys take it too.
  XCTAssertEqualObjects(
      [_input.attributedText attribute:NSForegroundColorAttributeName atIndex:0 effectiveRange:NULL],
      UIColor.blueColor);
  XCTAssertEqualObjects(
      [_input.attributedText attribute:NSForegroundColorAttributeName atIndex:2 effectiveRange:NULL],
      UIColor.blueColor);
  XCTAssertEqual(self.caret, 3);
}

- (void)testKeysTypedWhileJSTransformsTheTextAreKept
{
  // onChangeText upper-cases: JS writes "ABC" while "d" arrives.
  [self makeInputMultiline:NO maxLength:0];
  [self typeKeys:@"abc"];

  [self sendStateFromJS:[self textWithDefaultAttributes:@"ABC"] whileTyping:@"d"];

  XCTAssertEqualObjects(_input.attributedText.string, @"ABCd");
}

- (void)testKeysTypedInAMultilineInputWhileJSTransformsTheTextAreKept
{
  [self makeInputMultiline:YES maxLength:0];
  [self typeKeys:@"abc"];
  [self.reports removeAllObjects];

  [self sendStateFromJS:[self textWithDefaultAttributes:@"ABC"] whileTyping:@"d"];

  XCTAssertEqualObjects(_input.attributedText.string, @"ABCd");
  XCTAssertEqualObjects(self.reports, (@[ @"change", @"selection" ]));
  XCTAssertEqual(self.caret, 4);
}

- (void)testKeysThatArriveAfterTheWriteAreNotDuplicated
{
  [self makeInputMultiline:NO maxLength:0];
  [self typeKeys:@"#a Hello"];
  [self moveCaretTo:2];
  _input.keysArriveAfterAssignment = YES;
  [self.reports removeAllObjects];

  [self sendStateFromJS:RCTTestStyled(@"#a Hello", UIColor.blueColor) whileTyping:@"b"];

  XCTAssertEqualObjects(self.reports, (@[ @"change", @"selection" ]));
  NSString *text = _input.attributedText.string;
  XCTAssertEqual([text componentsSeparatedByString:@"b"].count, 2u, @"%@", text);
  XCTAssertEqual(text.length, 9u, @"%@", text);
  // The caret is after the key, where the next key goes (the write had put it back before the key).
  XCTAssertEqual(self.caret, (NSInteger)NSMaxRange([text rangeOfString:@"b"]));
}

- (void)assertKeyEqualToTheTextJSAppendsIsKeptMultiline:(BOOL)multiline
{
  // JS appends "d" while the user types "d": the field holds what the user typed during the write, which is also
  // the text JS wrote. Both "d"s are kept.
  [self makeInputMultiline:multiline maxLength:0];
  [self typeKeys:@"abc"];

  [self sendStateFromJS:[self textWithDefaultAttributes:@"abcd"] whileTyping:@"d"];

  XCTAssertEqualObjects(_input.attributedText.string, @"abcdd", @"multiline=%d", multiline);
}

- (void)testAKeyEqualToTheTextJSAppendsIsKept
{
  [self assertKeyEqualToTheTextJSAppendsIsKeptMultiline:NO];
}

- (void)testAKeyEqualToTheTextJSAppendsIsKeptInAMultilineInput
{
  [self assertKeyEqualToTheTextJSAppendsIsKeptMultiline:YES];
}

- (void)testAWriteWithNoKeysTypedLeavesJSText
{
  [self makeInputMultiline:NO maxLength:0];
  [self typeKeys:@"abc"];

  [self sendStateFromJS:[self textWithDefaultAttributes:@"ABC"]];

  XCTAssertEqualObjects(_input.attributedText.string, @"ABC");
}

- (void)testKeysTypedWhileAControlledValueIsSetAreKept
{
  // onChangeText strips "/": TextInput sets the controlled value "" with setTextAndSelection while "pr" arrive.
  [self makeInputMultiline:NO maxLength:0];
  [self typeKeys:@"/"];
  _input.keysDuringNextWrite = @"pr";

  [self setTextAndSelectionFromJS:@"" start:0 end:0];

  XCTAssertEqualObjects(_input.attributedText.string, @"pr");
  XCTAssertEqual(self.caret, 2);
}

- (void)testAControlledValueSetWithNoKeysTypedLeavesJSText
{
  [self makeInputMultiline:NO maxLength:0];
  [self typeKeys:@"abc"];

  [self setTextAndSelectionFromJS:@"ABC" start:3 end:3];

  XCTAssertEqualObjects(_input.attributedText.string, @"ABC");
}

- (void)testKeysRestoredAfterAControlledValueKeepJSSelection
{
  // JS sets "ABC" and puts the caret at 1; "d" was typed at the end meanwhile.
  [self makeInputMultiline:NO maxLength:0];
  [self typeKeys:@"abc"];
  _input.keysDuringNextWrite = @"d";

  [self setTextAndSelectionFromJS:@"ABC" start:1 end:1];

  XCTAssertEqualObjects(_input.attributedText.string, @"ABCd");
  XCTAssertEqual(self.caret, 1);
}

- (void)testRestoredKeysAreAnEditTheUserCanUndo
{
  [self makeInputMultiline:NO maxLength:0];
  [self typeKeys:@"p"];
  [self sendStateFromJS:RCTTestStyled(@"p", UIColor.blueColor) whileTyping:@"ri"];
  XCTAssertEqualObjects(_input.attributedText.string, @"pri");

  XCTAssertTrue(_input.undoManager.canUndo);
  [_input.undoManager undo];

  XCTAssertEqualObjects(_input.attributedText.string, @"p");
}

#pragma mark - Text JS inserts with no key typed (a text view reports the write itself)

- (void)assertJSInsertionIsNotDuplicatedMultiline:(BOOL)multiline focused:(BOOL)focused viaState:(BOOL)viaState
{
  [self makeInputMultiline:multiline maxLength:0];
  [self typeKeys:@"abc"];
  if (!focused) {
    [_input resignFirstResponder];
  }

  if (viaState) {
    [self sendStateFromJS:[self textWithDefaultAttributes:@"abc def"]];
  } else {
    [self setTextAndSelectionFromJS:@"abc def" start:7 end:7];
  }

  XCTAssertEqualObjects(
      _input.attributedText.string, @"abc def", @"multiline=%d focused=%d viaState=%d", multiline, focused, viaState);
}

- (void)testJSInsertionInAFocusedMultilineInputIsNotDuplicated
{
  [self assertJSInsertionIsNotDuplicatedMultiline:YES focused:YES viaState:NO];
}

- (void)testJSInsertionInAnUnfocusedMultilineInputIsNotDuplicated
{
  [self assertJSInsertionIsNotDuplicatedMultiline:YES focused:NO viaState:NO];
}

- (void)testStateInsertionInAFocusedMultilineInputIsNotDuplicated
{
  [self assertJSInsertionIsNotDuplicatedMultiline:YES focused:YES viaState:YES];
}

- (void)testStateInsertionInAnUnfocusedMultilineInputIsNotDuplicated
{
  [self assertJSInsertionIsNotDuplicatedMultiline:YES focused:NO viaState:YES];
}

- (void)testJSInsertionInASingleLineInputIsNotDuplicated
{
  [self assertJSInsertionIsNotDuplicatedMultiline:NO focused:YES viaState:NO];
}

- (void)testSetAttributedStringFromJSInAMultilineInputIsNotDuplicated
{
  [self makeInputMultiline:YES maxLength:0];
  [self typeKeys:@"abc"];

  [_view _setAttributedStringFromJS:[self textWithDefaultAttributes:@"abc def"]];

  XCTAssertEqualObjects(_input.attributedText.string, @"abc def");
}

#pragma mark - maxLength

- (void)testKeysRestoredAfterAFormatterWriteRespectMaxLength
{
  // maxLength 5; JS formats "ab" to "ab-cd". "xy" arrive during the write; UIKit checked them against the old length
  // (2) and let them through. Put back, they would exceed maxLength.
  [self makeInputMultiline:NO maxLength:5];
  [self typeKeys:@"ab"];
  _input.keysDuringNextWrite = @"xy";

  [self setTextAndSelectionFromJS:@"ab-cd" start:5 end:5];

  XCTAssertEqualObjects(_input.attributedText.string, @"ab-cd");
}

- (void)testKeysRestoredUpToMaxLength
{
  [self makeInputMultiline:NO maxLength:6];
  [self typeKeys:@"ab"];
  _input.keysDuringNextWrite = @"xy";

  [self setTextAndSelectionFromJS:@"ab-cd" start:5 end:5];

  XCTAssertEqualObjects(_input.attributedText.string, @"ab-cdx");
}

- (void)testKeysRestoredUpToMaxLengthDoNotSplitAnEmoji
{
  // 👍🏽 is 4 UTF-16 units; 2 are left.
  [self makeInputMultiline:NO maxLength:7];
  [self typeKeys:@"ab"];
  _input.keysDuringNextWrite = @"\U0001F44D\U0001F3FD";

  [self setTextAndSelectionFromJS:@"ab-cd" start:5 end:5];

  XCTAssertEqualObjects(_input.attributedText.string, @"ab-cd");
}

- (void)testKeysDeliveredInsideTheRestoreRespectMaxLength
{
  // maxLength 5; JS formats "123" to "12-3"; "4" arrives during the write and is put back ("12-34"). "5" arrives
  // inside that edit, before it applies: it must not exceed maxLength.
  [self makeInputMultiline:NO maxLength:5];
  [self typeKeys:@"123"];
  _input.keysDuringNextWrite = @"4";
  _input.keysDuringNextReplace = @"5";

  [self setTextAndSelectionFromJS:@"12-3" start:4 end:4];

  XCTAssertEqualObjects(_input.attributedText.string, @"12-34");
}

- (void)testTypingRespectsMaxLength
{
  [self makeInputMultiline:NO maxLength:3];

  [self typeKeys:@"abcd"];

  XCTAssertEqualObjects(_input.attributedText.string, @"abc");
}

#pragma mark - Keys UIKit delivers inside the edit that puts keys back

- (void)testKeysDeliveredInsideTheRestoreAreKeptAndReportedOnce
{
  [self makeInputMultiline:NO maxLength:0];
  [self typeKeys:@"abc"];
  _input.keysDuringNextReplace = @"e";
  [self.reports removeAllObjects];

  [self sendStateFromJS:[self textWithDefaultAttributes:@"ABC"] whileTyping:@"d"];

  XCTAssertEqualObjects(_input.attributedText.string, @"ABCde");
  XCTAssertEqualObjects(self.reports, (@[ @"change", @"selection" ]));
  XCTAssertEqual(self.caret, 5);
}

- (void)assertTheNextKeyFollowsAKeyDeliveredInsideTheRestoreMultiline:(BOOL)multiline
{
  [self makeInputMultiline:multiline maxLength:0];
  [self typeKeys:@"abc"];
  _input.keysDuringNextReplace = @"e";
  [self sendStateFromJS:[self textWithDefaultAttributes:@"ABC"] whileTyping:@"d"];

  [self typeKeys:@"f"];

  XCTAssertEqualObjects(_input.attributedText.string, @"ABCdef");
}

- (void)testTheNextKeyFollowsAKeyDeliveredInsideTheRestore
{
  [self assertTheNextKeyFollowsAKeyDeliveredInsideTheRestoreMultiline:NO];
}

- (void)testTheNextKeyFollowsAKeyDeliveredInsideTheRestoreInAMultilineInput
{
  [self assertTheNextKeyFollowsAKeyDeliveredInsideTheRestoreMultiline:YES];
}

- (void)testTheNextKeyFollowsAKeyDeliveredInsideTheRestoreAfterAControlledValue
{
  [self makeInputMultiline:NO maxLength:0];
  [self typeKeys:@"abc"];
  _input.keysDuringNextWrite = @"d";
  _input.keysDuringNextReplace = @"e";
  [self setTextAndSelectionFromJS:@"ABC" start:3 end:3];

  [self typeKeys:@"f"];

  XCTAssertEqualObjects(_input.attributedText.string, @"ABCdef");
}

- (void)testAKeyDeliveredInsideTheRestoreOfAReplacementIsKept
{
  // "d" is selected and "X" typed over it while JS restyles the text; "Y" arrives inside the edit that puts "X" back.
  [self makeInputMultiline:NO maxLength:0];
  [self typeKeys:@"abcd"];
  [self selectFrom:3 length:1];
  _input.keysDuringNextReplace = @"Y";
  NSMutableAttributedString *restyled = [RCTTestStyled(@"abc", UIColor.blueColor) mutableCopy];
  [restyled appendAttributedString:RCTTestStyled(@"d", UIColor.redColor)];

  [self sendStateFromJS:restyled whileTyping:@"X"];
  [self typeKeys:@"Z"];

  XCTAssertEqualObjects(_input.attributedText.string, @"abcXYZ");
  // Typed over a selection, "X" takes the style of the text before it.
  XCTAssertEqualObjects(
      [_input.attributedText attribute:NSForegroundColorAttributeName atIndex:3 effectiveRange:NULL],
      UIColor.blueColor);
}

- (void)testAKeyTypedInTheRangeARestoreReplacedIsKept
{
  // "abc" is selected and "X" typed over it while JS restyles the text; "Y" arrives inside the edit that puts "X" back.
  // Keys inside the range that edit replaces are dropped only while it applies: "Z", typed there next, is kept.
  [self makeInputMultiline:NO maxLength:0];
  [self typeKeys:@"abcd"];
  [self selectFrom:0 length:3];
  _input.keysDuringNextReplace = @"Y";
  NSMutableAttributedString *restyled = [RCTTestStyled(@"ab", UIColor.blueColor) mutableCopy];
  [restyled appendAttributedString:RCTTestStyled(@"cd", UIColor.redColor)];

  [self sendStateFromJS:restyled whileTyping:@"X"];
  XCTAssertEqualObjects(_input.attributedText.string, @"XYd");
  XCTAssertEqual(self.caret, 2);
  [self typeKeys:@"Z"];

  XCTAssertEqualObjects(_input.attributedText.string, @"XYZd");
}

- (void)testAKeyDeliveredInsideTheRestoreOfABackspaceIsKept
{
  [self makeInputMultiline:NO maxLength:0];
  [self typeKeys:@"abcd"];
  _input.keysDuringNextReplace = @"e";

  [self sendStateFromJS:RCTTestStyled(@"abcd", UIColor.blueColor) whileTyping:@"\b"];
  [self typeKeys:@"f"];

  XCTAssertEqualObjects(_input.attributedText.string, @"abcef");
}

- (void)testABackspaceDeliveredInsideTheRestoreIsDropped
{
  // "d" is typed while JS restyles the text, and a backspace arrives inside the edit that puts "d" back. Applied, it
  // would delete "c" (the caret is after the range that edit replaces), and the edit would then insert past the end.
  // It is dropped: one backspace is lost; the other text and the caret stay right.
  [self makeInputMultiline:NO maxLength:0];
  [self typeKeys:@"abc"];
  _input.keysDuringNextReplace = @"\b";

  [self sendStateFromJS:RCTTestStyled(@"abc", UIColor.blueColor) whileTyping:@"d"];

  XCTAssertEqualObjects(_input.attributedText.string, @"abcd");
  XCTAssertEqual(self.caret, 4);
}

- (void)testABackspaceDeliveredInsideTheRestoreOfABackspaceIsDropped
{
  // In the middle of the text: applied, the second backspace would delete "c", and the edit that puts back the first
  // one would then delete "d".
  [self makeInputMultiline:NO maxLength:0];
  [self typeKeys:@"abcde"];
  [self moveCaretTo:3];
  _input.keysDuringNextReplace = @"\b";

  [self sendStateFromJS:RCTTestStyled(@"abcde", UIColor.blueColor) whileTyping:@"\b"];

  XCTAssertEqualObjects(_input.attributedText.string, @"abde");
  XCTAssertEqual(self.caret, 2);
}

#pragma mark - IME composition (marked text)

- (void)testMarkedTextStartedDuringAWriteIsNotCommittedAsPlainText
{
  [self makeInputMultiline:NO maxLength:0];
  [self typeKeys:@"abc"];
  _input.markedTextDuringNextWrite = @"\u306B";

  [self sendStateFromJS:[self textWithDefaultAttributes:@"ABC"]];

  // The write ended the composition; JS's text is left as it is, without the composed text as plain text.
  XCTAssertEqualObjects(_input.attributedText.string, @"ABC");
  XCTAssertNil(_input.markedTextRange);
}

- (void)testMarkedTextThatArrivesAfterAWriteIsLeftComposing
{
  [self makeInputMultiline:YES maxLength:0];
  [self typeKeys:@"abc"];
  _input.markedTextDuringNextWrite = @"\u306B";
  _input.keysArriveAfterAssignment = YES;

  NSNumber *eventCount = [_view valueForKey:@"_mostRecentEventCount"];

  [self sendStateFromJS:[self textWithDefaultAttributes:@"ABC"]];

  XCTAssertEqualObjects(_input.attributedText.string, @"ABC\u306B");
  XCTAssertNotNil(_input.markedTextRange);
  XCTAssertEqual(_input.writeCount, 1u);
  // Nothing is put back or reported while the user composes.
  XCTAssertEqualObjects([_view valueForKey:@"_mostRecentEventCount"], eventCount);
}

@end

#endif
