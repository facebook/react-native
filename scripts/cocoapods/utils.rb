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
            :hermes_enabled => false,
            :flipper_configuration => FlipperConfiguration.disabled
        }

        if ENV['RCT_NEW_ARCH_ENABLED'] == '1'
            flags[:fabric_enabled] = true
            flags[:hermes_enabled] = true
        end

        if ENV['USE_HERMES'] == '1'
            flags[:hermes_enabled] = true
        end

        return flags
    end

    def self.has_pod(installer, name)
        installer.pods_project.pod_group(name) != nil
    end

    def self.exclude_i386_architecture_while_using_hermes(installer)
        projects = installer.aggregate_targets
            .map{ |t| t.user_project }
            .uniq{ |p| p.path }
            .push(installer.pods_project)


        # Hermes does not support `i386` architecture
        excluded_archs_default = ReactNativePodsUtils.has_pod(installer, 'hermes-engine') ? "i386" : ""

        projects.each do |project|
            project.build_configurations.each do |config|
                config.build_settings["EXCLUDED_ARCHS[sdk=iphonesimulator*]"] = excluded_archs_default
            end

            project.save()
        end
    end
end
