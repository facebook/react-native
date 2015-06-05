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

#import <CoreGraphics/CoreGraphics.h>
#import <Foundation/Foundation.h>
#import <UIKit/UIView.h>
#import <XCTest/XCTest.h>

extern CGRect RCTClipRect(CGSize contentSize, CGFloat contentScale,
                          CGSize targetSize, CGFloat targetScale,
                          UIViewContentMode resizeMode);

#define RCTAssertEqualPoints(a, b) { \
XCTAssertEqual(a.x, b.x); \
XCTAssertEqual(a.y, b.y); \
}

#define RCTAssertEqualSizes(a, b) { \
XCTAssertEqual(a.width, b.width); \
XCTAssertEqual(a.height, b.height); \
}

#define RCTAssertEqualRects(a, b) { \
RCTAssertEqualPoints(a.origin, b.origin); \
RCTAssertEqualSizes(a.size, b.size); \
}

@interface ClippingTests : XCTestCase

@end

@implementation ClippingTests

- (void)testLandscapeSourceLandscapeTarget
{
  CGSize content = {1000, 100};
  CGSize target = {100, 20};

  {
    CGRect expected = {CGPointZero, {100, 20}};
    CGRect result = RCTClipRect(content, 1, target, 1, UIViewContentModeScaleToFill);
    RCTAssertEqualRects(expected, result);
  }

  {
    CGRect expected = {CGPointZero, {100, 10}};
    CGRect result = RCTClipRect(content, 1, target, 1, UIViewContentModeScaleAspectFit);
    RCTAssertEqualRects(expected, result);
  }

  {
    CGRect expected = {{-50, 0}, {200, 20}};
    CGRect result = RCTClipRect(content, 1, target, 1, UIViewContentModeScaleAspectFill);
    RCTAssertEqualRects(expected, result);
  }
}

- (void)testPortraitSourceLandscapeTarget
{
  CGSize content = {10, 100};
  CGSize target = {100, 20};

  {
    CGRect expected = {CGPointZero, {10, 20}};
    CGRect result = RCTClipRect(content, 1, target, 1, UIViewContentModeScaleToFill);
    RCTAssertEqualRects(expected, result);
  }

  {
    CGRect expected = {CGPointZero, {2, 20}};
    CGRect result = RCTClipRect(content, 1, target, 1, UIViewContentModeScaleAspectFit);
    RCTAssertEqualRects(expected, result);
  }

  {
    CGRect expected = {{0, -49}, {10, 100}};
    CGRect result = RCTClipRect(content, 1, target, 1, UIViewContentModeScaleAspectFill);
    RCTAssertEqualRects(expected, result);
  }
}

- (void)testPortraitSourcePortraitTarget
{
  CGSize content = {10, 100};
  CGSize target = {20, 50};

  {
    CGRect expected = {CGPointZero, {10, 50}};
    CGRect result = RCTClipRect(content, 1, target, 1, UIViewContentModeScaleToFill);
    RCTAssertEqualRects(expected, result);
  }

  {
    CGRect expected = {CGPointZero, {5, 50}};
    CGRect result = RCTClipRect(content, 1, target, 1, UIViewContentModeScaleAspectFit);
    RCTAssertEqualRects(expected, result);
  }

  {
    CGRect expected = {{0, -37.5}, {10, 100}};
    CGRect result = RCTClipRect(content, 1, target, 1, UIViewContentModeScaleAspectFill);
    RCTAssertEqualRects(expected, result);
  }
}

- (void)testScaling
{
  CGSize content = {2, 2};
  CGSize target = {3, 3};

  CGRect expected = {CGPointZero, {3, 3}};
  CGRect result = RCTClipRect(content, 2, target, 1, UIViewContentModeScaleToFill);
  RCTAssertEqualRects(expected, result);
}

@end
