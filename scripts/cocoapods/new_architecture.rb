# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

class NewArchitectureHelper

    @@new_arch_cpp_flags = '$(inherited) -DRCT_NEW_ARCH_ENABLED=1 -DFOLLY_NO_CONFIG -DFOLLY_MOBILE=1 -DFOLLY_USE_LIBCPP=1'

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

        # Add RCT_NEW_ARCH_ENABLED to Target pods xcconfig
        installer.aggregate_targets.each do |aggregate_target|
            aggregate_target.xcconfigs.each do |config_name, config_file|
                config_file.attributes['OTHER_CPLUSPLUSFLAGS'] = @@new_arch_cpp_flags
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
        end
    end
end
