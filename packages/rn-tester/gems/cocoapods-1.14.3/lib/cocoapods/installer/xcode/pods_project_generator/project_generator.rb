module Pod
  class Installer
    class Xcode
      # Responsible for creating and preparing a Pod::Project instance
      #
      class ProjectGenerator
        # @return [Sandbox] sandbox
        #         The Pods sandbox instance.
        #
        attr_reader :sandbox

        # @return [String] path
        #         Path of the project.
        #
        attr_reader :path

        # @return [Array<PodTarget>] pod_targets
        #         Array of pod targets this project includes.
        #
        attr_reader :pod_targets

        # @return [Hash{String=>Symbol}] A hash representing all the user build
        #         configurations across all integration targets. Each key
        #         corresponds to the name of a configuration and its value to
        #         its type (`:debug` or `:release`).
        #
        attr_reader :build_configurations

        # @return [Array<Platform>] The list of all platforms this project supports.
        #
        attr_reader :platforms

        # @return [Integer] Object version for the Xcode project.
        #
        attr_reader :object_version

        # @return [String] Path to the Podfile included in the project.
        #
        attr_reader :podfile_path

        # @return [Boolean] Bool indicating if this project is a pod target subproject.
        # Used by `generate_multiple_pod_projects` installation option.
        #
        attr_reader :pod_target_subproject

        # Initialize a new instance
        #
        # @param [Sandbox] sandbox @see #sandbox
        # @param [String] path @see #path
        # @param [Array<PodTarget>] pod_targets @see #pod_targets
        # @param [Hash{String=>Symbol}] build_configurations @see #build_configurations
        # @param [Array<Platform>] platforms @see #platforms
        # @param [Integer] object_version @see #object_version
        # @param [String] podfile_path @see #podfile_path
        #
        def initialize(sandbox, path, pod_targets, build_configurations, platforms,
                       object_version, podfile_path = nil, pod_target_subproject: false)
          @sandbox = sandbox
          @path = path
          @pod_targets = pod_targets
          @build_configurations = build_configurations
          @platforms = platforms
          @object_version = object_version
          @podfile_path = podfile_path
          @pod_target_subproject = pod_target_subproject
        end

        public

        # @return [Project] Generated and prepared project.
        #
        def generate!
          project = create_project(path, object_version, pod_target_subproject)
          prepare(sandbox, project, pod_targets, build_configurations, platforms, podfile_path)
          project
        end

        private

        def create_project(path, object_version, pod_target_subproject)
          object_version ||= Xcodeproj::Constants::DEFAULT_OBJECT_VERSION
          Pod::Project.new(path, false, object_version, :pod_target_subproject => pod_target_subproject)
        end

        def prepare(sandbox, project, pod_targets, build_configurations, platforms, podfile_path)
          UI.message "- Creating #{project.project_name} project" do
            build_configurations.each do |name, type|
              project.add_build_configuration(name, type)
            end
            # Reset symroot just in case the user has added a new build configuration other than 'Debug' or 'Release'.
            project.symroot = Pod::Project::LEGACY_BUILD_ROOT
            pod_names = pod_targets.map(&:pod_name).uniq
            pod_names.each do |pod_name|
              local = sandbox.local?(pod_name)
              path = sandbox.pod_dir(pod_name)
              was_absolute = sandbox.local_path_was_absolute?(pod_name)
              project.add_pod_group(pod_name, path, local, was_absolute)
            end
            if podfile_path
              project.add_podfile(podfile_path)
            end
            osx_deployment_target = platforms.select { |p| p.name == :osx }.map(&:deployment_target).min
            ios_deployment_target = platforms.select { |p| p.name == :ios }.map(&:deployment_target).min
            watchos_deployment_target = platforms.select { |p| p.name == :watchos }.map(&:deployment_target).min
            tvos_deployment_target = platforms.select { |p| p.name == :tvos }.map(&:deployment_target).min
            visionos_deployment_target = platforms.select { |p| p.name == :visionos }.map(&:deployment_target).min
            project.build_configurations.each do |build_configuration|
              build_configuration.build_settings['MACOSX_DEPLOYMENT_TARGET'] = osx_deployment_target.to_s if osx_deployment_target
              build_configuration.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = ios_deployment_target.to_s if ios_deployment_target
              build_configuration.build_settings['WATCHOS_DEPLOYMENT_TARGET'] = watchos_deployment_target.to_s if watchos_deployment_target
              build_configuration.build_settings['TVOS_DEPLOYMENT_TARGET'] = tvos_deployment_target.to_s if tvos_deployment_target
              build_configuration.build_settings['XROS_DEPLOYMENT_TARGET'] = visionos_deployment_target.to_s if visionos_deployment_target
              build_configuration.build_settings['STRIP_INSTALLED_PRODUCT'] = 'NO'
              build_configuration.build_settings['CLANG_ENABLE_OBJC_ARC'] = 'YES'
              build_configuration.build_settings['CLANG_ANALYZER_LOCALIZABILITY_NONLOCALIZED'] = 'YES'
            end
          end
        end
      end
    end
  end
end
