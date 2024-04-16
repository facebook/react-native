module Pod
  class Installer
    class Analyzer
      class TargetInspectionResult
        # @return [TargetDefinition] the target definition, whose project was
        #         inspected
        #
        attr_reader :target_definition

        # @return [Xcodeproj::Project] the user's Xcode project
        #
        attr_reader :project

        # @return [Array<String>] the uuid of the user's targets
        #
        attr_reader :project_target_uuids

        # @return [Hash{String=>Symbol}] A hash representing the user build
        #         configurations where each key corresponds to the name of a
        #         configuration and its value to its type (`:debug` or
        #         `:release`).
        #
        attr_reader :build_configurations

        # @return [Platform] the platform of the user targets
        #
        attr_reader :platform

        # @return [Array<String>] the architectures used by user's targets
        #
        attr_reader :archs

        # @return [Pathname] the path to the root of the project containing the user target
        #
        attr_reader :client_root

        # Initialize a new instance
        #
        # @param [TargetDefinition] target_definition @see #target_definition
        # @param [Xcodeproj::Project] project @see #project
        # @param [Array<String>] project_target_uuids @see #project_target_uuids
        # @param [Hash{String=>Symbol}] build_configurations @see #build_configurations
        # @param [Platform] platform @see #platform
        # @param [Array<String>] archs @see #archs
        #
        def initialize(target_definition, project, project_target_uuids, build_configurations, platform, archs)
          @target_definition = target_definition
          @project = project
          @project_target_uuids = project_target_uuids
          @build_configurations = build_configurations
          @platform = platform
          @archs = archs
          @client_root = Pathname.new(project.project_dir + project.root_object.project_dir_path).realpath
        end
      end
    end
  end
end
