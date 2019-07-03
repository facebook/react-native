#import "RCTFileBundleLoader.h"

#import <sys/stat.h>

#import <cxxreact/IndexedRAMBundle.h>
#import <cxxreact/BasicBundle.h>
#import "NSDataBigString.h"
#import "RCTPerformanceLogger.h"
#import "RCTUtils.h"


NSString *const RCTFileBundleLoaderErrorDomain = @"RCTFileBundleLoaderErrorDomain";
static const int32_t JSNoBytecodeFileFormatVersion = -1;

//TODO FIGURE HOW TO THROW ERRORS HERE
namespace facebook {
  namespace react {

    RCTFileBundleLoader::RCTFileBundleLoader(RCTPerformanceLogger* performanceLogger) {
      _performanceLogger = performanceLogger;
    }
    
    std::unique_ptr<const Bundle> RCTFileBundleLoader::getBundle(std::string bundleURL) const {
      const uint32_t runtimeBCVersion = JSNoBytecodeFileFormatVersion;
      NSError *error;
      FILE *bundle = fopen(bundleURL.c_str(), "r");
      if (!bundle) {
        if (error) {
          error = [NSError errorWithDomain:RCTFileBundleLoaderErrorDomain
                                       code:RCTFileBundleLoaderErrorFailedOpeningFile
                                   userInfo:@{NSLocalizedDescriptionKey:
                                                [NSString stringWithFormat:@"Error opening bundle %s", bundleURL.c_str()]}];
        }
      }
      facebook::react::BundleHeader header;
      size_t readResult = fread(&header, sizeof(header), 1, bundle);
      fclose(bundle);
      if (readResult != 1) {
        if (error) {
          error = [NSError errorWithDomain:RCTFileBundleLoaderErrorDomain
                                       code:RCTFileBundleLoaderErrorFailedReadingFile
                                   userInfo:@{NSLocalizedDescriptionKey:
                                                [NSString stringWithFormat:@"Error reading bundle %s", bundleURL.c_str()]}];
        }
        return nil;
      }
      
      switch (facebook::react::Bundle::parseTypeFromHeader(header)) {
        case facebook::react::BundleType::IndexedRAMBundle: {
          struct stat statInfo;
          if (stat(bundleURL.c_str(), &statInfo) != 0) {
            if (error) {
              error = [NSError errorWithDomain:RCTFileBundleLoaderErrorDomain
                                          code:RCTFileBundleLoaderErrorFailedStatingFile
                                      userInfo:@{NSLocalizedDescriptionKey:
                                                   [NSString stringWithFormat:@"Error stating bundle %s", bundleURL.c_str()]}];
            }
            return nil;
          }
          
          [_performanceLogger markStartForTag:RCTPLRAMBundleLoad];
          auto ramBundle = std::make_unique<IndexedRAMBundle>(bundleURL.c_str(), bundleURL.c_str());
          std::unique_ptr<const JSBigString> startupScript = ramBundle->getStartupScript();
          [_performanceLogger markStopForTag:RCTPLRAMBundleLoad];
          [_performanceLogger setValue:startupScript->size() forTag:RCTPLRAMStartupCodeSize];
          return ramBundle;
        }
          break;
        case facebook::react::BundleType::DeltaBundle:
        case facebook::react::BundleType::FileRAMBundle:
          // Not sure if delta or file RAM bundles are supported on iOS
          return nil;
        case facebook::react::BundleType::BasicBundle: {
          NSData *source = [NSData dataWithContentsOfFile:[NSString stringWithUTF8String:bundleURL.c_str()]
                                                  options:NSDataReadingMappedIfSafe
                                                    error:&error];
          std::unique_ptr<const NSDataBigString> script = std::make_unique<const NSDataBigString>(source);
          return std::make_unique<BasicBundle>(std::move(script), bundleURL);
        }
         // WHAT IS IT FOR?
         case facebook::react::BundleType::BCBundle:{
           if (runtimeBCVersion == JSNoBytecodeFileFormatVersion || runtimeBCVersion < 0) {
             if (error) {
               error = [NSError errorWithDomain:RCTFileBundleLoaderErrorDomain
                                            code:RCTFileBundleLoaderErrorBCNotSupported
                                        userInfo:@{NSLocalizedDescriptionKey:
                                                     @"Bytecode bundles are not supported by this runtime."}];
             }
             return nil;
           }
           else if ((uint32_t)runtimeBCVersion != header.version) {
             if (error) {
               NSString *errDesc =
               [NSString stringWithFormat:@"BC Version Mismatch. Expect: %d, Actual: %u",
                runtimeBCVersion, header.version];
              
               error = [NSError errorWithDomain:RCTFileBundleLoaderErrorDomain
                                            code:RCTFileBundleLoaderErrorBCVersion
                                        userInfo:@{NSLocalizedDescriptionKey: errDesc}];
             }
             return nil;
           }
           break;
         }
      }
      return  nil;
    }
    
    std::string RCTFileBundleLoader::getBundleURLFromName(std::string bundleName) const {
      return std::string([
                          [[NSBundle mainBundle]
                            URLForResource: [NSString stringWithUTF8String:bundleName.c_str()]
                            withExtension:@"jsbundle"]
                          .path UTF8String]);
    }
  } // namespace react
} // namespace facebook
