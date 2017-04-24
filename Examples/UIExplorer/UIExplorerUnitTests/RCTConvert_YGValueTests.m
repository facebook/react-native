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

#import <React/RCTConvert.h>

@interface RCTConvert_YGValueTests : XCTestCase

@end

@implementation RCTConvert_YGValueTests

- (void)testUndefined
{
  YGValue value = [RCTConvert YGValue:nil];
  XCTAssertEqual(value.unit, YGUnitUndefined);
}

- (void)testNumberPoints
{
  YGValue value = [RCTConvert YGValue:@100];
  XCTAssertEqual(value.unit, YGUnitPoint);
  XCTAssertEqual(value.value, 100);
}

- (void)testStringPercent
{
  YGValue value = [RCTConvert YGValue:@"100%"];
  XCTAssertEqual(value.unit, YGUnitPercent);
  XCTAssertEqual(value.value, 100);
}

@end
