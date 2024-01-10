# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

require_relative "./helpers.rb"

# Utilities class for React Native Cocoapods
class ReactNativePodsUtils
    def self.warn_if_not_on_arm64
        if SysctlChecker.new().call_sysctl_arm64() == 1 && !Environment.new().ruby_platform().include?('arm64')
            Pod::UI.warn 'Do not use "pod install" from inside Rosetta2 (x86_64 emulation on arm64).'
            Pod::UI.warn ' - Emulated x86_64 is slower than native arm64'
            Pod::UI.warn ' - May result in mixed architectures in rubygems (eg: ffi_c.bundle files may be x86_64 with an arm64 interpreter)'
            Pod::UI.warn 'Run "env /usr/bin/arch -arm64 /bin/bash --login" then try again.'
        end
    end

    def self.get_default_flags
        flags = {
            :fabric_enabled => false,
            :hermes_enabled => true,
            :flipper_configuration => FlipperConfiguration.disabled
        }

        if ENV['RCT_NEW_ARCH_ENABLED'] == '1'
            flags[:fabric_enabled] = true
            flags[:hermes_enabled] = true
        end

        if ENV['USE_HERMES'] == '0'
            flags[:hermes_enabled] = false
        end

        return flags
    end

    def self.has_pod(installer, name)
        installer.pods_project.pod_group(name) != nil
    end

    def self.turn_off_resource_bundle_react_core(installer)
        # this is needed for Xcode 14, see more details here https://github.com/facebook/react-native/issues/34673
        # we should be able to remove this once CocoaPods catches up to it, see more details here https://github.com/CocoaPods/CocoaPods/issues/11402
        installer.target_installation_results.pod_target_installation_results.each do |pod_name, target_installation_result|
            if pod_name.to_s == 'React-Core'
                target_installation_result.resource_bundle_targets.each do |resource_bundle_target|
                    resource_bundle_target.build_configurations.each do |config|
                        config.build_settings['CODE_SIGNING_ALLOWED'] = 'NO'
                    end
                end
            end
        end
    end

    def self.exclude_i386_architecture_while_using_hermes(installer)
        projects = self.extract_projects(installer)

        # Hermes does not support `i386` architecture
        excluded_archs_default = self.has_pod(installer, 'hermes-engine') ? "i386" : ""

        projects.each do |project|
            project.build_configurations.each do |config|
                config.build_settings["EXCLUDED_ARCHS[sdk=iphonesimulator*]"] = excluded_archs_default
            end

            project.save()
        end
    end

    def self.set_node_modules_user_settings(installer, react_native_path)
        Pod::UI.puts("Setting REACT_NATIVE build settings")
        projects = self.extract_projects(installer)

        projects.each do |project|
            project.build_configurations.each do |config|
                config.build_settings["REACT_NATIVE_PATH"] = File.join("${PODS_ROOT}", "..", react_native_path)
            end

            project.save()
        end
    end

    def self.fix_library_search_paths(installer)
        projects = self.extract_projects(installer)

        projects.each do |project|
            project.build_configurations.each do |config|
                self.fix_library_search_path(config)
            end
            project.native_targets.each do |target|
                target.build_configurations.each do |config|
                    self.fix_library_search_path(config)
                end
            end
            project.save()
        end
    end

    def self.apply_mac_catalyst_patches(installer)
        # Fix bundle signing issues
        installer.pods_project.targets.each do |target|
            if target.respond_to?(:product_type) and target.product_type == "com.apple.product-type.bundle"
                target.build_configurations.each do |config|
                    config.build_settings['CODE_SIGN_IDENTITY[sdk=macosx*]'] = '-'
                end
            end
        end

        installer.aggregate_targets.each do |aggregate_target|
            aggregate_target.user_project.native_targets.each do |target|
                target.build_configurations.each do |config|
                    # Explicitly set dead code stripping flags
                    config.build_settings['DEAD_CODE_STRIPPING'] = 'YES'
                    config.build_settings['PRESERVE_DEAD_CODE_INITS_AND_TERMS'] = 'YES'
                    # Modify library search paths
                    config.build_settings['LIBRARY_SEARCH_PATHS'] = ['$(SDKROOT)/usr/lib/swift', '$(SDKROOT)/System/iOSSupport/usr/lib/swift', '$(inherited)']
                end
            end
            aggregate_target.user_project.save()
        end
    end

    def self.apply_xcode_15_patch(installer, xcodebuild_manager: Xcodebuild)
        projects = self.extract_projects(installer)

        gcc_preprocessor_definition_key = 'GCC_PREPROCESSOR_DEFINITIONS'
        other_ld_flags_key = 'OTHER_LDFLAGS'
        libcpp_cxx17_fix = '_LIBCPP_ENABLE_CXX17_REMOVED_UNARY_BINARY_FUNCTION'
        xcode15_compatibility_flags = '-Wl -ld_classic '

        projects.each do |project|
            project.build_configurations.each do |config|
                # fix for unary_function and binary_function
                self.safe_init(config, gcc_preprocessor_definition_key)
                self.add_value_to_setting_if_missing(config, gcc_preprocessor_definition_key, libcpp_cxx17_fix)

                # fix for weak linking
                self.safe_init(config, other_ld_flags_key)
                if self.is_using_xcode15_0(:xcodebuild_manager => xcodebuild_manager)
                    self.add_value_to_setting_if_missing(config, other_ld_flags_key, xcode15_compatibility_flags)
                else
                    self.remove_value_from_setting_if_present(config, other_ld_flags_key, xcode15_compatibility_flags)
                end
            end
            project.save()
        end

    end

    def self.apply_flags_for_fabric(installer, fabric_enabled: false)
        fabric_flag = "-DRN_FABRIC_ENABLED"
        if fabric_enabled
            self.add_compiler_flag_to_project(installer, fabric_flag)
        else
            self.remove_compiler_flag_from_project(installer, fabric_flag)
        end
    end

    private

    def self.fix_library_search_path(config)
        lib_search_paths = config.build_settings["LIBRARY_SEARCH_PATHS"]

        if lib_search_paths == nil
            # No search paths defined, return immediately
            return
        end

        if lib_search_paths.include?("$(TOOLCHAIN_DIR)/usr/lib/swift-5.0/$(PLATFORM_NAME)") || lib_search_paths.include?("\"$(TOOLCHAIN_DIR)/usr/lib/swift-5.0/$(PLATFORM_NAME)\"")
            # $(TOOLCHAIN_DIR)/usr/lib/swift-5.0/$(PLATFORM_NAME) causes problem with Xcode 12.5 + arm64 (Apple M1)
            # since the libraries there are only built for x86_64 and i386.
            lib_search_paths.delete("$(TOOLCHAIN_DIR)/usr/lib/swift-5.0/$(PLATFORM_NAME)")
            lib_search_paths.delete("\"$(TOOLCHAIN_DIR)/usr/lib/swift-5.0/$(PLATFORM_NAME)\"")
        end

        if !(lib_search_paths.include?("$(SDKROOT)/usr/lib/swift") || lib_search_paths.include?("\"$(SDKROOT)/usr/lib/swift\""))
            # however, $(SDKROOT)/usr/lib/swift is required, at least if user is not running CocoaPods 1.11
            lib_search_paths.insert(0, "$(SDKROOT)/usr/lib/swift")
        end
    end

    def self.create_xcode_env_if_missing(file_manager: File)
        relative_path = Pod::Config.instance.installation_root.relative_path_from(Pathname.pwd)
        file_path = file_manager.join(relative_path, '.xcode.env')
        if file_manager.exist?(file_path)
            return
        end

        system("echo 'export NODE_BINARY=$(command -v node)' > #{file_path}")
    end

    # It examines the target_definition property and sets the appropriate value for
    # ENV['USE_FRAMEWORKS'] variable.
    #
    # - parameter target_definition: The current target definition
    def self.detect_use_frameworks(target_definition)
        if ENV['USE_FRAMEWORKS'] != nil
            return
        end

        framework_build_type = target_definition.build_type.to_s

        Pod::UI.puts("Framework build type is #{framework_build_type}")

        if framework_build_type === "static framework"
            ENV['USE_FRAMEWORKS'] = 'static'
        elsif framework_build_type === "dynamic framework"
            ENV['USE_FRAMEWORKS'] = 'dynamic'
        else
            ENV['USE_FRAMEWORKS'] = nil
        end
    end

    def self.update_search_paths(installer)
        return if ENV['USE_FRAMEWORKS'] == nil

        projects = self.extract_projects(installer)

        projects.each do |project|
            project.build_configurations.each do |config|

                header_search_paths = config.build_settings["HEADER_SEARCH_PATHS"] ||= "$(inherited)"

                header_search_paths = self.add_search_path_if_not_included(header_search_paths, "${PODS_CONFIGURATION_BUILD_DIR}/ReactCommon-Samples/ReactCommon_Samples.framework/Headers")
                header_search_paths = self.add_search_path_if_not_included(header_search_paths, "${PODS_CONFIGURATION_BUILD_DIR}/ReactCommon/ReactCommon.framework/Headers/react/nativemodule/core")
                header_search_paths = self.add_search_path_if_not_included(header_search_paths, "${PODS_CONFIGURATION_BUILD_DIR}/ReactCommon-Samples/ReactCommon_Samples.framework/Headers/platform/ios")
                header_search_paths = self.add_search_path_if_not_included(header_search_paths, "${PODS_CONFIGURATION_BUILD_DIR}/React-NativeModulesApple/React_NativeModulesApple.framework/Headers")
                header_search_paths = self.add_search_path_if_not_included(header_search_paths, "${PODS_CONFIGURATION_BUILD_DIR}/React-graphics/React_graphics.framework/Headers/react/renderer/graphics/platform/ios")

                config.build_settings["HEADER_SEARCH_PATHS"] = header_search_paths
            end

            project.save()
        end

        installer.target_installation_results.pod_target_installation_results.each do |pod_name, target_installation_result|
            if self.react_native_pods.include?(pod_name) || pod_name.include?("Pod") || pod_name.include?("Tests")
                next
            end

            self.set_rctfolly_search_paths(target_installation_result)
            self.set_codegen_search_paths(target_installation_result)
            self.set_reactcommon_searchpaths(target_installation_result)
            self.set_rctfabric_search_paths(target_installation_result)
            self.set_imagemanager_search_path(target_installation_result)
        end
    end

    def self.updateIphoneOSDeploymentTarget(installer)
        pod_to_update = Set.new([
            "boost",
            "CocoaAsyncSocket",
            "Flipper",
            "Flipper-DoubleConversion",
            "Flipper-Fmt",
            "Flipper-Boost-iOSX",
            "Flipper-Folly",
            "Flipper-Glog",
            "Flipper-PeerTalk",
            "FlipperKit",
            "fmt",
            "libevent",
            "OpenSSL-Universal",
            "RCT-Folly",
            "SocketRocket",
            "YogaKit"
        ])

        installer.target_installation_results.pod_target_installation_results
            .each do |pod_name, target_installation_result|
                unless pod_to_update.include?(pod_name)
                    next
                end
                target_installation_result.native_target.build_configurations.each do |config|
                    config.build_settings["IPHONEOS_DEPLOYMENT_TARGET"] = Helpers::Constants.min_ios_version_supported
                end
            end
    end

    # ========= #
    # Utilities #
    # ========= #

    def self.extract_projects(installer)
        return installer.aggregate_targets
            .map{ |t| t.user_project }
            .uniq{ |p| p.path }
            .push(installer.pods_project)
    end

    def self.safe_init(config, setting_name)
        old_config = config.build_settings[setting_name]
        if old_config == nil
            config.build_settings[setting_name] ||= '$(inherited) '
        end
    end

    def self.add_value_to_setting_if_missing(config, setting_name, value)
        old_config = config.build_settings[setting_name]
        if old_config.is_a?(Array)
            old_config = old_config.join(" ")
        end

        trimmed_value = value.strip()
        if !old_config.include?(trimmed_value)
            config.build_settings[setting_name] = "#{old_config.strip()} #{trimmed_value}".strip()
        end
    end

    def self.remove_value_from_setting_if_present(config, setting_name, value)
        old_config = config.build_settings[setting_name]
        if old_config.is_a?(Array)
            old_config = old_config.join(" ")
        end

        trimmed_value = value.strip()
        if old_config.include?(trimmed_value)
            new_config = old_config.gsub(trimmed_value,  "")
            config.build_settings[setting_name] = new_config.strip()
        end
    end

    def self.is_using_xcode15_0(xcodebuild_manager: Xcodebuild)
        xcodebuild_version = xcodebuild_manager.version

        # The output of xcodebuild -version is something like
        # Xcode 15.0
        # or
        # Xcode 14.3.1
        # We want to capture the version digits
        regex = /(\d+)\.(\d+)(?:\.(\d+))?/
        if match_data = xcodebuild_version.match(regex)
            major = match_data[1].to_i
            minor = match_data[2].to_i
            return major == 15 && minor == 0
        end

        return false
    end

    def self.add_compiler_flag_to_project(installer, flag, configuration: nil)
        projects = self.extract_projects(installer)

        projects.each do |project|
            project.build_configurations.each do |config|
                self.set_flag_in_config(config, flag, configuration: configuration)
            end
            project.save()
        end
    end

    def self.remove_compiler_flag_from_project(installer, flag, configuration: nil)
        projects = self.extract_projects(installer)

        projects.each do |project|
            project.build_configurations.each do |config|
                self.remove_flag_in_config(config, flag, configuration: configuration)
            end
            project.save()
        end
    end

    def self.add_compiler_flag_to_pods(installer, flag, configuration: nil)
        installer.target_installation_results.pod_target_installation_results.each do |pod_name, target_installation_result|
            target_installation_result.native_target.build_configurations.each do |config|
                self.set_flag_in_config(config, flag, configuration: configuration)
            end
        end
    end

    def self.set_flag_in_config(config, flag, configuration: nil)
        if configuration == nil || config.name == configuration
            self.add_flag_for_key(config, flag, "OTHER_CFLAGS")
            self.add_flag_for_key(config, flag, "OTHER_CPLUSPLUSFLAGS")
        end
    end

    def self.remove_flag_in_config(config, flag, configuration: nil)
        if configuration == nil || config.name == configuration
            self.remove_flag_for_key(config, flag, "OTHER_CFLAGS")
            self.remove_flag_for_key(config, flag, "OTHER_CPLUSPLUSFLAGS")
        end
    end


    def self.add_flag_for_key(config, flag, key)
        current_setting = config.build_settings[key] ? config.build_settings[key] : "$(inherited)"

        if current_setting.kind_of?(Array)
            current_setting = current_setting
            .map { |s| s.gsub('"', '') }
            .map { |s| s.gsub('\"', '') }
            .join(" ")
        end

        if !current_setting.include?(flag)
            current_setting = "#{current_setting} #{flag}"
        end

        config.build_settings[key] = current_setting
    end

    def self.remove_flag_for_key(config, flag, key)
        current_setting = config.build_settings[key] ? config.build_settings[key] : "$(inherited)"

        if current_setting.kind_of?(Array)
            current_setting = current_setting
            .map { |s| s.gsub('"', '') }
            .map { |s| s.gsub('\"', '') }
            .join(" ")
        end

        if current_setting.include?(flag)
            current_setting.slice! flag
        end

        config.build_settings[key] = current_setting
    end

    def self.add_search_path_if_not_included(current_search_paths, new_search_path)
        if !current_search_paths.include?(new_search_path)
            current_search_paths << " #{new_search_path}"
        end
        return current_search_paths
    end

    def self.update_header_paths_if_depends_on(target_installation_result, dependency_name, header_paths)
        depends_on_framework = target_installation_result.native_target.dependencies.any? { |d| d.name == dependency_name }
        if depends_on_framework
            target_installation_result.native_target.build_configurations.each do |config|
                header_search_path = config.build_settings["HEADER_SEARCH_PATHS"] != nil ? config.build_settings["HEADER_SEARCH_PATHS"] : "$(inherited)"
                header_paths.each { |header| header_search_path = ReactNativePodsUtils.add_search_path_if_not_included(header_search_path, header) }
                config.build_settings["HEADER_SEARCH_PATHS"] = header_search_path
            end
        end
    end

    def self.set_rctfolly_search_paths(target_installation_result)
        ReactNativePodsUtils.update_header_paths_if_depends_on(target_installation_result, "RCT-Folly", [
            "\"$(PODS_ROOT)/RCT-Folly\"",
            "\"$(PODS_ROOT)/DoubleConversion\"",
            "\"$(PODS_ROOT)/boost\""
        ])
    end

    def self.set_codegen_search_paths(target_installation_result)
        ReactNativePodsUtils.update_header_paths_if_depends_on(target_installation_result, "React-Codegen", [
            "\"${PODS_CONFIGURATION_BUILD_DIR}/React-Codegen/React_Codegen.framework/Headers\"",
        ])
    end

    def self.set_reactcommon_searchpaths(target_installation_result)
        ReactNativePodsUtils.update_header_paths_if_depends_on(target_installation_result, "ReactCommon", [
            "\"${PODS_CONFIGURATION_BUILD_DIR}/ReactCommon/ReactCommon.framework/Headers\"",
            "\"${PODS_CONFIGURATION_BUILD_DIR}/ReactCommon/ReactCommon.framework/Headers/react/nativemodule/core\"",
        ])

    end

    def self.set_rctfabric_search_paths(target_installation_result)
        ReactNativePodsUtils.update_header_paths_if_depends_on(target_installation_result, "React-RCTFabric", [
            "\"${PODS_CONFIGURATION_BUILD_DIR}/React-RCTFabric/RCTFabric.framework/Headers\"",
            "\"${PODS_CONFIGURATION_BUILD_DIR}/React-Fabric/React_Fabric.framework/Headers\"",
            "\"${PODS_CONFIGURATION_BUILD_DIR}/React-Graphics/React_graphics.framework/Headers\"",
            "\"${PODS_CONFIGURATION_BUILD_DIR}/React-Graphics/React_graphics.framework/Headers/react/renderer/graphics/platform/ios\"",
        ])
    end

    def self.set_imagemanager_search_path(target_installation_result)
        ReactNativePodsUtils.update_header_paths_if_depends_on(target_installation_result, "React-ImageManager", [
            "\"${PODS_CONFIGURATION_BUILD_DIR}/React-Fabric/React_Fabric.framework/Headers/react/renderer/imagemanager/platform/ios\""
        ])
    end

    def self.react_native_pods
        return [
            "DoubleConversion",
            "FBLazyVector",
            "RCT-Folly",
            "RCTRequired",
            "RCTTypeSafety",
            "React",
            "React-Codegen",
            "React-Core",
            "React-CoreModules",
            "React-Fabric",
            "React-ImageManager",
            "React-RCTActionSheet",
            "React-RCTAnimation",
            "React-RCTAppDelegate",
            "React-RCTBlob",
            "React-RCTFabric",
            "React-RCTImage",
            "React-RCTLinking",
            "React-RCTNetwork",
            "React-RCTPushNotification",
            "React-RCTSettings",
            "React-RCTText",
            "React-RCTTest",
            "React-RCTVibration",
            "React-callinvoker",
            "React-cxxreact",
            "React-graphics",
            "React-jsc",
            "React-jsi",
            "React-jsiexecutor",
            "React-jsinspector",
            "React-logger",
            "React-perflogger",
            "React-rncore",
            "React-runtimeexecutor",
            "ReactCommon",
            "Yoga",
            "boost",
            "fmt",
            "glog",
            "hermes-engine",
            "libevent",
            "React-hermes",
        ]
    end
end
