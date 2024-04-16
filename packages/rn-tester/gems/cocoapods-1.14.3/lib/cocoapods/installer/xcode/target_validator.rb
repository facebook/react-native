module Pod
  class Installer
    class Xcode
      # The {Xcode::TargetValidator} ensures that the pod and aggregate target
      # configuration is valid for installation.
      #
      class TargetValidator
        # @return [Array<AggregateTarget>] The aggregate targets that should be validated.
        #
        attr_reader :aggregate_targets

        # @return [Array<PodTarget>] The pod targets that should be validated.
        #
        attr_reader :pod_targets

        # @return [InstallationOptions] The installation options used during this installation.
        #
        attr_reader :installation_options

        # Create a new TargetValidator with aggregate and pod targets to
        # validate.
        #
        # @param [Array<AggregateTarget>] aggregate_targets #see #aggregate_targets
        # @param [Array<PodTarget>] pod_targets see #pod_targets
        # @param [InstallationOptions] installation_options see #installation_options
        #
        def initialize(aggregate_targets, pod_targets, installation_options)
          @aggregate_targets = aggregate_targets
          @pod_targets = pod_targets
          @installation_options = installation_options
        end

        # Perform the validation steps for the provided aggregate and pod
        # targets.
        #
        def validate!
          verify_no_duplicate_framework_and_library_names
          verify_no_static_framework_transitive_dependencies
          verify_swift_pods_swift_version
          verify_swift_pods_have_module_dependencies
          verify_no_multiple_project_names if installation_options.generate_multiple_pod_projects?
        end

        private

        def verify_no_duplicate_framework_and_library_names
          aggregate_targets.each do |aggregate_target|
            aggregate_target.user_build_configurations.each_key do |config|
              pod_targets = aggregate_target.pod_targets_for_build_configuration(config)
              file_accessors = pod_targets.flat_map(&:file_accessors).select { |fa| fa.spec.library_specification? }

              frameworks = file_accessors.flat_map(&:vendored_frameworks).uniq.map(&:basename)
              frameworks += pod_targets.select { |pt| pt.should_build? && pt.build_as_framework? }.map(&:product_module_name).uniq
              verify_no_duplicate_names(frameworks, aggregate_target.label, 'frameworks')

              libraries = file_accessors.flat_map(&:vendored_libraries).uniq.map(&:basename)
              libraries += pod_targets.select { |pt| pt.should_build? && pt.build_as_library? }.map(&:product_name)
              verify_no_duplicate_names(libraries, aggregate_target.label, 'libraries')
            end
          end
        end

        def verify_no_duplicate_names(names, label, type)
          duplicates = names.group_by { |n| n.to_s.downcase }.select { |_, v| v.size > 1 }.keys

          unless duplicates.empty?
            raise Informative, "The '#{label}' target has " \
              "#{type} with conflicting names: #{duplicates.to_sentence}."
          end
        end

        def verify_no_static_framework_transitive_dependencies
          aggregate_targets.each do |aggregate_target|
            aggregate_target.user_build_configurations.each_key do |config|
              pod_targets = aggregate_target.pod_targets_for_build_configuration(config)
              built_targets, unbuilt_targets = pod_targets.partition(&:should_build?)
              dynamic_pod_targets = built_targets.select(&:build_as_dynamic?)

              dependencies = dynamic_pod_targets.flat_map(&:dependent_targets).uniq
              depended_upon_targets = unbuilt_targets & dependencies

              static_libs = depended_upon_targets.flat_map(&:file_accessors).flat_map(&:vendored_static_artifacts)
              unless static_libs.empty?
                raise Informative, "The '#{aggregate_target.label}' target has " \
                  "transitive dependencies that include statically linked binaries: (#{static_libs.to_sentence})"
              end

              static_deps = dynamic_pod_targets.flat_map(&:recursive_dependent_targets).uniq.select(&:build_as_static?)
              unless static_deps.empty?
                raise Informative, "The '#{aggregate_target.label}' target has " \
                  "transitive dependencies that include statically linked binaries: (#{static_deps.flat_map(&:name).to_sentence})"
              end
            end
          end
        end

        def verify_swift_pods_swift_version
          error_message_for_target_definition = lambda do |target_definition|
            "`#{target_definition.name}` (Swift #{target_definition.swift_version})"
          end
          swift_pod_targets = pod_targets.select(&:uses_swift?)
          error_messages = swift_pod_targets.map do |swift_pod_target|
            # Legacy targets that do not specify Swift versions derive their Swift version from the target definitions
            # they are integrated with. An error is displayed if the target definition Swift versions collide or none
            # of target definitions specify the `SWIFT_VERSION` attribute.
            if swift_pod_target.spec_swift_versions.empty?
              swift_target_definitions = swift_pod_target.target_definitions.reject { |target| target.swift_version.blank? }
              next if swift_target_definitions.uniq(&:swift_version).count == 1
              if swift_target_definitions.empty?
                "- `#{swift_pod_target.name}` does not specify a Swift version and none of the targets " \
                  "(#{swift_pod_target.target_definitions.map { |td| "`#{td.name}`" }.to_sentence}) integrating it have the " \
                  '`SWIFT_VERSION` attribute set. Please contact the author or set the `SWIFT_VERSION` attribute in at ' \
                  'least one of the targets that integrate this pod.'
              else
                target_errors = swift_target_definitions.map(&error_message_for_target_definition).to_sentence
                "- `#{swift_pod_target.name}` is integrated by multiple targets that use a different Swift version: #{target_errors}."
              end
            elsif !swift_pod_target.swift_version.nil? && swift_pod_target.swift_version.empty?
              "- `#{swift_pod_target.name}` does not specify a Swift version (#{swift_pod_target.spec_swift_versions.map { |v| "`#{v}`" }.to_sentence}) " \
                "that is satisfied by any of targets (#{swift_pod_target.target_definitions.map { |td| "`#{td.name}`" }.to_sentence}) integrating it."
            end
          end.compact

          unless error_messages.empty?
            raise Informative, "Unable to determine Swift version for the following pods:\n\n#{error_messages.join("\n")}"
          end
        end

        def verify_swift_pods_have_module_dependencies
          error_messages = []
          pod_targets.each do |pod_target|
            next unless pod_target.uses_swift? && pod_target.should_build?

            non_module_dependencies = []
            pod_target.dependent_targets.each do |dependent_target|
              next if !dependent_target.should_build? || dependent_target.defines_module?
              non_module_dependencies << dependent_target.name
            end

            next if non_module_dependencies.empty?

            error_messages << "The Swift pod `#{pod_target.name}` depends upon #{non_module_dependencies.map { |d| "`#{d}`" }.to_sentence}, " \
                              "which #{non_module_dependencies.count == 1 ? 'does' : 'do'} not define modules. " \
                              'To opt into those targets generating module maps '\
                              '(which is necessary to import them from Swift when building as static libraries), ' \
                              'you may set `use_modular_headers!` globally in your Podfile, '\
                              'or specify `:modular_headers => true` for particular dependencies.'
          end
          return if error_messages.empty?

          raise Informative, 'The following Swift pods cannot yet be integrated '\
                             "as static libraries:\n\n#{error_messages.join("\n\n")}"
        end

        def verify_no_multiple_project_names
          error_messages = pod_targets.map do |pod_target|
            project_names = pod_target.target_definitions.map { |td| td.project_name_for_pod(pod_target.pod_name) }.compact.uniq
            next unless project_names.count > 1
            "- `#{pod_target.name}` specifies multiple project names (#{project_names.map { |pn| "`#{pn}`" }.to_sentence}) " \
            "in different targets (#{pod_target.target_definitions.map { |td| "`#{td.name}`" }.to_sentence})."
          end.compact
          return if error_messages.empty?

          raise Informative, 'The following pods cannot be integrated:' \
                             "\n\n#{error_messages.join("\n\n")}"
        end
      end
    end
  end
end
