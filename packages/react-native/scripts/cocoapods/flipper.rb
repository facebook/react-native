# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# Default versions of Flipper and related dependencies.
# Update this map to bump the dependencies.
$flipper_default_versions = {
    'Flipper' => '0.201.0',
    'Flipper-Boost-iOSX' => '1.76.0.1.11',
    'Flipper-DoubleConversion' => '3.2.0.1',
    'Flipper-Fmt' => '7.1.7',
    'Flipper-Folly' => '2.6.10',
    'Flipper-Glog' => '0.5.0.5',
    'Flipper-PeerTalk' => '0.0.4',
    'OpenSSL-Universal' => '1.1.1100',
}

# This function installs the `React-Core/DevSupport` subpods
# when the dependencies are installed for a non production app.
#
# @parameter pathToReactNative: the path to the React Native installation
def install_flipper_dependencies(pathToReactNative)
    pod 'React-Core/DevSupport', :path => "#{pathToReactNative}/"
end


# This function installs all the dependencies required by flipper.
#
# @parameter versions: a dictionary to specify a version of a dependencies. Default versions will be used if not specified
# @parameter configurations: an array of configurations to install the flipper dependencies. Defaults to ['Debug'].
def use_flipper_pods(versions = {}, configurations: ['Debug'])
    versions['Flipper'] ||= $flipper_default_versions['Flipper']
    versions['Flipper-Boost-iOSX'] ||= $flipper_default_versions['Flipper-Boost-iOSX']
    versions['Flipper-DoubleConversion'] ||= $flipper_default_versions['Flipper-DoubleConversion']
    versions['Flipper-Fmt'] ||= $flipper_default_versions['Flipper-Fmt']
    versions['Flipper-Folly'] ||= $flipper_default_versions['Flipper-Folly']
    versions['Flipper-Glog'] ||= $flipper_default_versions['Flipper-Glog']
    versions['Flipper-PeerTalk'] ||= $flipper_default_versions['Flipper-PeerTalk']
    versions['OpenSSL-Universal'] ||= $flipper_default_versions['OpenSSL-Universal']
    pod 'FlipperKit', versions['Flipper'], :configurations => configurations
    pod 'FlipperKit/FlipperKitLayoutPlugin', versions['Flipper'], :configurations => configurations
    pod 'FlipperKit/SKIOSNetworkPlugin', versions['Flipper'], :configurations => configurations
    pod 'FlipperKit/FlipperKitUserDefaultsPlugin', versions['Flipper'], :configurations => configurations
    pod 'FlipperKit/FlipperKitReactPlugin', versions['Flipper'], :configurations => configurations
    # List all transitive dependencies for FlipperKit pods
    # to avoid them being linked in Release builds
    pod 'Flipper', versions['Flipper'], :configurations => configurations
    pod 'Flipper-Boost-iOSX', versions['Flipper-Boost-iOSX'], :configurations => configurations
    pod 'Flipper-DoubleConversion', versions['Flipper-DoubleConversion'], :configurations => configurations
    pod 'Flipper-Fmt', versions['Flipper-Fmt'], :configurations => configurations
    pod 'Flipper-Folly', versions['Flipper-Folly'], :configurations => configurations
    pod 'Flipper-Glog', versions['Flipper-Glog'], :configurations => configurations
    pod 'Flipper-PeerTalk', versions['Flipper-PeerTalk'], :configurations => configurations
    pod 'FlipperKit/Core', versions['Flipper'], :configurations => configurations
    pod 'FlipperKit/CppBridge', versions['Flipper'], :configurations => configurations
    pod 'FlipperKit/FBCxxFollyDynamicConvert', versions['Flipper'], :configurations => configurations
    pod 'FlipperKit/FBDefines', versions['Flipper'], :configurations => configurations
    pod 'FlipperKit/FKPortForwarding', versions['Flipper'], :configurations => configurations
    pod 'FlipperKit/FlipperKitHighlightOverlay', versions['Flipper'], :configurations => configurations
    pod 'FlipperKit/FlipperKitLayoutTextSearchable', versions['Flipper'], :configurations => configurations
    pod 'FlipperKit/FlipperKitNetworkPlugin', versions['Flipper'], :configurations => configurations
    pod 'OpenSSL-Universal', versions['OpenSSL-Universal'], :configurations => configurations
end

# Applies some changes to some pods of the project:
# * it sets the sonar-kit flag to React-Core pod
#
# @parameter installer: the installer object used to install the pods.
def flipper_post_install(installer)
    installer.pods_project.targets.each do |target|
        # Enable flipper for React-RCTAppDelegate Debug configuration
        if target.name == 'React-RCTAppDelegate'
            target.build_configurations.each do |config|
                if config.debug?
                    config.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] = ['$(inherited)', 'FB_SONARKIT_ENABLED=1']
                end
            end
        end
    end
end

class FlipperConfiguration
    attr_reader :flipper_enabled
    attr_reader :configurations
    attr_reader :versions

    def initialize(flipper_enabled, configurations, versions)
        @flipper_enabled = flipper_enabled
        @configurations = configurations
        @versions = versions
    end

    def self.enabled(configurations = ["Debug"], versions = {})
        FlipperConfiguration.new(true, configurations, versions)
    end

    def self.disabled
        FlipperConfiguration.new(false, [], {})
    end

    def == (other)
        return @flipper_enabled == other.flipper_enabled &&
            @configurations == other.configurations &&
            @versions == other.versions
    end
end
