module Pod
  module Generator
    # Stores the common logic for creating app targets within projects including
    # generating standard import and main files for app hosts.
    #
    module AppTargetHelper
      # Adds a single app target to the given project with the provided name.
      #
      # @param  [Project] project
      #         the Xcodeproj to generate the target into.
      #
      # @param  [Symbol] platform_name
      #         the platform of the target. Can be `:ios` or `:osx`, etc.
      #
      # @param  [String] deployment_target
      #         the deployment target for the platform.
      #
      # @param  [String] name
      #         The name to use for the target, defaults to 'App'.
      #
      # @param  [String] product_basename
      #         The product basename to use for the target, defaults to `name`.
      #
      # @return [PBXNativeTarget] the new target that was created.
      #
      def self.add_app_target(project, platform_name, deployment_target, name = 'App', product_basename = nil)
        project.new_target(:application, name, platform_name, deployment_target, nil,
                           nil, product_basename)
      end

      # Creates and links an import file for the given pod target and into the given native target.
      #
      # @param  [Project] project
      #         the Xcodeproj to generate the target into.
      #
      # @param  [PBXNativeTarget] target
      #         the native target to link the generated import file into.
      #
      # @param  [PodTarget] pod_target
      #         the pod target to use for when generating the contents of the import file.
      #
      # @param  [Symbol] platform
      #         the platform of the target. Can be `:ios` or `:osx`, etc.
      #
      # @param  [String] name
      #         The name to use for the target, defaults to 'App'.
      #
      # @return [Array<PBXBuildFile>] the created build file references.
      #
      def self.add_app_project_import(project, target, pod_target, platform, name = 'App')
        source_file = AppTargetHelper.create_app_import_source_file(project, pod_target, platform, name)
        group = project[name] || project.new_group(name, name)
        source_file_ref = group.new_file(source_file)
        target.add_file_references([source_file_ref])
      end

      # Creates and links an empty Swift file for the given target.
      #
      # @param  [Project] project
      #         the Xcodeproj to generate the target into.
      #
      # @param  [PBXNativeTarget] target
      #         the native target to link the generated import file into.
      #
      # @param  [String] name
      #         The name to use for the target, defaults to 'App'.
      #
      # @return [Array<PBXBuildFile>] the created build file references.
      #
      def self.add_empty_swift_file(project, target, name = 'App')
        swift_file = project.path.dirname.+("#{name}/dummy.swift")
        swift_file.parent.mkpath
        File.write(swift_file, '')
        group = project[name] || project.new_group(name, name)
        swift_file_ref = group.new_file(swift_file)
        target.add_file_references([swift_file_ref])
      end

      # Creates and links a default app host 'main.m' file.
      #
      # @param  [Project] project
      #         the Xcodeproj to generate the main file into.
      #
      # @param  [PBXNativeTarget] target
      #         the native target to link the generated main file into.
      #
      # @param  [Symbol] platform
      #         the platform of the target. Can be `:ios` or `:osx`, etc.
      #
      # @param  [String] name
      #         The name to use for the target, defaults to 'App'.
      #
      # @return [Array<PBXBuildFile>] the created build file references.
      #
      def self.add_app_host_main_file(project, target, platform, group, name = 'App')
        source_file = AppTargetHelper.create_app_host_main_file(project, platform, name)
        source_file_ref = group.new_file(source_file)
        target.add_file_references([source_file_ref])
      end

      # Creates a default launchscreen storyboard.
      #
      # @param  [Project] project
      #         the Xcodeproj to generate the launchscreen storyboard into.
      #
      # @param  [PBXNativeTarget] target
      #         the native target to link the generated launchscreen storyboard into.
      #
      # @param  [Symbol] platform
      #         the platform of the target. Can be `:ios` or `:osx`, etc.
      #
      # @param  [String] deployment_target
      #         the deployment target for the platform.
      #
      # @param  [String] name
      #         The name to use for the target, defaults to 'App'.
      #
      # @return [PBXFileReference] the created file reference of the launchscreen storyboard.
      #
      def self.add_launchscreen_storyboard(project, target, group, deployment_target, name = 'App')
        launch_storyboard_file = AppTargetHelper.create_launchscreen_storyboard_file(project, deployment_target, name)
        launch_storyboard_ref = group.new_file(launch_storyboard_file)
        target.resources_build_phase.add_file_reference(launch_storyboard_ref)
      end

      # Adds the xctest framework search paths into the given target.
      #
      # @param  [PBXNativeTarget] target
      #         the native target to add XCTest into.
      #
      # @return [void]
      #
      def self.add_xctest_search_paths(target)
        requires_libs = target.platform_name == :ios &&
          Version.new(target.deployment_target) < Version.new('12.2')

        target.build_configurations.each do |configuration|
          framework_search_paths = configuration.build_settings['FRAMEWORK_SEARCH_PATHS'] ||= '$(inherited)'
          framework_search_paths << ' "$(PLATFORM_DIR)/Developer/Library/Frameworks"'

          if requires_libs
            library_search_paths = configuration.build_settings['LIBRARY_SEARCH_PATHS'] ||= '$(inherited)'
            library_search_paths << ' "$(PLATFORM_DIR)/Developer/usr/lib"'
          end
        end
      end

      # Adds the provided swift version into the given target.
      #
      # @param  [PBXNativeTarget] target
      #         the native target to add the swift version into.
      #
      # @param  [String] swift_version
      #         the swift version to set to.
      #
      # @return [void]
      #
      def self.add_swift_version(target, swift_version)
        raise 'Cannot set empty Swift version to target.' if swift_version.blank?
        target.build_configurations.each do |configuration|
          configuration.build_settings['SWIFT_VERSION'] = swift_version
        end
      end

      # Creates a default import file for the given pod target.
      #
      # @param  [Project] project
      #         the Xcodeproj to generate the target into.
      #
      # @param  [PodTarget] pod_target
      #         the pod target to use for when generating the contents of the import file.
      #
      # @param  [Symbol] platform
      #         the platform of the target. Can be `:ios` or `:osx`, etc.
      #
      # @param  [String] name
      #         The name of the folder to use and save the generated main file.
      #
      # @return [Pathname] the new source file that was generated.
      #
      def self.create_app_import_source_file(project, pod_target, platform, name = 'App')
        language = pod_target.uses_swift? ? :swift : :objc

        if language == :swift
          source_file = project.path.dirname.+("#{name}/main.swift")
          source_file.parent.mkpath
          import_statement = pod_target.should_build? && pod_target.defines_module? ? "import #{pod_target.product_module_name}\n" : ''
          source_file.open('w') { |f| f << import_statement }
        else
          source_file = project.path.dirname.+("#{name}/main.m")
          source_file.parent.mkpath
          import_statement = if pod_target.should_build? && pod_target.defines_module?
                               "@import #{pod_target.product_module_name};\n"
                             else
                               header_name = "#{pod_target.product_module_name}/#{pod_target.product_module_name}.h"
                               if pod_target.sandbox.public_headers.root.+(header_name).file?
                                 "#import <#{header_name}>\n"
                               else
                                 ''
                               end
                             end
          source_file.open('w') do |f|
            f << "@import Foundation;\n"
            f << "@import UIKit;\n" if platform == :ios || platform == :tvos
            f << "@import Cocoa;\n" if platform == :osx
            f << "#{import_statement}int main(void) {}\n"
          end
        end
        source_file
      end

      # Creates a default launchscreen storyboard file.
      #
      # @param  [Project] project
      #         the Xcodeproj to generate the launchscreen storyboard into.
      #
      # @param  [String] deployment_target
      #         the deployment target for the platform.
      #
      # @param  [String] name
      #         The name of the folder to use and save the generated launchscreen storyboard file.
      #
      # @return [Pathname] the new launchscreen storyboard file that was generated.
      #
      def self.create_launchscreen_storyboard_file(project, deployment_target, name = 'App')
        launch_storyboard_file = project.path.dirname.+("#{name}/LaunchScreen.storyboard")
        launch_storyboard_file.parent.mkpath
        if Version.new(deployment_target) >= Version.new('9.0')
          File.write(launch_storyboard_file, LAUNCHSCREEN_STORYBOARD_CONTENTS)
        else
          File.write(launch_storyboard_file, LAUNCHSCREEN_STORYBOARD_CONTENTS_IOS_8)
        end
        launch_storyboard_file
      end

      # Creates a default app host 'main.m' file.
      #
      # @param  [Project] project
      #         the Xcodeproj to generate the target into.
      #
      # @param  [Symbol] platform
      #         the platform of the target. Can be `:ios` or `:osx`.
      #
      # @param  [String] name
      #         The name of the folder to use and save the generated main file.
      #
      # @return [Pathname] the new source file that was generated.
      #
      def self.create_app_host_main_file(project, platform, name = 'App')
        source_file = project.path.dirname.+("#{name}/main.m")
        source_file.parent.mkpath
        source_file.open('w') do |f|
          case platform
          when :ios, :tvos
            f << IOS_APP_HOST_MAIN_CONTENTS
          when :osx
            f << MACOS_APP_HOST_MAIN_CONTENTS
          end
        end
        source_file
      end

      IOS_APP_HOST_MAIN_CONTENTS = <<EOS.freeze
#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>

@interface CPTestAppHostAppDelegate : UIResponder <UIApplicationDelegate>

@property (nonatomic, strong) UIWindow *window;

@end

@implementation CPTestAppHostAppDelegate

- (BOOL)application:(UIApplication *)__unused application didFinishLaunchingWithOptions:(NSDictionary *)__unused launchOptions
{
    self.window = [[UIWindow alloc] initWithFrame:[[UIScreen mainScreen] bounds]];
    self.window.rootViewController = [UIViewController new];

    [self.window makeKeyAndVisible];

    return YES;
}

@end

int main(int argc, char *argv[])
{
    @autoreleasepool
    {
        return UIApplicationMain(argc, argv, nil, NSStringFromClass([CPTestAppHostAppDelegate class]));
    }
}
EOS

      MACOS_APP_HOST_MAIN_CONTENTS = <<EOS.freeze
#import <Cocoa/Cocoa.h>

int main(int argc, const char * argv[]) {
    return NSApplicationMain(argc, argv);
}
EOS

      LAUNCHSCREEN_STORYBOARD_CONTENTS_IOS_8 = <<-XML.strip_heredoc.freeze
              <?xml version="1.0" encoding="UTF-8" standalone="no"?>
              <document type="com.apple.InterfaceBuilder3.CocoaTouch.Storyboard.XIB" version="3.0" toolsVersion="13122.16" systemVersion="17A277" targetRuntime="iOS.CocoaTouch" propertyAccessControl="none" useAutolayout="YES" launchScreen="YES" useTraitCollections="YES" colorMatched="YES" initialViewController="01J-lp-oVM">
                <dependencies>
                  <plugIn identifier="com.apple.InterfaceBuilder.IBCocoaTouchPlugin" version="13104.12"/>
                  <capability name="documents saved in the Xcode 8 format" minToolsVersion="8.0"/>
                </dependencies>
                <scenes>
                  <!--View Controller-->
                  <scene sceneID="EHf-IW-A2E">
                    <objects>
                      <viewController id="01J-lp-oVM" sceneMemberID="viewController">
                        <layoutGuides>
                          <viewControllerLayoutGuide type="top" id="rUq-ht-380"/>
                          <viewControllerLayoutGuide type="bottom" id="a9l-8d-mfx"/>
                        </layoutGuides>
                        <view key="view" contentMode="scaleToFill" id="Ze5-6b-2t3">
                          <rect key="frame" x="0.0" y="0.0" width="375" height="667"/>
                          <autoresizingMask key="autoresizingMask" widthSizable="YES" heightSizable="YES"/>
                          <color key="backgroundColor" red="1" green="1" blue="1" alpha="1" colorSpace="custom" customColorSpace="sRGB"/>
                        </view>
                      </viewController>
                      <placeholder placeholderIdentifier="IBFirstResponder" id="iYj-Kq-Ea1" userLabel="First Responder" sceneMemberID="firstResponder"/>
                    </objects>
                    <point key="canvasLocation" x="53" y="375"/>
                  </scene>
                </scenes>
              </document>
      XML

      LAUNCHSCREEN_STORYBOARD_CONTENTS = <<-XML.strip_heredoc.freeze
              <?xml version="1.0" encoding="UTF-8" standalone="no"?>
              <document type="com.apple.InterfaceBuilder3.CocoaTouch.Storyboard.XIB" version="3.0" toolsVersion="13122.16" systemVersion="17A277" targetRuntime="iOS.CocoaTouch" propertyAccessControl="none" useAutolayout="YES" launchScreen="YES" useTraitCollections="YES" useSafeAreas="YES" colorMatched="YES" initialViewController="01J-lp-oVM">
                <dependencies>
                  <plugIn identifier="com.apple.InterfaceBuilder.IBCocoaTouchPlugin" version="13104.12"/>
                  <capability name="Safe area layout guides" minToolsVersion="9.0"/>
                  <capability name="documents saved in the Xcode 8 format" minToolsVersion="8.0"/>
                </dependencies>
                <scenes>
                  <!--View Controller-->
                  <scene sceneID="EHf-IW-A2E">
                    <objects>
                      <viewController id="01J-lp-oVM" sceneMemberID="viewController">
                        <view key="view" contentMode="scaleToFill" id="Ze5-6b-2t3">
                          <rect key="frame" x="0.0" y="0.0" width="375" height="667"/>
                          <autoresizingMask key="autoresizingMask" widthSizable="YES" heightSizable="YES"/>
                          <color key="backgroundColor" red="1" green="1" blue="1" alpha="1" colorSpace="custom" customColorSpace="sRGB"/>
                          <viewLayoutGuide key="safeArea" id="6Tk-OE-BBY"/>
                        </view>
                      </viewController>
                      <placeholder placeholderIdentifier="IBFirstResponder" id="iYj-Kq-Ea1" userLabel="First Responder" sceneMemberID="firstResponder"/>
                    </objects>
                    <point key="canvasLocation" x="53" y="375"/>
                  </scene>
                </scenes>
              </document>
      XML
    end
  end
end
