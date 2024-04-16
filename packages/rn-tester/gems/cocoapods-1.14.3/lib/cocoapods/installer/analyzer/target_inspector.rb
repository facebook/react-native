require 'active_support/core_ext/array/conversions'

module Pod
  class Installer
    class Analyzer
      class TargetInspector
        PLATFORM_INFO_URL = 'https://guides.cocoapods.org/syntax/podfile.html#platform'.freeze

        # @return [TargetDefinition] the target definition to inspect
        #
        attr_reader :target_definition

        # @return [Pathname] the root of the CocoaPods installation where the
        #         Podfile is located
        #
        attr_reader :installation_root

        # Initialize a new instance
        #
        # @param [TargetDefinition] target_definition
        #        @see #target_definition
        #
        # @param [Pathname] installation_root
        #        @see #installation_root
        #
        def initialize(target_definition, installation_root)
          @target_definition = target_definition
          @installation_root = installation_root
        end

        # Inspect the #target_definition
        #
        # @raise If no `user_project` is set
        #
        # @return [TargetInspectionResult] the result of the inspection of the target definition within the user project
        #
        def compute_results(user_project)
          raise ArgumentError, 'Cannot compute results without a user project set' unless user_project

          targets = compute_targets(user_project)
          project_target_uuids = targets.map(&:uuid)
          build_configurations = compute_build_configurations(targets)
          platform = compute_platform(targets)
          archs = compute_archs(targets)
          swift_version = compute_swift_version_from_targets(targets)

          result = TargetInspectionResult.new(target_definition, user_project, project_target_uuids,
                                              build_configurations, platform, archs)
          result.target_definition.swift_version = swift_version
          result
        end

        # Returns the path of the user project that the #target_definition
        # should integrate.
        #
        # @raise  If the project is implicit and there are multiple projects.
        #
        # @raise  If the path doesn't exits.
        #
        # @return [Pathname] the path of the user project.
        #
        def compute_project_path
          if target_definition.user_project_path
            path = installation_root + target_definition.user_project_path
            path = "#{path}.xcodeproj" unless File.extname(path) == '.xcodeproj'
            path = Pathname.new(path)
            unless path.exist?
              raise Informative, 'Unable to find the Xcode project ' \
              "`#{path}` for the target `#{target_definition.label}`."
            end
          else
            xcodeprojs = installation_root.children.select { |e| e.fnmatch('*.xcodeproj') }
            if xcodeprojs.size == 1
              path = xcodeprojs.first
            else
              raise Informative, 'Could not automatically select an Xcode project. ' \
                "Specify one in your Podfile like so:\n\n" \
                "    project 'path/to/Project.xcodeproj'\n"
            end
          end
          path
        end

        #-----------------------------------------------------------------------#

        private

        # Returns a list of the targets from the project of #target_definition
        # that needs to be integrated.
        #
        # @note   The method first looks if there is a target specified with
        #         the `link_with` option of the {TargetDefinition}. Otherwise
        #         it looks for the target that has the same name of the target
        #         definition.  Finally if no target was found the first
        #         encountered target is returned (it is assumed to be the one
        #         to integrate in simple projects).
        #
        # @param  [Xcodeproj::Project] user_project
        #         the user project
        #
        # @return [Array<PBXNativeTarget>]
        #
        def compute_targets(user_project)
          native_targets = user_project.native_targets
          target = native_targets.find { |t| t.name == target_definition.name.to_s }
          unless target
            found = native_targets.map { |t| "`#{t.name}`" }.to_sentence
            raise Informative, "Unable to find a target named `#{target_definition.name}` in project `#{Pathname(user_project.path).basename}`, did find #{found}."
          end
          [target]
        end

        # @param  [Array<PBXNativeTarget] user_targets the user's targets of the project of
        #         #target_definition which needs to be integrated
        #
        # @return [Hash{String=>Symbol}] A hash representing the user build
        #         configurations where each key corresponds to the name of a
        #         configuration and its value to its type (`:debug` or `:release`).
        #
        def compute_build_configurations(user_targets)
          if user_targets
            user_targets.flat_map { |t| t.build_configurations.map(&:name) }.each_with_object({}) do |name, hash|
              hash[name] = name == 'Debug' ? :debug : :release
            end.merge(target_definition.build_configurations || {})
          else
            target_definition.build_configurations || {}
          end
        end

        # @param  [Array<PBXNativeTarget] user_targets the user's targets of the project of
        #         #target_definition which needs to be integrated
        #
        # @return [Platform] The platform of the user's targets
        #
        # @note   This resolves to the lowest deployment target across the user
        #         targets.
        #
        # @todo   Is assigning the platform to the target definition the best way
        #         to go?
        #
        def compute_platform(user_targets)
          return target_definition.platform if target_definition.platform
          name = nil
          deployment_target = nil

          user_targets.each do |target|
            name ||= target.platform_name
            raise Informative, 'Targets with different platforms' unless name == target.platform_name
            if !deployment_target || deployment_target > Version.new(target.deployment_target)
              deployment_target = Version.new(target.deployment_target)
            end
          end

          unless name
            raise Informative,
                  "Unable to determine the platform for the `#{target_definition.name}` target."
          end

          UI.warn "Automatically assigning platform `#{Platform.string_name(name)}` with version `#{deployment_target}` " \
            "on target `#{target_definition.name}` because no platform was specified. " \
            "Please specify a platform for this target in your Podfile. See `#{PLATFORM_INFO_URL}`."

          target_definition.set_platform(name, deployment_target)
          Platform.new(name, deployment_target)
        end

        # Computes the architectures relevant for the user's targets.
        #
        # @param  [Array<PBXNativeTarget] user_targets the user's targets of the project of
        #         #target_definition which needs to be integrated
        #
        # @return [Array<String>]
        #
        def compute_archs(user_targets)
          user_targets.flat_map do |target|
            Array(target.common_resolved_build_setting('ARCHS'))
          end.compact.uniq.sort
        end

        # Checks if any of the targets for the {TargetDefinition} computed before
        # by #compute_user_project_targets is recommended to be build as a framework
        # due the presence of Swift source code in any of the source build phases.
        #
        # @param  [TargetDefinition] target_definition
        #         the target definition
        #
        # @param  [Array<PBXNativeTarget>] native_targets
        #         the targets which are checked for presence of Swift source code
        #
        # @return [Boolean] Whether the user project targets to integrate into
        #         uses Swift
        #
        def compute_recommends_frameworks(target_definition, native_targets)
          file_predicate = nil
          file_predicate = proc do |file_ref|
            if file_ref.respond_to?(:last_known_file_type)
              file_ref.last_known_file_type == 'sourcecode.swift'
            elsif file_ref.respond_to?(:files)
              file_ref.files.any?(&file_predicate)
            else
              false
            end
          end
          target_definition.platform.supports_dynamic_frameworks? || native_targets.any? do |target|
            target.source_build_phase.files.any? do |build_file|
              file_predicate.call(build_file.file_ref)
            end
          end
        end

        # Compute the Swift version for the target build configurations. If more
        # than one Swift version is defined for a given target, then it will raise.
        #
        # @param  [Array<PBXNativeTarget>] targets
        #         the targets that are checked for Swift versions.
        #
        # @return [String] the targets Swift version or nil
        #
        def compute_swift_version_from_targets(targets)
          versions_to_targets = targets.inject({}) do |memo, target|
            # User project may have an xcconfig that specifies the `SWIFT_VERSION`.
            # Xcodeproj handles that xcconfig either not being set or the file not being present on disk.
            # After the first integration the xcconfig set is most probably
            # the one that was generated from CocoaPods. See https://github.com/CocoaPods/CocoaPods/issues/7731 for
            # more details.
            versions = target.resolved_build_setting('SWIFT_VERSION', true).values
            versions.each do |version|
              memo[version] = [] if memo[version].nil?
              memo[version] << target.name unless memo[version].include? target.name
            end
            memo
          end

          case versions_to_targets.count
          when 0
            nil
          when 1
            versions_to_targets.keys.first
          else
            target_version_pairs = versions_to_targets.map do |version_names, target_names|
              target_names.map { |target_name| [target_name, version_names] }
            end

            sorted_pairs = target_version_pairs.flat_map { |i| i }.sort_by do |target_name, version_name|
              "#{target_name} #{version_name}"
            end

            formatted_output = sorted_pairs.map do |target, version_name|
              "#{target}: Swift #{version_name}"
            end.join("\n")

            raise Informative, "There may only be up to 1 unique SWIFT_VERSION per target. Found target(s) with multiple Swift versions:\n#{formatted_output}"
          end
        end
      end
    end
  end
end
