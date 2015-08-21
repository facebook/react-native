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

#import "RCTConvert.h"

@interface RCTConvert_UIColorTests : XCTestCase

@end

@implementation RCTConvert_UIColorTests

#define XCTAssertEqualColors(color1, color2) do { \
  CGFloat r1, g1, b1, a1; \
  CGFloat r2, g2, b2, a2; \
  XCTAssertTrue([(color1) getRed:&r1 green:&g1 blue:&b1 alpha:&a1] && \
    [(color2) getRed:&r2 green:&g2 blue:&b2 alpha:&a2] && \
    r1 == r2 && g1 == g2 && b1 == b2 && a1 == a2, \
    @"rgba(%d, %d, %d, %.3f) != rgba(%d, %d, %d, %.3f)", \
    (int)(r1 * 255), (int)(g1 * 255), (int)(b1 * 255), a1, \
    (int)(r2 * 255), (int)(g2 * 255), (int)(b2 * 255), a2 \
  ); \
} while (0)

- (void)testHex3
{
  UIColor *color = [RCTConvert UIColor:@"#333"];
  UIColor *expected = [UIColor colorWithWhite:0.2 alpha:1.0];
  XCTAssertEqualColors(color, expected);
}

- (void)testHex6
{
  UIColor *color = [RCTConvert UIColor:@"#666"];
  UIColor *expected = [UIColor colorWithWhite:0.4 alpha:1.0];
  XCTAssertEqualColors(color, expected);
}

- (void)testRGB
{
  UIColor *color = [RCTConvert UIColor:@"rgb(51, 102, 153)"];
  UIColor *expected = [UIColor colorWithRed:0.2 green:0.4 blue:0.6 alpha:1.0];
  XCTAssertEqualColors(color, expected);
}

- (void)testRGBA
{
  UIColor *color = [RCTConvert UIColor:@"rgba(51, 102, 153, 0.5)"];
  UIColor *expected = [UIColor colorWithRed:0.2 green:0.4 blue:0.6 alpha:0.5];
  XCTAssertEqualColors(color, expected);
}

- (void)testHSL
{
  UIColor *color = [RCTConvert UIColor:@"hsl(30, 50%, 50%)"];
  UIColor *expected = [UIColor colorWithHue:30.0 / 360.0 saturation:0.5 brightness:0.5 alpha:1.0];
  XCTAssertEqualColors(color, expected);
}

- (void)testHSLA
{
  UIColor *color = [RCTConvert UIColor:@"hsla(30, 50%, 50%, 0.5)"];
  UIColor *expected = [UIColor colorWithHue:30.0 / 360.0 saturation:0.5 brightness:0.5 alpha:0.5];
  XCTAssertEqualColors(color, expected);
}

@end
