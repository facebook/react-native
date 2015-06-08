/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <Foundation/Foundation.h>

/**
 *  Problem: The NSAttributedString can not store Attributes if the String is empty, because every Attribute is associated with a certain NSRange in the string. That's why an empty String can not store any attributes, for there is not a single valid range. This results in two problems, when we're dealing with an empty string:
    - RCTMeasure function in RCTShadowTextView can not calculate the height correctly, because the Attributes are not set for an empty string.
    - The UITextView will not be displayed in the correct height: i.e. the cursor will always be the default height and not the size set by the Font size.
 
  Solution: The NSAttributedString can never be empty if we want to store our Attributes in the String. That's why RCTShadowTextView will create a NSString only containing one letter if _text is empty before passing it to the RCTAttributedStringHanlder. Also it's sets the isEmptyStringWithAttributes variable to true, so other componenets may check if the value of the string is really meant to be displayed or just so we can store the Text Attributes somehow.
 
  Problems Solved:
    - RCTMeasure works correctly because we always calculate with a non empty string.
    - UITextView works correctly because we can check for the isEmptyStingWithAttributes variable in RCTTextView and copy the attributes of the NSAttributedString into UITextViews typingAttributes variable.
 
  Conclusion:
  I am aware that this may not be the most elegant solution :/ . If every one comes up with a better idea, please contact me on twitter: @lukasreichart or open an issue on github.
 */
@interface NSAttributedString (EmptyStringWithAttributes)

@property (nonatomic, assign) BOOL isEmptyStringWithAttributes;

@end
