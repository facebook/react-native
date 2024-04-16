module Pod
  class Installer
    class Xcode
      class PodsProjectGenerator
        # Installs an app host target to a given project.
        #
        class AppHostInstaller
          include TargetInstallerHelper

          # @return [Sandbox]
          #         The sandbox used for this installation.
          #
          attr_reader :sandbox

          # @return [Pod::Project]
          #         The project to install the app host into.
          #
          attr_reader :project

          # @return [Platform] the platform to use for this app host.
          #
          attr_reader :platform

          # @return [String] the name of the sub group.
          #
          attr_reader :subgroup_name

          # @return [String] the name of the group the app host installer will be installing within.
          #
          attr_reader :group_name

          # @return [String] the name of the app target label that will be used.
          #
          attr_reader :app_target_label

          # @return [Boolean] whether the app host installer should add main.m
          #
          attr_reader :add_main

          # @return [Boolean] whether the app host installer should add a launch screen storyboard
          #
          attr_reader :add_launchscreen_storyboard

          # @return [Hash] Info.plist entries for the app host
          #
          attr_reader :info_plist_entries

          # @return [String] product_basename
          #         The product basename to use for the target.
          #
          attr_reader :product_basename

          # Initialize a new instance
          #
          # @param [Sandbox] sandbox @see #sandbox
          # @param [Pod::Project] project @see #project
          # @param [Platform] platform @see #platform
          # @param [String] subgroup_name @see #subgroup_name
          # @param [String] group_name @see #group_name
          # @param [String] app_target_label see #app_target_label
          # @param [Boolean] add_main see #add_main
          # @param [Hash] info_plist_entries see #info_plist_entries
          # @param [String] product_basename see #product_basename
          #
          def initialize(sandbox, project, platform, subgroup_name, group_name, app_target_label, add_main: true,
                         add_launchscreen_storyboard: platform == :ios, info_plist_entries: {}, product_basename: nil)
            @sandbox = sandbox
            @project = project
            @platform = platform
            @subgroup_name = subgroup_name
            @group_name = group_name
            @app_target_label = app_target_label
            @add_main = add_main
            @add_launchscreen_storyboard = add_launchscreen_storyboard
            @info_plist_entries = info_plist_entries
            @product_basename = product_basename || app_target_label
            target_group = project.pod_group(group_name)
            @group = target_group[subgroup_name] || target_group.new_group(subgroup_name)
          end

          # @return [PBXNativeTarget] the app host native target that was installed.
          #
          def install!
            platform_name = platform.name
            app_host_target = Pod::Generator::AppTargetHelper.add_app_target(project, platform_name, deployment_target,
                                                                             app_target_label, product_basename)
            app_host_target.build_configurations.each do |configuration|
              configuration.build_settings['PRODUCT_NAME'] = product_basename
              configuration.build_settings['PRODUCT_BUNDLE_IDENTIFIER'] = 'org.cocoapods.${PRODUCT_NAME:rfc1034identifier}'
              if platform == :osx
                configuration.build_settings['CODE_SIGN_IDENTITY'] = ''
              elsif platform == :ios
                configuration.build_settings['CODE_SIGN_IDENTITY'] = 'iPhone Developer'
              end
              configuration.build_settings['CURRENT_PROJECT_VERSION'] = '1'
            end

            Pod::Generator::AppTargetHelper.add_app_host_main_file(project, app_host_target, platform_name, @group, app_target_label) if add_main
            Pod::Generator::AppTargetHelper.add_launchscreen_storyboard(project, app_host_target, @group, deployment_target, app_target_label) if add_launchscreen_storyboard
            create_info_plist_file_with_sandbox(sandbox, app_host_info_plist_path, app_host_target, '1.0.0', platform,
                                                :appl, :additional_entries => additional_info_plist_entries)
            @group.new_file(app_host_info_plist_path)
            app_host_target
          end

          private

          ADDITIONAL_INFO_PLIST_ENTRIES = {
            'NSAppTransportSecurity' => {
              'NSAllowsArbitraryLoads' => true,
            },
          }.freeze

          ADDITIONAL_IOS_INFO_PLIST_ENTRIES = {
            'UILaunchStoryboardName' => 'LaunchScreen',
            'UISupportedInterfaceOrientations' => %w(
              UIInterfaceOrientationPortrait
              UIInterfaceOrientationLandscapeLeft
              UIInterfaceOrientationLandscapeRight
            ),
            'UISupportedInterfaceOrientations~ipad' => %w(
              UIInterfaceOrientationPortrait
              UIInterfaceOrientationPortraitUpsideDown
              UIInterfaceOrientationLandscapeLeft
              UIInterfaceOrientationLandscapeRight
            ),
          }.freeze

          # @return [Hash] the additional Info.plist entries to be included
          #
          def additional_info_plist_entries
            result = {}
            result.merge!(ADDITIONAL_INFO_PLIST_ENTRIES)
            result.merge!(ADDITIONAL_IOS_INFO_PLIST_ENTRIES) if platform == :ios
            result.merge!(info_plist_entries) if info_plist_entries
            result
          end

          # @return [Pathname] The absolute path of the Info.plist to use for an app host.
          #
          def app_host_info_plist_path
            project.path.dirname.+(subgroup_name).+("#{app_target_label}-Info.plist")
          end

          # @return [String] The deployment target.
          #
          def deployment_target
            platform.deployment_target.to_s
          end
        end
      end
    end
  end
end
