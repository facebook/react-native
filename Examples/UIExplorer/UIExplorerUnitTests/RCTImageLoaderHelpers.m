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

#import "RCTImageLoaderHelpers.h"

@implementation RCTConcreteImageURLLoader
{
  RCTImageURLLoaderCanLoadImageURLHandler _canLoadImageURLHandler;
  RCTImageURLLoaderLoadImageURLHandler _loadImageURLHandler;
  float _priority;
}

+ (NSString *)moduleName
{
  return nil;
}

- (instancetype)init
{
  return nil;
}

- (instancetype)initWithPriority:(float)priority canLoadImageURLHandler:(RCTImageURLLoaderCanLoadImageURLHandler)canLoadImageURLHandler loadImageURLHandler:(RCTImageURLLoaderLoadImageURLHandler)loadImageURLHandler
{
  if ((self = [super init])) {
    _canLoadImageURLHandler = [canLoadImageURLHandler copy];
    _loadImageURLHandler = [loadImageURLHandler copy];
    _priority = priority;
  }

  return self;
}

- (BOOL)canLoadImageURL:(NSURL *)requestURL
{
  return _canLoadImageURLHandler(requestURL);
}

- (RCTImageLoaderCancellationBlock)loadImageForURL:(NSURL *)imageURL
                                              size:(CGSize)size
                                             scale:(CGFloat)scale
                                        resizeMode:(RCTResizeMode)resizeMode
                                   progressHandler:(RCTImageLoaderProgressBlock)progressHandler
                                partialLoadHandler:(__unused RCTImageLoaderPartialLoadBlock)partialLoadHandler
                                 completionHandler:(RCTImageLoaderCompletionBlock)completionHandler
{
  return _loadImageURLHandler(imageURL, size, scale, resizeMode, progressHandler, completionHandler);
}

- (float)loaderPriority
{
  return _priority;
}

@end

@implementation RCTConcreteImageDecoder
{
  RCTImageDataDecoderCanDecodeImageDataHandler _canDecodeImageDataHandler;
  RCTImageDataDecoderDecodeImageDataHandler _decodeImageDataHandler;
  float _priority;
}

+ (NSString *)moduleName
{
  return nil;
}

- (instancetype)init
{
  return nil;
}

- (instancetype)initWithPriority:(float)priority canDecodeImageDataHandler:(RCTImageDataDecoderCanDecodeImageDataHandler)canDecodeImageDataHandler decodeImageDataHandler:(RCTImageDataDecoderDecodeImageDataHandler)decodeImageDataHandler
{
  if ((self = [super init])) {
    _canDecodeImageDataHandler = [canDecodeImageDataHandler copy];
    _decodeImageDataHandler = [decodeImageDataHandler copy];
    _priority = priority;
  }

  return self;
}

- (BOOL)canDecodeImageData:(NSData *)imageData
{
  return _canDecodeImageDataHandler(imageData);
}

- (RCTImageLoaderCancellationBlock)decodeImageData:(NSData *)imageData size:(CGSize)size scale:(CGFloat)scale resizeMode:(RCTResizeMode)resizeMode completionHandler:(RCTImageLoaderCompletionBlock)completionHandler
{
  return _decodeImageDataHandler(imageData, size, scale, resizeMode, completionHandler);
}

- (float)decoderPriority
{
  return _priority;
}

@end
