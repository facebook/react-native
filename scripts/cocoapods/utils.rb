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

    def self.set_node_modules_user_settings(installer, react_native_path)
        Pod::UI.puts("Setting REACT_NATIVE build settings")
        projects = installer.aggregate_targets
            .map{ |t| t.user_project }
            .uniq{ |p| p.path }
            .push(installer.pods_project)

        projects.each do |project|
            project.build_configurations.each do |config|
                config.build_settings["REACT_NATIVE_PATH"] = File.join("${PODS_ROOT}", "..", react_native_path)
            end

            project.save()
        end
    end

    def self.fix_library_search_paths(installer)
        projects = installer.aggregate_targets
            .map{ |t| t.user_project }
            .uniq{ |p| p.path }
            .push(installer.pods_project)

        projects.each do |project|
            project.build_configurations.each do |config|
                ReactNativePodsUtils.fix_library_search_path(config)
            end
            project.native_targets.each do |target|
                target.build_configurations.each do |config|
                    ReactNativePodsUtils.fix_library_search_path(config)
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

    private

    def self.fix_library_search_path(config)
        lib_search_paths = config.build_settings["LIBRARY_SEARCH_PATHS"]

        if lib_search_paths == nil
            # No search paths defined, return immediately
            return
        end

        # $(TOOLCHAIN_DIR)/usr/lib/swift-5.0/$(PLATFORM_NAME) causes problem with Xcode 12.5 + arm64 (Apple M1)
        # since the libraries there are only built for x86_64 and i386.
        lib_search_paths.delete("$(TOOLCHAIN_DIR)/usr/lib/swift-5.0/$(PLATFORM_NAME)")
        lib_search_paths.delete("\"$(TOOLCHAIN_DIR)/usr/lib/swift-5.0/$(PLATFORM_NAME)\"")

        if !(lib_search_paths.include?("$(SDKROOT)/usr/lib/swift") || lib_search_paths.include?("\"$(SDKROOT)/usr/lib/swift\""))
            # however, $(SDKROOT)/usr/lib/swift is required, at least if user is not running CocoaPods 1.11
            lib_search_paths.insert(0, "$(SDKROOT)/usr/lib/swift")
        end
    end


end
