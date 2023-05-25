# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

class NewArchitectureHelper
    @@shared_flags = "-DFOLLY_NO_CONFIG -DFOLLY_MOBILE=1 -DFOLLY_USE_LIBCPP=1"

    @@folly_compiler_flags = "#{@@shared_flags} -Wno-comma -Wno-shorten-64-to-32"

    @@new_arch_cpp_flags = "$(inherited) -DRCT_NEW_ARCH_ENABLED=1 #{@@shared_flags}"

    @@cplusplus_version = "c++17"

    def self.set_clang_cxx_language_standard_if_needed(installer)
        language_standard = nil

        installer.pods_project.targets.each do |target|
            if target.name == 'React-Core'
                language_standard = target.resolved_build_setting("CLANG_CXX_LANGUAGE_STANDARD", resolve_against_xcconfig: true).values[0]
            end
        end

        unless language_standard.nil?
            projects = installer.aggregate_targets
                .map{ |t| t.user_project }
                .uniq{ |p| p.path }

            projects.each do |project|
                Pod::UI.puts("Setting CLANG_CXX_LANGUAGE_STANDARD to #{ language_standard } on #{ project.path }")

                project.build_configurations.each do |config|
                    config.build_settings["CLANG_CXX_LANGUAGE_STANDARD"] = language_standard
                end

                project.save()
            end
        end
    end

    def self.modify_flags_for_new_architecture(installer, is_new_arch_enabled)
        unless is_new_arch_enabled
            return
        end
        ndebug_flag = " -DNDEBUG"
        # Add RCT_NEW_ARCH_ENABLED to Target pods xcconfig
        installer.aggregate_targets.each do |aggregate_target|
            aggregate_target.xcconfigs.each do |config_name, config_file|
                config_file.attributes['OTHER_CPLUSPLUSFLAGS'] = @@new_arch_cpp_flags

                if config_name == "Release"
                    config_file.attributes['OTHER_CPLUSPLUSFLAGS'] = config_file.attributes['OTHER_CPLUSPLUSFLAGS'] + ndebug_flag
                    other_cflags = config_file.attributes['OTHER_CFLAGS'] != nil ? config_file.attributes['OTHER_CFLAGS'] : "$(inherited)"
                    config_file.attributes['OTHER_CFLAGS'] = other_cflags + ndebug_flag
                end

                xcconfig_path = aggregate_target.xcconfig_path(config_name)
                config_file.save_as(xcconfig_path)
            end
        end

        # Add RCT_NEW_ARCH_ENABLED to generated pod target projects
        installer.target_installation_results.pod_target_installation_results.each do |pod_name, target_installation_result|
            if pod_name == 'React-Core'
                target_installation_result.native_target.build_configurations.each do |config|
                    config.build_settings['OTHER_CPLUSPLUSFLAGS'] = @@new_arch_cpp_flags
                end
            end

            target_installation_result.native_target.build_configurations.each do |config|
                if config.name == "Release"
                    current_flags = config.build_settings['OTHER_CPLUSPLUSFLAGS'] != nil ? config.build_settings['OTHER_CPLUSPLUSFLAGS'] : "$(inherited)"
                    config.build_settings['OTHER_CPLUSPLUSFLAGS'] = current_flags + ndebug_flag
                    current_cflags = config.build_settings['OTHER_CFLAGS'] != nil ? config.build_settings['OTHER_CFLAGS'] : "$(inherited)"
                    config.build_settings['OTHER_CFLAGS'] = current_cflags + ndebug_flag
                end
            end
        end
    end

    def self.install_modules_dependencies(spec, new_arch_enabled, folly_version)
        # Pod::Specification does not have getters so, we have to read
        # the existing values from a hash representation of the object.
        hash = spec.to_hash

        compiler_flags = hash["compiler_flags"] ? hash["compiler_flags"] : ""
        current_config = hash["pod_target_xcconfig"] != nil ? hash["pod_target_xcconfig"] : {}
        current_headers = current_config["HEADER_SEARCH_PATHS"] != nil ? current_config["HEADER_SEARCH_PATHS"] : ""

        header_search_paths = ["\"$(PODS_ROOT)/boost\""]
        if ENV['USE_FRAMEWORKS']
            header_search_paths << "\"$(PODS_ROOT)/DoubleConversion\""
            header_search_paths << "\"${PODS_CONFIGURATION_BUILD_DIR}/React-graphics/React_graphics.framework/Headers\""
            header_search_paths << "\"${PODS_CONFIGURATION_BUILD_DIR}/React-graphics/React_graphics.framework/Headers/react/renderer/graphics/platform/ios\""
            header_search_paths << "\"${PODS_CONFIGURATION_BUILD_DIR}/React-Fabric/React_Fabric.framework/Headers\""
            header_search_paths << "\"${PODS_CONFIGURATION_BUILD_DIR}/ReactCommon/ReactCommon.framework/Headers\""
            header_search_paths << "\"${PODS_CONFIGURATION_BUILD_DIR}/ReactCommon/ReactCommon.framework/Headers/react/nativemodule/core\""
            header_search_paths << "\"${PODS_CONFIGURATION_BUILD_DIR}/React-RCTFabric/RCTFabric.framework/Headers\""
            header_search_paths << "\"${PODS_CONFIGURATION_BUILD_DIR}/React-utils/React_utils.framework/Headers\""
            header_search_paths << "\"${PODS_CONFIGURATION_BUILD_DIR}/React-debug/React_debug.framework/Headers\""
        end
        header_search_paths_string = header_search_paths.join(" ")
        spec.compiler_flags = compiler_flags.empty? ? @@folly_compiler_flags : "#{compiler_flags} #{@@folly_compiler_flags}"
        current_config["HEADER_SEARCH_PATHS"] = current_headers.empty? ?
            header_search_paths_string :
            "#{current_headers} #{header_search_paths_string}"
        current_config["CLANG_CXX_LANGUAGE_STANDARD"] = @@cplusplus_version


        spec.dependency "React-Core"
        spec.dependency "RCT-Folly", '2021.07.22.00'

        if new_arch_enabled
            current_config["OTHER_CPLUSPLUSFLAGS"] = @@new_arch_cpp_flags
            spec.dependency "React-RCTFabric" # This is for Fabric Component
            spec.dependency "React-Codegen"

            spec.dependency "RCTRequired"
            spec.dependency "RCTTypeSafety"
            spec.dependency "ReactCommon/turbomodule/bridging"
            spec.dependency "ReactCommon/turbomodule/core"
            spec.dependency "React-NativeModulesApple"
            spec.dependency "Yoga"
            spec.dependency "React-Fabric"
            spec.dependency "React-graphics"
            spec.dependency "React-utils"
            spec.dependency "React-debug"

            if ENV["USE_HERMES"] == nil || ENV["USE_HERMES"] == "1"
                spec.dependency "hermes-engine"
            else
                spec.dependency "React-jsi"
            end
        end

        spec.pod_target_xcconfig = current_config
    end

    def self.folly_compiler_flags
        return @@folly_compiler_flags
    end
end
