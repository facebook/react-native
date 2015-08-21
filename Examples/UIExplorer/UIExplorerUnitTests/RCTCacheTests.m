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
#import "RCTCache.h"

// Silence silly sign warnings when using int literals
#pragma clang diagnostic ignored "-Wsign-compare"

@interface RCTCache (Private)

- (void)cleanUpAllObjects;
- (void)resequence;
- (NSDictionary *)cache;
- (void)setSequenceNumber:(NSInteger)number;

@end

@interface RCTCacheTests : XCTestCase

@property (nonatomic, strong) RCTCache *cache;

@end

@implementation RCTCacheTests

- (void)setUp
{
  self.cache = [RCTCache new];
  self.cache.countLimit = 3;
  self.cache.totalCostLimit = 100;
}

- (void)tearDown
{
  self.cache = nil;
}

- (void)testInsertion
{
  [self.cache setObject:@1 forKey:@"foo" cost:1];
  [self.cache setObject:@2 forKey:@"bar" cost:2];
  [self.cache setObject:@3 forKey:@"baz" cost:3];

  XCTAssertEqual([self.cache count], 3);
  XCTAssertEqual([self.cache totalCost], 6);
}

- (void)testRemoval
{
  [self.cache setObject:@1 forKey:@"foo" cost:1];
  [self.cache setObject:@2 forKey:@"bar" cost:2];
  [self.cache setObject:@3 forKey:@"baz" cost:3];

  [self.cache removeObjectForKey:@"bar"];

  XCTAssertEqual([self.cache count], 2);
  XCTAssertNil([self.cache objectForKey:@"bar"]);
}

- (void)testCountEviction
{
  [self.cache setObject:@1 forKey:@"foo"];
  [self.cache setObject:@2 forKey:@"bar"];
  [self.cache setObject:@3 forKey:@"baz"];
  [self.cache setObject:@4 forKey:@"bam"];

  XCTAssertEqual([self.cache count], 3);
  XCTAssertNil([self.cache objectForKey:@"foo"]);

  [self.cache setObject:@5 forKey:@"boo"];

  XCTAssertEqual([self.cache count], 3);
  XCTAssertNil([self.cache objectForKey:@"bar"]);
}

- (void)testCostEviction
{
  [self.cache setObject:@1 forKey:@"foo" cost:99];
  [self.cache setObject:@2 forKey:@"bar" cost:2];

  XCTAssertEqual([self.cache count], 1);
  XCTAssertEqual([self.cache totalCost], 2);
  XCTAssertNil([self.cache objectForKey:@"foo"]);

  [self.cache setObject:@3 forKey:@"baz" cost:999];

  XCTAssertEqual([self.cache count], 0);
  XCTAssertEqual([self.cache totalCost], 0);
}

- (void)testCleanup
{
  [self.cache setObject:@1 forKey:@"foo"];
  [self.cache setObject:@2 forKey:@"bar"];
  [self.cache setObject:@3 forKey:@"baz"];

  //simulate memory warning
  [self.cache cleanUpAllObjects];

  XCTAssertEqual([self.cache count], 0);
  XCTAssertEqual([self.cache totalCost], 0);
}

- (void)testResequence
{
  [self.cache setObject:@1 forKey:@"foo"];
  [self.cache setObject:@2 forKey:@"bar"];
  [self.cache setObject:@3 forKey:@"baz"];

  [self.cache resequence];

  NSDictionary *innerCache = [self.cache cache];
  XCTAssertEqualObjects([innerCache[@"foo"] valueForKey:@"sequenceNumber"], @0);
  XCTAssertEqualObjects([innerCache[@"bar"] valueForKey:@"sequenceNumber"], @1);
  XCTAssertEqualObjects([innerCache[@"baz"] valueForKey:@"sequenceNumber"], @2);

  [self.cache removeObjectForKey:@"foo"];
  [self.cache resequence];

  XCTAssertEqualObjects([innerCache[@"bar"] valueForKey:@"sequenceNumber"], @0);
  XCTAssertEqualObjects([innerCache[@"baz"] valueForKey:@"sequenceNumber"], @1);
}

- (void)testResequenceTrigger
{
  [self.cache setObject:@1 forKey:@"foo"];
  [self.cache setObject:@2 forKey:@"bar"];

  //first object should now be bar with sequence number of 1
  [self.cache removeObjectForKey:@"foo"];

  //should trigger resequence
  [self.cache setSequenceNumber:NSIntegerMax];
  [self.cache setObject:@3 forKey:@"baz"];

  NSDictionary *innerCache = [self.cache cache];
  XCTAssertEqualObjects([innerCache[@"bar"] valueForKey:@"sequenceNumber"], @0);
  XCTAssertEqualObjects([innerCache[@"baz"] valueForKey:@"sequenceNumber"], @1);

  //first object should now be baz with sequence number of 1
  [self.cache removeObjectForKey:@"bar"];

  //should also trigger resequence
  [self.cache setSequenceNumber:NSIntegerMax];
  [self.cache objectForKey:@"baz"];

  XCTAssertEqualObjects([innerCache[@"baz"] valueForKey:@"sequenceNumber"], @0);
}

- (void)testName
{
  self.cache.name = @"Hello";
  XCTAssertEqualObjects(self.cache.name, @"Hello");
}

@end
