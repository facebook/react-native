//
//  Created by Gabriel Handford on 3/1/09.
//  Copyright 2009-2013. All rights reserved.
//  Created by John Boiles on 10/20/11.
//  Copyright (c) 2011. All rights reserved
//  Modified by Felix Schulze on 2/11/13.
//  Copyright 2013. All rights reserved.
//
//  Permission is hereby granted, free of charge, to any person
//  obtaining a copy of this software and associated documentation
//  files (the "Software"), to deal in the Software without
//  restriction, including without limitation the rights to use,
//  copy, modify, merge, publish, distribute, sublicense, and/or sell
//  copies of the Software, and to permit persons to whom the
//  Software is furnished to do so, subject to the following
//  conditions:
//
//  The above copyright notice and this permission notice shall be
//  included in all copies or substantial portions of the Software.
//
//  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
//  EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
//  OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
//  NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
//  HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
//  WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
//  FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
//  OTHER DEALINGS IN THE SOFTWARE.
//

#import "UIImage+Compare.h"

@implementation UIImage (Compare)

- (BOOL)compareWithImage:(UIImage *)image
{
  NSAssert(CGSizeEqualToSize(self.size, image.size), @"Images must be same size.");

  CGImageRef imageRef = UIImageGetCGImageRef(image); // TODO(macOS ISS#2323203)
  
  // The images have the equal size, so we could use the smallest amount of bytes because of byte padding
  size_t minBytesPerRow = MIN(CGImageGetBytesPerRow(imageRef), CGImageGetBytesPerRow(imageRef)); // TODO(macOS ISS#2323203)
  size_t referenceImageSizeBytes = CGImageGetHeight(imageRef) * minBytesPerRow; // TODO(macOS ISS#2323203)
  void *referenceImagePixels = calloc(1, referenceImageSizeBytes);
  void *imagePixels = calloc(1, referenceImageSizeBytes);

  if (!referenceImagePixels || !imagePixels) {
    free(referenceImagePixels);
    free(imagePixels);
    return NO;
  }

  CGContextRef referenceImageContext = CGBitmapContextCreate(referenceImagePixels,
                                                             CGImageGetWidth(imageRef), // TODO(macOS ISS#2323203)
                                                             CGImageGetHeight(imageRef), // TODO(macOS ISS#2323203)
                                                             CGImageGetBitsPerComponent(imageRef), // TODO(macOS ISS#2323203)
                                                             minBytesPerRow,
                                                             CGImageGetColorSpace(imageRef), // TODO(macOS ISS#2323203)
                                                             (CGBitmapInfo)kCGImageAlphaPremultipliedLast
                                                             );
  CGContextRef imageContext = CGBitmapContextCreate(imagePixels,
                                                    CGImageGetWidth(imageRef), // TODO(macOS ISS#2323203)
                                                    CGImageGetHeight(imageRef), // TODO(macOS ISS#2323203)
                                                    CGImageGetBitsPerComponent(imageRef), // TODO(macOS ISS#2323203)
                                                    minBytesPerRow,
                                                    CGImageGetColorSpace(imageRef), // TODO(macOS ISS#2323203)
                                                    (CGBitmapInfo)kCGImageAlphaPremultipliedLast
                                                    );

#if !TARGET_OS_OSX // TODO(macOS ISS#2323203)
  CGFloat scaleFactor = [UIScreen mainScreen].scale;
#else // [TODO(macOS ISS#2323203)
  // The compareWithImage: method is used for integration test snapshot image comparison.
  // The _snapshotView: method that creates snapshot images that are *not* scaled for the screen.
  // By not using the screen scale factor in this method the test results are machine independent.
  CGFloat scaleFactor = 1;
#endif // ]TODO(macOS ISS#2323203)

  CGContextScaleCTM(referenceImageContext, scaleFactor, scaleFactor);
  CGContextScaleCTM(imageContext, scaleFactor, scaleFactor);

  if (!referenceImageContext || !imageContext) {
    CGContextRelease(referenceImageContext);
    CGContextRelease(imageContext);
    free(referenceImagePixels);
    free(imagePixels);
    return NO;
  }

  CGContextDrawImage(referenceImageContext, CGRectMake(0.0f, 0.0f, self.size.width, self.size.height), imageRef); // TODO(macOS ISS#2323203)
  CGContextDrawImage(imageContext, CGRectMake(0.0f, 0.0f, image.size.width, image.size.height), imageRef); // TODO(macOS ISS#2323203)
  CGContextRelease(referenceImageContext);
  CGContextRelease(imageContext);

  BOOL imageEqual = (memcmp(referenceImagePixels, imagePixels, referenceImageSizeBytes) == 0);
  free(referenceImagePixels);
  free(imagePixels);
  return imageEqual;
}

@end
