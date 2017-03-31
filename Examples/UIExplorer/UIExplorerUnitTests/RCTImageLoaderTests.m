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

#import <React/RCTBridge.h>
#import <React/RCTImageLoader.h>

#import "RCTImageLoaderHelpers.h"

unsigned char blackGIF[] = {
  0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00, 0x01, 0x00, 0x80, 0x00,
  0x00, 0x00, 0x00, 0x00, 0xff, 0xff, 0xff, 0x2c, 0x00, 0x00, 0x00, 0x00,
  0x01, 0x00, 0x01, 0x00, 0x00, 0x02, 0x02, 0x44, 0x01, 0x00, 0x3b
};

RCTDefineImageURLLoader(RCTImageLoaderTestsURLLoader1)
RCTDefineImageURLLoader(RCTImageLoaderTestsURLLoader2)
RCTDefineImageDecoder(RCTImageLoaderTestsDecoder1)
RCTDefineImageDecoder(RCTImageLoaderTestsDecoder2)

@interface RCTImageLoaderTests : XCTestCase

@end

@implementation RCTImageLoaderTests {
  NSURL *_bundleURL;
}

- (void)setUp
{
  NSBundle *bundle = [NSBundle bundleForClass:[self class]];
  _bundleURL = [bundle URLForResource:@"UIExplorerUnitTestsBundle" withExtension:@"js"];
}

- (void)testImageLoading
{
  UIImage *image = [UIImage new];

  id<RCTImageURLLoader> loader = [[RCTImageLoaderTestsURLLoader1 alloc] initWithPriority:1.0 canLoadImageURLHandler:^BOOL(__unused NSURL *requestURL) {
    return YES;
  } loadImageURLHandler:^RCTImageLoaderCancellationBlock(__unused NSURL *imageURL, __unused CGSize size, __unused CGFloat scale, __unused RCTResizeMode resizeMode, RCTImageLoaderProgressBlock progressHandler, RCTImageLoaderCompletionBlock completionHandler) {
    progressHandler(1, 1);
    completionHandler(nil, image);
    return nil;
  }];

  NS_VALID_UNTIL_END_OF_SCOPE RCTBridge *bridge = [[RCTBridge alloc] initWithBundleURL:_bundleURL moduleProvider:^{ return @[loader]; } launchOptions:nil];

  NSURLRequest *urlRequest = [NSURLRequest requestWithURL:[NSURL URLWithString:@"https://facebook.github.io/react/img/logo_og.png"]];
  [bridge.imageLoader loadImageWithURLRequest:urlRequest size:CGSizeMake(100, 100) scale:1.0 clipped:YES resizeMode:RCTResizeModeContain progressBlock:^(int64_t progress, int64_t total) {
    XCTAssertEqual(progress, 1);
    XCTAssertEqual(total, 1);
  } partialLoadBlock:nil completionBlock:^(NSError *loadError, id loadedImage) {
    XCTAssertEqualObjects(loadedImage, image);
    XCTAssertNil(loadError);
  }];
}

- (void)testImageLoaderUsesImageURLLoaderWithHighestPriority
{
  UIImage *image = [UIImage new];

  id<RCTImageURLLoader> loader1 = [[RCTImageLoaderTestsURLLoader1 alloc] initWithPriority:1.0 canLoadImageURLHandler:^BOOL(__unused NSURL *requestURL) {
    return YES;
  } loadImageURLHandler:^RCTImageLoaderCancellationBlock(__unused NSURL *imageURL, __unused CGSize size, __unused CGFloat scale, __unused RCTResizeMode resizeMode, RCTImageLoaderProgressBlock progressHandler, RCTImageLoaderCompletionBlock completionHandler) {
    progressHandler(1, 1);
    completionHandler(nil, image);
    return nil;
  }];

  id<RCTImageURLLoader> loader2 = [[RCTImageLoaderTestsURLLoader2 alloc] initWithPriority:0.5 canLoadImageURLHandler:^BOOL(__unused NSURL *requestURL) {
    return YES;
  } loadImageURLHandler:^RCTImageLoaderCancellationBlock(__unused NSURL *imageURL, __unused CGSize size, __unused CGFloat scale, __unused RCTResizeMode resizeMode, __unused RCTImageLoaderProgressBlock progressHandler, __unused RCTImageLoaderCompletionBlock completionHandler) {
    XCTFail(@"Should not have used loader2");
    return nil;
  }];

  NS_VALID_UNTIL_END_OF_SCOPE RCTBridge *bridge = [[RCTBridge alloc] initWithBundleURL:_bundleURL moduleProvider:^{ return @[loader1, loader2]; } launchOptions:nil];

  NSURLRequest *urlRequest = [NSURLRequest requestWithURL:[NSURL URLWithString:@"https://facebook.github.io/react/img/logo_og.png"]];
  [bridge.imageLoader loadImageWithURLRequest:urlRequest size:CGSizeMake(100, 100) scale:1.0 clipped:YES resizeMode:RCTResizeModeContain progressBlock:^(int64_t progress, int64_t total) {
    XCTAssertEqual(progress, 1);
    XCTAssertEqual(total, 1);
  } partialLoadBlock:nil completionBlock:^(NSError *loadError, id loadedImage) {
    XCTAssertEqualObjects(loadedImage, image);
    XCTAssertNil(loadError);
  }];
}

- (void)testImageDecoding
{
  NSData *data = [NSData dataWithBytesNoCopy:blackGIF length:sizeof(blackGIF) freeWhenDone:NO];
  UIImage *image = [[UIImage alloc] initWithData:data];

  id<RCTImageDataDecoder> decoder = [[RCTImageLoaderTestsDecoder1 alloc] initWithPriority:1.0 canDecodeImageDataHandler:^BOOL(__unused NSData *imageData) {
    return YES;
  } decodeImageDataHandler:^RCTImageLoaderCancellationBlock(NSData *imageData, __unused CGSize size, __unused CGFloat scale, __unused RCTResizeMode resizeMode, RCTImageLoaderCompletionBlock completionHandler) {
    XCTAssertEqualObjects(imageData, data);
    completionHandler(nil, image);
    return nil;
  }];

  NS_VALID_UNTIL_END_OF_SCOPE RCTBridge *bridge = [[RCTBridge alloc] initWithBundleURL:_bundleURL moduleProvider:^{ return @[decoder]; } launchOptions:nil];

  RCTImageLoaderCancellationBlock cancelBlock = [bridge.imageLoader decodeImageData:data size:CGSizeMake(1, 1) scale:1.0 clipped:NO resizeMode:RCTResizeModeStretch completionBlock:^(NSError *decodeError, id decodedImage) {
    XCTAssertEqualObjects(decodedImage, image);
    XCTAssertNil(decodeError);
  }];
  XCTAssertNotNil(cancelBlock);
}

- (void)testImageLoaderUsesImageDecoderWithHighestPriority
{
  NSData *data = [NSData dataWithBytesNoCopy:blackGIF length:sizeof(blackGIF) freeWhenDone:NO];
  UIImage *image = [[UIImage alloc] initWithData:data];

  id<RCTImageDataDecoder> decoder1 = [[RCTImageLoaderTestsDecoder1 alloc] initWithPriority:1.0 canDecodeImageDataHandler:^BOOL(__unused NSData *imageData) {
    return YES;
  } decodeImageDataHandler:^RCTImageLoaderCancellationBlock(NSData *imageData, __unused CGSize size, __unused CGFloat scale, __unused RCTResizeMode resizeMode, RCTImageLoaderCompletionBlock completionHandler) {
    XCTAssertEqualObjects(imageData, data);
    completionHandler(nil, image);
    return nil;
  }];

  id<RCTImageDataDecoder> decoder2 = [[RCTImageLoaderTestsDecoder2 alloc] initWithPriority:0.5 canDecodeImageDataHandler:^BOOL(__unused NSData *imageData) {
    return YES;
  } decodeImageDataHandler:^RCTImageLoaderCancellationBlock(__unused NSData *imageData, __unused CGSize size, __unused CGFloat scale, __unused RCTResizeMode resizeMode, __unused RCTImageLoaderCompletionBlock completionHandler) {
    XCTFail(@"Should not have used decoder2");
    return nil;
  }];

  NS_VALID_UNTIL_END_OF_SCOPE RCTBridge *bridge = [[RCTBridge alloc] initWithBundleURL:_bundleURL moduleProvider:^{ return @[decoder1, decoder2]; } launchOptions:nil];

  RCTImageLoaderCancellationBlock cancelBlock = [bridge.imageLoader decodeImageData:data size:CGSizeMake(1, 1) scale:1.0 clipped:NO resizeMode:RCTResizeModeStretch completionBlock:^(NSError *decodeError, id decodedImage) {
    XCTAssertEqualObjects(decodedImage, image);
    XCTAssertNil(decodeError);
  }];
  XCTAssertNotNil(cancelBlock);
}

@end
