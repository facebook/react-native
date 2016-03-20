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
#import "RCTImageUtils.h"

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

@interface RCTImageUtilTests : XCTestCase

@end

@implementation RCTImageUtilTests

- (void)testLandscapeSourceLandscapeTarget
{
  CGSize content = {1000, 100};
  CGSize target = {100, 20};

  {
    CGRect expected = {CGPointZero, {100, 20}};
    CGRect result = RCTTargetRect(content, target, 1, RCTResizeModeStretch);
    RCTAssertEqualRects(expected, result);
  }

  {
    CGRect expected = {{0, 5}, {100, 10}};
    CGRect result = RCTTargetRect(content, target, 1, RCTResizeModeContain);
    RCTAssertEqualRects(expected, result);
  }

  {
    CGRect expected = {{-50, 0}, {200, 20}};
    CGRect result = RCTTargetRect(content, target, 1, RCTResizeModeCover);
    RCTAssertEqualRects(expected, result);
  }
}

- (void)testPortraitSourceLandscapeTarget
{
  CGSize content = {10, 100};
  CGSize target = {100, 20};

  {
    CGRect expected = {CGPointZero, {100, 20}};
    CGRect result = RCTTargetRect(content, target, 1, RCTResizeModeStretch);
    RCTAssertEqualRects(expected, result);
  }

  {
    CGRect expected = {{49, 0}, {2, 20}};
    CGRect result = RCTTargetRect(content, target, 1, RCTResizeModeContain);
    RCTAssertEqualRects(expected, result);
  }

  {
    CGRect expected = {{0, -490}, {100, 1000}};
    CGRect result = RCTTargetRect(content, target, 1, RCTResizeModeCover);
    RCTAssertEqualRects(expected, result);
  }
}

- (void)testPortraitSourcePortraitTarget
{
  CGSize content = {10, 100};
  CGSize target = {20, 50};

  {
    CGRect expected = {CGPointZero, {20, 50}};
    CGRect result = RCTTargetRect(content, target, 1, RCTResizeModeStretch);
    RCTAssertEqualRects(expected, result);
  }

  {
    CGRect expected = {{7,0}, {5, 50}};
    CGRect result = RCTTargetRect(content, target, 1, RCTResizeModeContain);
    RCTAssertEqualRects(expected, result);
  }

  {
    CGRect expected = {{0, -75}, {20, 200}};
    CGRect result = RCTTargetRect(content, target, 2, RCTResizeModeCover);
    RCTAssertEqualRects(expected, result);
  }
}

- (void)testRounding
{
  CGSize content = {10, 100};
  CGSize target = {20, 50};

  {
    CGRect expected = {{0, -75}, {20, 200}};
    CGRect result = RCTTargetRect(content, target, 1, RCTResizeModeCover);
    RCTAssertEqualRects(expected, result);
  }
}

- (void)testScaling
{
  CGSize content = {2, 2};
  CGSize target = {3, 3};

  CGRect expected = {CGPointZero, {3, 3}};
  CGRect result = RCTTargetRect(content, target, 1, RCTResizeModeStretch);
  RCTAssertEqualRects(expected, result);
}

- (void)testPlaceholderImage
{
  CGSize size = {45, 22};
  CGFloat expectedScale = 1.0;
  UIImage *image = RCTGetPlaceholderImage(size, nil);
  RCTAssertEqualSizes(size, image.size);
  XCTAssertEqual(expectedScale, image.scale);
}

- (void)testPlaceholderNonintegralSize
{
  CGSize size = {3.0/2, 7.0/3};
  CGFloat expectedScale = 6;
  CGSize pixelSize = {
    round(size.width * expectedScale),
    round(size.height * expectedScale)
  };
  UIImage *image = RCTGetPlaceholderImage(size, nil);
  RCTAssertEqualSizes(size, image.size);
  XCTAssertEqual(pixelSize.width, CGImageGetWidth(image.CGImage));
  XCTAssertEqual(pixelSize.height, CGImageGetHeight(image.CGImage));
  XCTAssertEqual(expectedScale, image.scale);
}

- (void)testPlaceholderSquareImage
{
  CGSize size = {333, 333};
  CGFloat expectedScale = 1.0/333;
  CGSize pixelSize = {1, 1};
  UIImage *image = RCTGetPlaceholderImage(size, nil);
  RCTAssertEqualSizes(size, image.size);
  XCTAssertEqual(pixelSize.width, CGImageGetWidth(image.CGImage));
  XCTAssertEqual(pixelSize.height, CGImageGetHeight(image.CGImage));
  XCTAssertEqual(expectedScale, image.scale);
}

- (void)testPlaceholderNonsquareImage
{
  CGSize size = {640, 480};
  CGFloat expectedScale = 1.0/160;
  CGSize pixelSize = {4, 3};
  UIImage *image = RCTGetPlaceholderImage(size, nil);
  RCTAssertEqualSizes(size, image.size);
  XCTAssertEqual(pixelSize.width, CGImageGetWidth(image.CGImage));
  XCTAssertEqual(pixelSize.height, CGImageGetHeight(image.CGImage));
  XCTAssertEqual(expectedScale, image.scale);
}

@end
