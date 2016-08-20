/**
 * The examples provided by Facebook are for non-commercial testing and
 * evaluation purposes only.
 *
 * Facebook reserves all rights not expressly granted.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
 * OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NON INFRINGEMENT. IN NO EVENT SHALL
 * FACEBOOK BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN
 * AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

#import <XCTest/XCTest.h>

#import "RCTFont.h"

#import <CoreText/CoreText.h>

@interface RCTFontTests : XCTestCase

@end

@implementation RCTFontTests

#define RCTAssertEqualFonts(font1, font2) { \
  XCTAssertEqualObjects(font1, font2); \
}

- (void)testWeight
{
  {
    UIFont *expected = [UIFont systemFontOfSize:14 weight:UIFontWeightBold];
    UIFont *result = [RCTConvert UIFont:@{@"fontWeight": @"bold"}];
    RCTAssertEqualFonts(expected, result);
  }
  {
    UIFont *expected = [UIFont systemFontOfSize:14 weight:UIFontWeightMedium];
    UIFont *result = [RCTConvert UIFont:@{@"fontWeight": @"500"}];
    RCTAssertEqualFonts(expected, result);
  }
  {
    UIFont *expected = [UIFont systemFontOfSize:14 weight:UIFontWeightUltraLight];
    UIFont *result = [RCTConvert UIFont:@{@"fontWeight": @"100"}];
    RCTAssertEqualFonts(expected, result);
  }
  {
    UIFont *expected = [UIFont systemFontOfSize:14 weight:UIFontWeightRegular];
    UIFont *result = [RCTConvert UIFont:@{@"fontWeight": @"normal"}];
    RCTAssertEqualFonts(expected, result);
  }
}

- (void)testSize
{
  {
    UIFont *expected = [UIFont systemFontOfSize:18.5];
    UIFont *result = [RCTConvert UIFont:@{@"fontSize": @18.5}];
    RCTAssertEqualFonts(expected, result);
  }
}

- (void)testFamily
{
  {
    UIFont *expected = [UIFont fontWithName:@"Cochin" size:14];
    UIFont *result = [RCTConvert UIFont:@{@"fontFamily": @"Cochin"}];
    RCTAssertEqualFonts(expected, result);
  }
  {
    UIFont *expected = [UIFont fontWithName:@"HelveticaNeue" size:14];
    UIFont *result = [RCTConvert UIFont:@{@"fontFamily": @"Helvetica Neue"}];
    RCTAssertEqualFonts(expected, result);
  }
  {
    UIFont *expected = [UIFont fontWithName:@"HelveticaNeue-Italic" size:14];
    UIFont *result = [RCTConvert UIFont:@{@"fontFamily": @"HelveticaNeue-Italic"}];
    RCTAssertEqualFonts(expected, result);
  }
}

- (void)testStyle
{
  {
    UIFont *font = [UIFont systemFontOfSize:14];
    UIFontDescriptor *fontDescriptor = [font fontDescriptor];
    UIFontDescriptorSymbolicTraits symbolicTraits = fontDescriptor.symbolicTraits;
    symbolicTraits |= UIFontDescriptorTraitItalic;
    fontDescriptor = [fontDescriptor fontDescriptorWithSymbolicTraits:symbolicTraits];
    UIFont *expected = [UIFont fontWithDescriptor:fontDescriptor size:14];
    UIFont *result = [RCTConvert UIFont:@{@"fontStyle": @"italic"}];
    RCTAssertEqualFonts(expected, result);
  }
  {
    UIFont *expected = [UIFont systemFontOfSize:14];
    UIFont *result = [RCTConvert UIFont:@{@"fontStyle": @"normal"}];
    RCTAssertEqualFonts(expected, result);
  }
}

- (void)testStyleAndWeight
{
  {
    UIFont *font = [UIFont systemFontOfSize:14 weight:UIFontWeightUltraLight];
    UIFontDescriptor *fontDescriptor = [font fontDescriptor];
    UIFontDescriptorSymbolicTraits symbolicTraits = fontDescriptor.symbolicTraits;
    symbolicTraits |= UIFontDescriptorTraitItalic;
    fontDescriptor = [fontDescriptor fontDescriptorWithSymbolicTraits:symbolicTraits];
    UIFont *expected = [UIFont fontWithDescriptor:fontDescriptor size:14];
    UIFont *result = [RCTConvert UIFont:@{@"fontStyle": @"italic", @"fontWeight": @"100"}];
    RCTAssertEqualFonts(expected, result);
  }
  {
    UIFont *font = [UIFont systemFontOfSize:14 weight:UIFontWeightBold];
    UIFontDescriptor *fontDescriptor = [font fontDescriptor];
    UIFontDescriptorSymbolicTraits symbolicTraits = fontDescriptor.symbolicTraits;
    symbolicTraits |= UIFontDescriptorTraitItalic;
    fontDescriptor = [fontDescriptor fontDescriptorWithSymbolicTraits:symbolicTraits];
    UIFont *expected = [UIFont fontWithDescriptor:fontDescriptor size:14];
    UIFont *result = [RCTConvert UIFont:@{@"fontStyle": @"italic", @"fontWeight": @"bold"}];
    RCTAssertEqualFonts(expected, result);
  }
}

- (void)testFamilyAndWeight
{
  {
    UIFont *expected = [UIFont fontWithName:@"HelveticaNeue-Bold" size:14];
    UIFont *result = [RCTConvert UIFont:@{@"fontFamily": @"Helvetica Neue", @"fontWeight": @"bold"}];
    RCTAssertEqualFonts(expected, result);
  }
  {
    UIFont *expected = [UIFont fontWithName:@"HelveticaNeue" size:14];
    UIFont *result = [RCTConvert UIFont:@{@"fontFamily": @"HelveticaNeue-Bold", @"fontWeight": @"normal"}];
    RCTAssertEqualFonts(expected, result);
  }
  {
    UIFont *expected = [UIFont fontWithName:@"Cochin-Bold" size:14];
    UIFont *result = [RCTConvert UIFont:@{@"fontFamily": @"Cochin", @"fontWeight": @"700"}];
    RCTAssertEqualFonts(expected, result);
  }
  {
    UIFont *expected = [UIFont fontWithName:@"Cochin" size:14];
    UIFont *result = [RCTConvert UIFont:@{@"fontFamily": @"Cochin", @"fontWeight": @"100"}];
    RCTAssertEqualFonts(expected, result);
  }
}

- (void)testFamilyAndStyle
{
  {
    UIFont *expected = [UIFont fontWithName:@"HelveticaNeue-Italic" size:14];
    UIFont *result = [RCTConvert UIFont:@{@"fontFamily": @"Helvetica Neue", @"fontStyle": @"italic"}];
    RCTAssertEqualFonts(expected, result);
  }
  {
    UIFont *expected = [UIFont fontWithName:@"HelveticaNeue" size:14];
    UIFont *result = [RCTConvert UIFont:@{@"fontFamily": @"HelveticaNeue-Italic", @"fontStyle": @"normal"}];
    RCTAssertEqualFonts(expected, result);
  }
}

- (void)testFamilyStyleAndWeight
{
  {
    UIFont *expected = [UIFont fontWithName:@"HelveticaNeue-LightItalic" size:14];
    UIFont *result = [RCTConvert UIFont:@{@"fontFamily": @"Helvetica Neue", @"fontStyle": @"italic", @"fontWeight": @"300"}];
    RCTAssertEqualFonts(expected, result);
  }
  {
    UIFont *expected = [UIFont fontWithName:@"HelveticaNeue-Bold" size:14];
    UIFont *result = [RCTConvert UIFont:@{@"fontFamily": @"HelveticaNeue-Italic", @"fontStyle": @"normal", @"fontWeight": @"bold"}];
    RCTAssertEqualFonts(expected, result);
  }
  {
    UIFont *expected = [UIFont fontWithName:@"HelveticaNeue" size:14];
    UIFont *result = [RCTConvert UIFont:@{@"fontFamily": @"HelveticaNeue-Italic", @"fontStyle": @"normal", @"fontWeight": @"normal"}];
    RCTAssertEqualFonts(expected, result);
  }
}

- (void)testVariant
{
  {
    UIFont *expected = [UIFont monospacedDigitSystemFontOfSize:14 weight:UIFontWeightRegular];
    UIFont *result = [RCTConvert UIFont:@{@"fontVariant": @[@"tabular-nums"]}];
    RCTAssertEqualFonts(expected, result);
  }
  {
    UIFont *monospaceFont = [UIFont monospacedDigitSystemFontOfSize:14 weight:UIFontWeightRegular];
    UIFontDescriptor *fontDescriptor = [monospaceFont.fontDescriptor fontDescriptorByAddingAttributes:@{
      UIFontDescriptorFeatureSettingsAttribute: @[@{
        UIFontFeatureTypeIdentifierKey: @(kLowerCaseType),
        UIFontFeatureSelectorIdentifierKey: @(kLowerCaseSmallCapsSelector),
      }]
    }];
    UIFont *expected = [UIFont fontWithDescriptor:fontDescriptor size:14];
    UIFont *result = [RCTConvert UIFont:@{@"fontVariant": @[@"tabular-nums", @"small-caps"]}];
    RCTAssertEqualFonts(expected, result);
  }
}

- (void)testInvalidFont
{
  {
    UIFont *expected = [UIFont systemFontOfSize:14];
    UIFont *result = [RCTConvert UIFont:@{@"fontFamily": @"foobar"}];
    RCTAssertEqualFonts(expected, result);
  }
  {
    UIFont *expected = [UIFont systemFontOfSize:14 weight:UIFontWeightBold];
    UIFont *result = [RCTConvert UIFont:@{@"fontFamily": @"foobar", @"fontWeight": @"bold"}];
    RCTAssertEqualFonts(expected, result);
  }
}

@end
