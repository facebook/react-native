/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTTextInputUtils.h>
#import <React/RCTUITextField.h>
#import <React/RCTUITextView.h>
#import <XCTest/XCTest.h>

@interface RCTTextInputUtilsTest : XCTestCase
@end

// Random short text over characters that make composed sequences: emoji, skin tones, flags, combining marks, ZWJ.
static NSString *RCTTestRandomText(uint32_t *seed, NSUInteger maxCharacters)
{
  NSArray<NSString *> *alphabet = @[
    @"a",
    @"b",
    @"a",
    @"b",
    @"c",
    @"\U0001F44D",
    @"\U0001F3FD",
    @"\U0001F1EF",
    @"\U0001F1F5",
    @"\u00E9",
    @"\u0301",
    @"\u200D",
    @"\U0001F468",
    @"\u05E9",
    @" ",
    @"\n",
  ];
  NSMutableString *text = [NSMutableString new];
  NSUInteger count = rand_r(seed) % maxCharacters;
  for (NSUInteger i = 0; i < count; i++) {
    [text appendString:alphabet[rand_r(seed) % alphabet.count]];
  }
  return text;
}

@implementation RCTTextInputUtilsTest

- (void)testCopyBackedTextInputPreservesTintColor
{
  RCTUITextField *source = [RCTUITextField new];
  RCTUITextView *destination = [RCTUITextView new];
  source.tintColor = UIColor.redColor;

  RCTCopyBackedTextInput(source, destination);

  XCTAssertEqualObjects(destination.tintColor, UIColor.redColor);
}

- (void)testCopyBackedTextInputPreservesReturnKeyType
{
  RCTUITextField *source = [RCTUITextField new];
  RCTUITextView *destination = [RCTUITextView new];
  source.returnKeyType = UIReturnKeyDone;

  RCTCopyBackedTextInput(source, destination);

  XCTAssertEqual(destination.returnKeyType, UIReturnKeyDone);
}

#pragma mark - RCTTextInputChangedRange

- (void)testChangedRangeOfAnInsertion
{
  // "p" typed, then "ri" delivered during a write: inserted at 1, nothing replaced.
  NSRange range = RCTTextInputChangedRange(@"p", @"pri");
  XCTAssertEqual(range.location, 1u);
  XCTAssertEqual(range.length, 0u);
}

- (void)testChangedRangeOfAnInsertionInTheMiddle
{
  NSRange range = RCTTextInputChangedRange(@"Hello World", @"Hello #tag World");
  XCTAssertEqual(range.location, 6u);
  XCTAssertEqual(range.length, 0u);
}

- (void)testChangedRangeOfAReplacement
{
  NSRange range = RCTTextInputChangedRange(@"abcdef", @"abXYef");
  XCTAssertEqual(range.location, 2u);
  XCTAssertEqual(range.length, 2u);
}

- (void)testChangedRangeOfADeletion
{
  NSRange range = RCTTextInputChangedRange(@"abcdef", @"abef");
  XCTAssertEqual(range.location, 2u);
  XCTAssertEqual(range.length, 2u);
}

- (void)testChangedRangeOfARepeatedCharacter
{
  NSRange range = RCTTextInputChangedRange(@"aa", @"aaa");
  XCTAssertEqual(range.length, 0u);
  XCTAssertEqual(range.location, 2u);
}

- (void)testChangedRangeDoesNotSplitAnEmoji
{
  // 👨 and 👩 share their high surrogate.
  NSRange range = RCTTextInputChangedRange(@"a\U0001F468b", @"a\U0001F469b");
  XCTAssertEqual(range.location, 1u);
  XCTAssertEqual(range.length, 2u);
}

- (void)testChangedRangeKeepsACombiningMarkWithItsLetter
{
  // A combining acute accent typed after "e": the edit replaces "e" with "e\u0301".
  NSRange range = RCTTextInputChangedRange(@"cafe", @"cafe\u0301");
  XCTAssertEqual(range.location, 3u);
  XCTAssertEqual(range.length, 1u);
}

- (void)testChangedRangeOfAFlagAndASkinTone
{
  NSRange flag = RCTTextInputChangedRange(@"ab", @"a\U0001F1EF\U0001F1F5b");
  XCTAssertEqual(flag.location, 1u);
  XCTAssertEqual(flag.length, 0u);
  // A skin tone added to 👍 changes that emoji as a whole.
  NSRange tone = RCTTextInputChangedRange(@"\U0001F44D", @"\U0001F44D\U0001F3FD");
  XCTAssertEqual(tone.location, 0u);
  XCTAssertEqual(tone.length, 2u);
}

#pragma mark - RCTTextInputTextToRestore

- (void)testRestoresKeysTypedDuringAnAttributeOnlyWrite
{
  // "p" typed; while JS restyles it (a nested <Text>), "ri" arrive and the write replaces them.
  NSRange range;
  NSString *text;
  XCTAssertTrue(RCTTextInputTextToRestore(@"p", @"pri", @"p", &range, &text));
  XCTAssertEqual(range.location, 1u);
  XCTAssertEqual(range.length, 0u);
  XCTAssertEqualObjects(text, @"ri");
}

- (void)testRestoresABackspaceTypedDuringAnAttributeOnlyWrite
{
  NSRange range;
  NSString *text;
  XCTAssertTrue(RCTTextInputTextToRestore(@"abc", @"ab", @"abc", &range, &text));
  XCTAssertEqual(range.location, 2u);
  XCTAssertEqual(range.length, 1u);
  XCTAssertEqualObjects(text, @"");
}

- (void)testRestoresAnInsertionMadeInTheMiddleDuringAnAttributeOnlyWrite
{
  NSRange range;
  NSString *text;
  XCTAssertTrue(RCTTextInputTextToRestore(@"#a Hello", @"#ab Hello", @"#a Hello", &range, &text));
  XCTAssertEqual(range.location, 2u);
  XCTAssertEqualObjects(text, @"b");
}

- (void)testRestoresKeysTypedDuringAnUpperCasingWrite
{
  // "abc" was typed; JS writes "ABC"; "d" arrived during the write.
  NSRange range;
  NSString *text;
  XCTAssertTrue(RCTTextInputTextToRestore(@"abc", @"abcd", @"ABC", &range, &text));
  XCTAssertEqual(range.location, 3u);
  XCTAssertEqual(range.length, 0u);
  XCTAssertEqualObjects(text, @"d");
}

- (void)testRestoresAnInsertionInTheMiddleAtTheSameDistanceFromTheEnd
{
  // The caret is before "F": "x" was typed, JS upper-cases it, "y" arrived during the write.
  NSRange range;
  NSString *text;
  XCTAssertTrue(RCTTextInputTextToRestore(@"ABCDExF", @"ABCDExyF", @"ABCDEXF", &range, &text));
  XCTAssertEqual(range.location, 6u);
  XCTAssertEqualObjects(text, @"y");
}

- (void)testRestoresAnInsertionWhenJSShortensTheText
{
  // JS strips spaces: "a b" becomes "ab", "c" arrived during the write.
  NSRange range;
  NSString *text;
  XCTAssertTrue(RCTTextInputTextToRestore(@"a b", @"a bc", @"ab", &range, &text));
  XCTAssertEqual(range.location, 2u);
  XCTAssertEqualObjects(text, @"c");
}

- (void)testDoesNotRestoreAReplacementWhenJSChangedTheCharacters
{
  NSRange range;
  NSString *text;
  XCTAssertFalse(RCTTextInputTextToRestore(@"abc", @"ab", @"ABC", &range, &text));
  XCTAssertFalse(RCTTextInputTextToRestore(@"abc", @"abc", @"ABC", &range, &text));
}

- (void)testRestoresAnEmojiWithoutSplittingJSText
{
  // An emoji typed after a flag; JS upper-cased "a" so the characters changed.
  NSString *flag = @"\U0001F1EF\U0001F1F5";
  NSString *family = @"\U0001F468\u200D\U0001F469\u200D\U0001F467";
  NSRange range;
  NSString *text;
  XCTAssertTrue(RCTTextInputTextToRestore(
      [@"a" stringByAppendingString:flag],
      [[@"a" stringByAppendingString:flag] stringByAppendingString:family],
      [@"A" stringByAppendingString:flag],
      &range,
      &text));
  XCTAssertEqual(range.location, 1 + flag.length);
  XCTAssertEqualObjects(text, family);
}

- (void)testChangedRangeRebuildsTheNewTextFromRandomEdits
{
  uint32_t seed = 58904;
  for (int i = 0; i < 20000; i++) {
    NSString *oldText = RCTTestRandomText(&seed, 8);
    NSString *newText = RCTTestRandomText(&seed, 8);
    if (rand_r(&seed) % 2) {
      // Mostly small edits of oldText.
      NSMutableString *edited = [oldText mutableCopy];
      [edited insertString:RCTTestRandomText(&seed, 3) atIndex:edited.length ? rand_r(&seed) % (edited.length + 1) : 0];
      newText = edited;
    }
    NSRange range = RCTTextInputChangedRange(oldText, newText);
    XCTAssertLessThanOrEqual(NSMaxRange(range), oldText.length);
    NSInteger insertedLength = (NSInteger)newText.length - (NSInteger)oldText.length + (NSInteger)range.length;
    XCTAssertGreaterThanOrEqual(insertedLength, 0);
    NSString *inserted = [newText substringWithRange:NSMakeRange(range.location, insertedLength)];
    NSString *rebuilt = [oldText stringByReplacingCharactersInRange:range withString:inserted];
    if (![rebuilt isEqualToString:newText]) {
      XCTFail(@"old=%@ new=%@ range=%@", oldText, newText, NSStringFromRange(range));
      return;
    }
  }
}

- (void)testTextToRestoreAfterAnAttributeOnlyWriteRebuildsTheTypedText
{
  uint32_t seed = 4242;
  for (int i = 0; i < 20000; i++) {
    NSString *before = RCTTestRandomText(&seed, 8);
    NSMutableString *typed = [before mutableCopy];
    NSUInteger at = typed.length ? rand_r(&seed) % (typed.length + 1) : 0;
    // UIKit inserts keys on composed character boundaries.
    if (at < typed.length) {
      at = [typed rangeOfComposedCharacterSequenceAtIndex:at].location;
    }
    [typed insertString:RCTTestRandomText(&seed, 3) atIndex:at];
    NSRange range;
    NSString *text = nil;
    if (!RCTTextInputTextToRestore(before, typed, before, &range, &text)) {
      XCTAssertEqualObjects(typed, before);
      continue;
    }
    NSString *rebuilt = [before stringByReplacingCharactersInRange:range withString:text];
    if (![rebuilt isEqualToString:typed]) {
      XCTFail(@"before=%@ typed=%@ range=%@ text=%@", before, typed, NSStringFromRange(range), text);
      return;
    }
  }
}

#pragma mark - RCTTextInputTextWithinLength

- (void)testTextWithinLength
{
  XCTAssertEqualObjects(RCTTextInputTextWithinLength(@"xy", 5), @"xy");
  XCTAssertEqualObjects(RCTTextInputTextWithinLength(@"xy", 2), @"xy");
  XCTAssertEqualObjects(RCTTextInputTextWithinLength(@"xy", 1), @"x");
  XCTAssertNil(RCTTextInputTextWithinLength(@"xy", 0));
  XCTAssertNil(RCTTextInputTextWithinLength(@"xy", -3));
}

- (void)testTextWithinLengthDoesNotSplitAComposedCharacterSequence
{
  // 👍🏽 is 4 UTF-16 units.
  NSString *thumb = @"\U0001F44D\U0001F3FD";
  XCTAssertNil(RCTTextInputTextWithinLength(thumb, 2));
  XCTAssertEqualObjects(RCTTextInputTextWithinLength([@"a" stringByAppendingString:thumb], 3), @"a");
  XCTAssertEqualObjects(
      RCTTextInputTextWithinLength([@"a" stringByAppendingString:thumb], 5), [@"a" stringByAppendingString:thumb]);
}

#pragma mark - RCTTextInputOffsetAfterEdit

- (void)testOffsetAfterAnInsertion
{
  // "ri" inserted at 1.
  XCTAssertEqual(RCTTextInputOffsetAfterEdit(0, NSMakeRange(1, 0), 2), 0);
  XCTAssertEqual(RCTTextInputOffsetAfterEdit(1, NSMakeRange(1, 0), 2), 3);
  XCTAssertEqual(RCTTextInputOffsetAfterEdit(4, NSMakeRange(1, 0), 2), 6);
}

- (void)testOffsetAfterAReplacementAndADeletion
{
  XCTAssertEqual(RCTTextInputOffsetAfterEdit(3, NSMakeRange(2, 2), 1), 3);
  XCTAssertEqual(RCTTextInputOffsetAfterEdit(5, NSMakeRange(2, 2), 1), 4);
  XCTAssertEqual(RCTTextInputOffsetAfterEdit(2, NSMakeRange(2, 2), 1), 3);
  XCTAssertEqual(RCTTextInputOffsetAfterEdit(1, NSMakeRange(2, 2), 1), 1);
  XCTAssertEqual(RCTTextInputOffsetAfterEdit(3, NSMakeRange(2, 1), 0), 2);
}

@end
