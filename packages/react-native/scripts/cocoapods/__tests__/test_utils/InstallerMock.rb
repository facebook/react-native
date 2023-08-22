# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.


# This file replicate the structure of the Installer used Cocoapods in the post_install step.
#
# To use it, add `require_relative path/to/InstallerMock.rb` into your test file
#
# ## Initialization
# You can create a new mock with the `InstallerMock.new` statement. In this case, you will
# create an empty mock.
#
# It's possible to create complex with the initializer. To create an Installer with a pod, for example, we can
# use the following code:
#
# ```ruby
# installer = Installer.new(
#   PodsProjectMock.new([
#     TargetMock.new(
#       "MyPod",
#       [
#         BuildConfigurationMock.new("Debug"),
#       ]
#     )
#   )
# )
# ```
#
# ## Assert
# All the properties of these objects are accessible in read mode.
# To access the target's list, for example, you can use the following line:
#
# ```ruby
# targets = installer.pods_project.targets
# ```

class InstallerMock
    attr_reader :pods_project
    attr_reader :aggregate_targets
    attr_reader :target_installation_results

    InstallationResults = Struct.new(:pod_target_installation_results, :aggregate_target_installation_results)

    def initialize(pods_project = PodsProjectMock.new, aggregate_targets = [AggregatedProjectMock.new],
                   pod_target_installation_results: {},
                   aggregate_target_installation_results: {})
        @pods_project = pods_project
        @aggregate_targets = aggregate_targets

        @target_installation_results = InstallationResults.new(pod_target_installation_results, aggregate_target_installation_results)
        aggregate_targets.each do |aggregate_target|
            aggregate_target.user_project.native_targets.each do |target|
                @target_installation_results.pod_target_installation_results[target.name] = TargetInstallationResultMock.new(target, target)
            end
        end
        pods_project.native_targets.each do |target|
            @target_installation_results.pod_target_installation_results[target.name] = TargetInstallationResultMock.new(target, target)
        end
    end

    def target_with_name(name)
        return @pods_project.targets
            .select { |target| target.name == name }
            .first
    end
end

class PodsProjectMock
    attr_reader :targets
    attr_reader :native_targets
    attr_reader :path
    attr_reader :build_configurations
    @pod_group
    attr_reader :save_invocation_count

    def initialize(targets = [], pod_group = {}, path = "test/path-pod.xcodeproj", build_configurations = [], native_targets: [])
        @targets = targets
        @pod_group = pod_group
        @path = path
        @build_configurations = build_configurations
        @save_invocation_count = 0
        @native_targets = native_targets
    end

    def pod_group(name)
        return @pod_group[name]
    end

    def save()
        @save_invocation_count += 1
    end
end

class AggregatedProjectMock
    attr_reader :user_project
    attr_reader :xcconfigs

    @base_path

    def initialize(user_project = UserProjectMock.new, xcconfigs: {}, base_path: "")
        @user_project = user_project
        @xcconfigs = xcconfigs
        @base_path = base_path
    end

    def xcconfig_path(config_name)
        return File.join(@base_path, "#{config_name}.xcconfig")
    end
end

class UserProjectMock
    attr_reader :path
    attr_reader :build_configurations
    attr_reader :native_targets

    attr_reader :save_invocation_count


    def initialize(path = "/test/path.xcproj", build_configurations = [], native_targets: [])
        @path = path
        @build_configurations = build_configurations
        @native_targets = native_targets
        @save_invocation_count = 0
    end

    def save()
        @save_invocation_count += 1
    end
end

class XCConfigMock
    attr_reader :name
    attr_accessor :attributes
    attr_reader :save_as_invocation

    def initialize(name, attributes: {})
        @name = name
        @attributes = attributes
        @save_as_invocation = []
    end

    def save_as(file_path)
        @save_as_invocation.push(file_path)
    end
end

ReceivedCommonResolvedBuildSettings = Struct.new(:key, :resolve_against_xcconfig)

class TargetMock
    attr_reader :name
    attr_reader :build_configurations
    attr_reader :product_type
    attr_reader :received_resolved_build_setting_parameters
    attr_reader :dependencies

    def initialize(name, build_configurations = [], product_type = nil, dependencies = [])
        @name = name
        @build_configurations = build_configurations
        unless product_type.nil?
          @product_type = product_type
        end
        @received_resolved_build_setting_parameters = []
        @dependencies = dependencies
    end

    def resolved_build_setting(key, resolve_against_xcconfig: false)
        received_resolved_build_setting_parameters.append(ReceivedCommonResolvedBuildSettings.new(key, resolve_against_xcconfig))

        return {name: build_configurations[0].build_settings[key]}
    end
end

class BuildConfigurationMock
    attr_reader :name
    attr_reader :build_settings
    @is_debug

    def initialize(name, build_settings = {}, is_debug: false)
        @name = name
        @build_settings = build_settings
        @is_debug = is_debug
    end

    def debug?
      return @is_debug
    end
end

class TargetInstallationResultMock
    attr_reader :target
    attr_reader :native_target
    attr_reader :resource_bundle_targets
    attr_reader :test_native_targets
    attr_reader :test_resource_bundle_targets
    attr_reader :test_app_host_targets
    attr_reader :app_native_targets
    attr_reader :app_resource_bundle_targets

    def initialize(target = TargetMock, native_target = TargetMock,
                   resource_bundle_targets = [], test_native_targets = [],
                   test_resource_bundle_targets = {}, test_app_host_targets = [],
                   app_native_targets = {}, app_resource_bundle_targets = {})
        @target = target
        @native_target = native_target
        @resource_bundle_targets = resource_bundle_targets
        @test_native_targets = test_native_targets
        @test_resource_bundle_targets = test_resource_bundle_targets
        @test_app_host_targets = test_app_host_targets
        @app_native_targets = app_native_targets
        @app_resource_bundle_targets = app_resource_bundle_targets
    end
end

class DependencyMock
    attr_reader :name

    def initialize(name)
        @name = name
    end
end
