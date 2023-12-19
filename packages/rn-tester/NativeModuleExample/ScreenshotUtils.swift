import React

@objc(ScreenshotUtils)
public class ScreenshotUtils: NSObject {
  @objc public static func getImageData(_ image: UIImage, format: String, options: Dictionary<String, Any>) -> NSData? {
    var data: NSData?
    if format == "png" {
      data = image.pngData()! as NSData
    } else if format == "jpeg" {
      let quality = RCTConvert.cgFloat(options["quality"] ?? 1)
        data = image.jpegData(compressionQuality: quality)! as NSData
    } else {
      RCTMakeAndLogError("Unsupported image format: \(format)", nil, nil)
      return nil
    }

    return data
  }
}
