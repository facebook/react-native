Pod::Spec.new do |spec|
  spec.name         = 'ReactKit'
  spec.version      = '0.0.1'
  spec.summary      = 'An implementation of React that targets UIKit for iOS'
  spec.description  = <<-DESC
    Our first React Native implementation is ReactKit, targeting iOS. We are also working on an Android implementation which we will release later. ReactKit apps are built using the React JS framework, and render directly to native UIKit elements using a fully asynchronous architecture. There is no browser and no HTML. We have picked what we think is the best set of features from these and other technologies to build what we hope to become the best product development framework available, with an emphasis on iteration speed, developer delight, continuity of technology, and absolutely beautiful and fast products with no compromises in quality or capability.
                   DESC
  spec.homepage     = 'https://facebook.github.io/react-native/'
  spec.license      = { :type => 'BSD' }
  spec.author       = 'Facebook'
  spec.platform     = :ios, '7.0'
  spec.requires_arc = true
  spec.source_files  = '**/*.{h,m,c}'
  spec.public_header_files = "**/*.h"
  #spec.library = "ReactKit"
end
