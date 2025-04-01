# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

require 'json'

require_relative "./utils.rb"
require_relative "./helpers.rb"

class NewArchitectureHelper
    @@NewArchWarningEmitted = false # Used not to spam warnings to the user.

    def self.set_clang_cxx_language_standard_if_needed(installer)
        cxxBuildsettingsName = "CLANG_CXX_LANGUAGE_STANDARD"
        projects = installer.aggregate_targets
            .map{ |t| t.user_project }
            .uniq{ |p| p.path }

        projects.each do |project|
            Pod::UI.puts("Setting #{cxxBuildsettingsName} to #{ Helpers::Constants::cxx_language_standard } on #{ project.path }")

            project.build_configurations.each do |config|
                config.build_settings[cxxBuildsettingsName] = Helpers::Constants::cxx_language_standard
            end

            project.save()
        end

        installer.target_installation_results.pod_target_installation_results.each do |pod_name, target_installation_result|
            target_installation_result.native_target.build_configurations.each do |config|
                config.build_settings[cxxBuildsettingsName] = Helpers::Constants::cxx_language_standard
            end
        end

        # Override targets that would set spec.xcconfig to define c++ version
        installer.aggregate_targets.each do |aggregate_target|
            aggregate_target.xcconfigs.each do |config_name, config_file|
                config_file.attributes[cxxBuildsettingsName] = Helpers::Constants::cxx_language_standard
            end
        end
    end

    def self.computeFlags(is_new_arch_enabled)
        new_arch_flag = is_new_arch_enabled ? "-DRCT_NEW_ARCH_ENABLED=1 " : ""
        return " #{new_arch_flag}#{Helpers::Constants.folly_config()[:compiler_flags]}"
    end

    def self.modify_flags_for_new_architecture(installer, is_new_arch_enabled)
        # Add flags to Target pods xcconfig
        installer.aggregate_targets.each do |aggregate_target|
            aggregate_target.xcconfigs.each do |config_name, config_file|
                ReactNativePodsUtils.add_flag_to_map_with_inheritance(config_file.attributes, "OTHER_CPLUSPLUSFLAGS", self.computeFlags(is_new_arch_enabled))

                xcconfig_path = aggregate_target.xcconfig_path(config_name)
                config_file.save_as(xcconfig_path)
            end
        end

        # Add flags to Target pods xcconfig
        installer.target_installation_results.pod_target_installation_results.each do |pod_name, target_installation_result|
            # The React-Core pod may have a suffix added by Cocoapods, so we test whether 'React-Core' is a substring, and do not require exact match
            if pod_name.include? 'React-Core'
                target_installation_result.native_target.build_configurations.each do |config|
                    ReactNativePodsUtils.add_flag_to_map_with_inheritance(config.build_settings, "OTHER_CPLUSPLUSFLAGS", self.computeFlags(is_new_arch_enabled))
                end
            end
        end
    end

    def self.install_modules_dependencies(spec, new_arch_enabled, folly_version = get_folly_config()[:version])
        # Pod::Specification does not have getters so, we have to read
        # the existing values from a hash representation of the object.
        folly_config = get_folly_config()
        folly_compiler_flags = folly_config[:compiler_flags]

        hash = spec.to_hash

        compiler_flags = hash["compiler_flags"] ? hash["compiler_flags"] : ""
        current_config = hash["pod_target_xcconfig"] != nil ? hash["pod_target_xcconfig"] : {}
        current_headers = current_config["HEADER_SEARCH_PATHS"] != nil ? current_config["HEADER_SEARCH_PATHS"] : ""

        header_search_paths = ["\"$(PODS_ROOT)/boost\" \"$(PODS_ROOT)/Headers/Private/Yoga\""]
        if ENV['USE_FRAMEWORKS']
            header_search_paths << "\"$(PODS_ROOT)/DoubleConversion\""
            header_search_paths << "\"$(PODS_ROOT)/fast_float/include\""
            header_search_paths << "\"$(PODS_ROOT)/fmt/include\""
            ReactNativePodsUtils.create_header_search_path_for_frameworks("PODS_CONFIGURATION_BUILD_DIR", "React-graphics", "React_graphics", ["react/renderer/graphics/platform/ios"])
                .concat(ReactNativePodsUtils.create_header_search_path_for_frameworks("PODS_CONFIGURATION_BUILD_DIR", "React-Fabric", "React_Fabric", ["react/renderer/components/view/platform/cxx"]))
                .concat(ReactNativePodsUtils.create_header_search_path_for_frameworks("PODS_CONFIGURATION_BUILD_DIR", "React-FabricImage", "React_FabricImage", []))
                .concat(ReactNativePodsUtils.create_header_search_path_for_frameworks("PODS_CONFIGURATION_BUILD_DIR", "ReactCommon", "ReactCommon", ["react/nativemodule/core"]))
                .concat(ReactNativePodsUtils.create_header_search_path_for_frameworks("PODS_CONFIGURATION_BUILD_DIR", "React-NativeModulesApple", "React_NativeModulesApple", []))
                .concat(ReactNativePodsUtils.create_header_search_path_for_frameworks("PODS_CONFIGURATION_BUILD_DIR", "React-RCTFabric", "RCTFabric", []))
                .concat(ReactNativePodsUtils.create_header_search_path_for_frameworks("PODS_CONFIGURATION_BUILD_DIR", "React-utils", "React_utils", []))
                .concat(ReactNativePodsUtils.create_header_search_path_for_frameworks("PODS_CONFIGURATION_BUILD_DIR", "React-featureflags", "React_featureflags", []))
                .concat(ReactNativePodsUtils.create_header_search_path_for_frameworks("PODS_CONFIGURATION_BUILD_DIR", "React-debug", "React_debug", []))
                .concat(ReactNativePodsUtils.create_header_search_path_for_frameworks("PODS_CONFIGURATION_BUILD_DIR", "React-ImageManager", "React_ImageManager", []))
                .concat(ReactNativePodsUtils.create_header_search_path_for_frameworks("PODS_CONFIGURATION_BUILD_DIR", "React-rendererdebug", "React_rendererdebug", []))
                .each { |search_path|
                    header_search_paths << "\"#{search_path}\""
                }
        end
        header_search_paths_string = header_search_paths.join(" ")
        spec.compiler_flags = compiler_flags.empty? ? self.computeFlags(new_arch_enabled).strip! : "#{compiler_flags} #{self.computeFlags(new_arch_enabled)}"
        current_config["HEADER_SEARCH_PATHS"] = current_headers.empty? ?
            header_search_paths_string :
            "#{current_headers} #{header_search_paths_string}"
        current_config["CLANG_CXX_LANGUAGE_STANDARD"] = Helpers::Constants::cxx_language_standard


        spec.dependency "React-Core"
        spec.dependency "RCT-Folly", folly_version
        spec.dependency "glog"


        ReactNativePodsUtils.add_flag_to_map_with_inheritance(current_config, "OTHER_CPLUSPLUSFLAGS", self.computeFlags(new_arch_enabled))

        spec.dependency "React-RCTFabric" # This is for Fabric Component
        spec.dependency "ReactCodegen"

        spec.dependency "RCTRequired"
        spec.dependency "RCTTypeSafety"
        spec.dependency "ReactCommon/turbomodule/bridging"
        spec.dependency "ReactCommon/turbomodule/core"
        spec.dependency "React-NativeModulesApple"
        spec.dependency "Yoga"
        spec.dependency "React-Fabric"
        spec.dependency "React-graphics"
        spec.dependency "React-utils"
        spec.dependency "React-featureflags"
        spec.dependency "React-debug"
        spec.dependency "React-ImageManager"
        spec.dependency "React-rendererdebug"
        # This dependency is required for the cases when the pod includes generated sources, specifically Props.cpp.
        spec.dependency "DoubleConversion"

        if ENV["USE_HERMES"] == nil || ENV["USE_HERMES"] == "1"
            spec.dependency "hermes-engine"
        else
            spec.dependency "React-jsi"
        end

        spec.pod_target_xcconfig = current_config
    end

    def self.folly_compiler_flags
        folly_config = get_folly_config()
        return folly_config[:compiler_flags]
    end

    def self.extract_react_native_version(react_native_path, file_manager: File, json_parser: JSON)
        package_json_file = File.join(react_native_path, "package.json")
        if !file_manager.exist?(package_json_file)
            raise "Couldn't find the React Native package.json file at #{package_json_file}"
        end
        package = json_parser.parse(file_manager.read(package_json_file))
        return package["version"]
    end

    def self.compute_new_arch_enabled(new_arch_enabled, react_native_version)
        # Regex that identify a version with the syntax `<major>.<minor>.<patch>[-<prerelease>[.-]k]
        # where
        # - major is a number
        # - minor is a number
        # - patch is a number
        # - prerelease is a string (can include numbers)
        # - k is a number
        version_regex = /^(\d+)\.(\d+)\.(\d+)(?:-(\w+(?:[-.]\d+)?))?$/

        if match_data = react_native_version.match(version_regex)

            prerelease = match_data[4].to_s

            # We want to enforce the new architecture for 1.0.0 and greater,
            # but not for 1000 as version 1000 is currently main.
            if prerelease.include?("prealpha")
                if ENV['RCT_NEW_ARCH_ENABLED'] != nil && !@@NewArchWarningEmitted
                    warning_message = "[New Architecture] Starting from version 1.0.0-prealpha the value of the " \
                                      "RCT_NEW_ARCH_ENABLED flag is ignored and the New Architecture is enabled by default."
                    Pod::UI.warn warning_message
                    @@NewArchWarningEmitted = true
                end

                return "1"
            end
        end
        return new_arch_enabled ? "1" : "0"
    end

    def self.new_arch_enabled
        return ENV["RCT_NEW_ARCH_ENABLED"] == nil || ENV["RCT_NEW_ARCH_ENABLED"] == "1"
    end
end
