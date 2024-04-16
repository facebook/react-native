module Pod
  class Installer
    class Xcode
      class PodsProjectGenerator
        # This class is responsible for integrating a pod target. This includes integrating
        # the test targets included by each pod target.
        #
        class PodTargetIntegrator
          # @return [TargetInstallationResult] the installation result of the target that should be integrated.
          #
          attr_reader :target_installation_result

          # @return [Boolean] whether to use input/output paths for build phase scripts
          #
          attr_reader :use_input_output_paths
          alias use_input_output_paths? use_input_output_paths

          # Initialize a new instance
          #
          # @param  [TargetInstallationResult] target_installation_result @see #target_installation_result
          # @param  [Boolean] use_input_output_paths @see #use_input_output_paths
          #
          def initialize(target_installation_result, use_input_output_paths: true)
            @target_installation_result = target_installation_result
            @use_input_output_paths = use_input_output_paths
          end

          # Integrates the pod target.
          #
          # @return [void]
          #
          def integrate!
            UI.section(integration_message) do
              target_installation_result.non_library_specs_by_native_target.each do |native_target, spec|
                add_embed_frameworks_script_phase(native_target, spec)
                add_copy_resources_script_phase(native_target, spec)
                add_on_demand_resources(native_target, spec) if spec.app_specification?
                UserProjectIntegrator::TargetIntegrator.create_or_update_user_script_phases(script_phases_for_specs(spec), native_target)
              end
              add_copy_dsyms_script_phase(target_installation_result.native_target)
              add_copy_xcframeworks_script_phase(target_installation_result.native_target)
              UserProjectIntegrator::TargetIntegrator.create_or_update_user_script_phases(script_phases_for_specs(target.library_specs), target_installation_result.native_target)
            end
          end

          # @return [String] a string representation suitable for debugging.
          #
          def inspect
            "#<#{self.class} for target `#{target.label}'>"
          end

          private

          # @!group Integration steps
          #---------------------------------------------------------------------#

          # Find or create a 'Copy Pods Resources' build phase
          #
          # @param [PBXNativeTarget] native_target
          #         the native target for which to add the copy resources script
          #
          # @param [Pod::Specification] spec
          #         the specification to integrate
          #
          # @return [void]
          #
          def add_copy_resources_script_phase(native_target, spec)
            script_path = "${PODS_ROOT}/#{target.copy_resources_script_path_for_spec(spec).relative_path_from(target.sandbox.root)}"

            input_paths_by_config = {}
            output_paths_by_config = {}

            dependent_targets = if spec.test_specification?
                                  target.dependent_targets_for_test_spec(spec)
                                else
                                  target.dependent_targets_for_app_spec(spec)
                                end
            host_target_spec_names = target.app_host_dependent_targets_for_spec(spec).flat_map do |pt|
              pt.specs.map(&:name)
            end.uniq
            resource_paths = dependent_targets.flat_map do |dependent_target|
              spec_paths_to_include = dependent_target.library_specs.map(&:name)
              spec_paths_to_include -= host_target_spec_names
              spec_paths_to_include << spec.name if dependent_target == target
              dependent_target.resource_paths.values_at(*spec_paths_to_include).flatten.compact
            end.uniq

            if use_input_output_paths? && !resource_paths.empty?
              input_file_list_path = target.copy_resources_script_input_files_path_for_spec(spec)
              input_file_list_relative_path = "${PODS_ROOT}/#{input_file_list_path.relative_path_from(target.sandbox.root)}"
              input_paths_key = UserProjectIntegrator::TargetIntegrator::XCFileListConfigKey.new(input_file_list_path, input_file_list_relative_path)
              input_paths_by_config[input_paths_key] = [script_path] + resource_paths

              output_file_list_path = target.copy_resources_script_output_files_path_for_spec(spec)
              output_file_list_relative_path = "${PODS_ROOT}/#{output_file_list_path.relative_path_from(target.sandbox.root)}"
              output_paths_key = UserProjectIntegrator::TargetIntegrator::XCFileListConfigKey.new(output_file_list_path, output_file_list_relative_path)
              output_paths_by_config[output_paths_key] = UserProjectIntegrator::TargetIntegrator.resource_output_paths(resource_paths)
            end

            if resource_paths.empty?
              UserProjectIntegrator::TargetIntegrator.remove_copy_resources_script_phase_from_target(native_target)
            else
              UserProjectIntegrator::TargetIntegrator.create_or_update_copy_resources_script_phase_to_target(
                native_target, script_path, input_paths_by_config, output_paths_by_config)
            end
          end

          # Find or create a 'Embed Pods Frameworks' Run Script Build Phase
          #
          # @param [PBXNativeTarget] native_target
          #         the native target for which to add the embed frameworks script
          #
          # @param [Pod::Specification] spec
          #         the specification to integrate
          #
          # @return [void]
          #
          def add_embed_frameworks_script_phase(native_target, spec)
            script_path = "${PODS_ROOT}/#{target.embed_frameworks_script_path_for_spec(spec).relative_path_from(target.sandbox.root)}"

            input_paths_by_config = {}
            output_paths_by_config = {}

            dependent_targets = if spec.test_specification?
                                  target.dependent_targets_for_test_spec(spec)
                                else
                                  target.dependent_targets_for_app_spec(spec)
                                end
            host_target_spec_names = target.app_host_dependent_targets_for_spec(spec).flat_map do |pt|
              pt.specs.map(&:name)
            end.uniq
            framework_paths = dependent_targets.flat_map do |dependent_target|
              spec_paths_to_include = dependent_target.library_specs.map(&:name)
              spec_paths_to_include -= host_target_spec_names
              spec_paths_to_include << spec.name if dependent_target == target
              dependent_target.framework_paths.values_at(*spec_paths_to_include).flatten.compact
            end.uniq
            xcframework_paths = dependent_targets.flat_map do |dependent_target|
              spec_paths_to_include = dependent_target.library_specs.map(&:name)
              spec_paths_to_include -= host_target_spec_names
              spec_paths_to_include << spec.name if dependent_target == target
              dependent_target.xcframeworks.values_at(*spec_paths_to_include).flatten.compact
            end.uniq

            if use_input_output_paths? && !framework_paths.empty? || !xcframework_paths.empty?
              input_file_list_path = target.embed_frameworks_script_input_files_path_for_spec(spec)
              input_file_list_relative_path = "${PODS_ROOT}/#{input_file_list_path.relative_path_from(target.sandbox.root)}"
              input_paths_key = UserProjectIntegrator::TargetIntegrator::XCFileListConfigKey.new(input_file_list_path, input_file_list_relative_path)
              input_paths_by_config[input_paths_key] = [script_path] + UserProjectIntegrator::TargetIntegrator.embed_frameworks_input_paths(framework_paths, xcframework_paths)

              output_file_list_path = target.embed_frameworks_script_output_files_path_for_spec(spec)
              output_file_list_relative_path = "${PODS_ROOT}/#{output_file_list_path.relative_path_from(target.sandbox.root)}"
              output_paths_key = UserProjectIntegrator::TargetIntegrator::XCFileListConfigKey.new(output_file_list_path, output_file_list_relative_path)
              output_paths_by_config[output_paths_key] = UserProjectIntegrator::TargetIntegrator.embed_frameworks_output_paths(framework_paths, xcframework_paths)
            end

            if framework_paths.empty? && xcframework_paths.empty?
              UserProjectIntegrator::TargetIntegrator.remove_embed_frameworks_script_phase_from_target(native_target)
            else
              UserProjectIntegrator::TargetIntegrator.create_or_update_embed_frameworks_script_phase_to_target(
                native_target, script_path, input_paths_by_config, output_paths_by_config)
            end
          end

          # Find or create a 'Prepare Artifacts' Run Script Build Phase
          #
          # @param [PBXNativeTarget] native_target
          #         the native target for which to add the prepare artifacts script
          #
          # @return [void]
          #
          def add_copy_xcframeworks_script_phase(native_target)
            script_path = "${PODS_ROOT}/#{target.copy_xcframeworks_script_path.relative_path_from(target.sandbox.root)}"

            input_paths_by_config = {}
            output_paths_by_config = {}

            xcframeworks = target.xcframeworks.values.flatten

            if use_input_output_paths? && !xcframeworks.empty?
              input_file_list_path = target.copy_xcframeworks_script_input_files_path
              input_file_list_relative_path = "${PODS_ROOT}/#{input_file_list_path.relative_path_from(target.sandbox.root)}"
              input_paths_key = UserProjectIntegrator::TargetIntegrator::XCFileListConfigKey.new(input_file_list_path, input_file_list_relative_path)
              input_paths = input_paths_by_config[input_paths_key] = [script_path]

              framework_paths = xcframeworks.map { |xcf| "${PODS_ROOT}/#{xcf.path.relative_path_from(target.sandbox.root)}" }
              input_paths.concat framework_paths

              output_file_list_path = target.copy_xcframeworks_script_output_files_path
              output_file_list_relative_path = "${PODS_ROOT}/#{output_file_list_path.relative_path_from(target.sandbox.root)}"
              output_paths_key = UserProjectIntegrator::TargetIntegrator::XCFileListConfigKey.new(output_file_list_path, output_file_list_relative_path)
              output_paths_by_config[output_paths_key] = xcframeworks.map do |xcf|
                "#{Target::BuildSettings::XCFRAMEWORKS_BUILD_DIR_VARIABLE}/#{xcf.target_name}/#{xcf.name}.framework"
              end
            end

            if xcframeworks.empty?
              UserProjectIntegrator::TargetIntegrator.remove_copy_xcframeworks_script_phase_from_target(native_target)
            else
              UserProjectIntegrator::TargetIntegrator.create_or_update_copy_xcframeworks_script_phase_to_target(
                native_target, script_path, input_paths_by_config, output_paths_by_config)
            end
          end

          # Adds a script phase that copies and strips dSYMs that are part of this target. Note this only deals with
          # vendored dSYMs.
          #
          # @param [PBXNativeTarget] native_target
          #         the native target for which to add the copy dSYM files build phase.
          #
          # @return [void]
          #
          def add_copy_dsyms_script_phase(native_target)
            script_path = "${PODS_ROOT}/#{target.copy_dsyms_script_path.relative_path_from(target.sandbox.root)}"
            dsym_paths = PodTargetInstaller.dsym_paths(target)
            bcsymbolmap_paths = PodTargetInstaller.bcsymbolmap_paths(target)

            if dsym_paths.empty? && bcsymbolmap_paths.empty?
              script_phase = native_target.shell_script_build_phases.find do |bp|
                bp.name && bp.name.end_with?(UserProjectIntegrator::TargetIntegrator::COPY_DSYM_FILES_PHASE_NAME)
              end
              native_target.build_phases.delete(script_phase) if script_phase.present?
              return
            end

            phase_name = UserProjectIntegrator::TargetIntegrator::BUILD_PHASE_PREFIX + UserProjectIntegrator::TargetIntegrator::COPY_DSYM_FILES_PHASE_NAME
            phase = UserProjectIntegrator::TargetIntegrator.create_or_update_shell_script_build_phase(native_target, phase_name)
            phase.shell_script = %("#{script_path}"\n)

            input_paths_by_config = {}
            output_paths_by_config = {}
            if use_input_output_paths?
              input_file_list_path = target.copy_dsyms_script_input_files_path
              input_file_list_relative_path = "${PODS_ROOT}/#{input_file_list_path.relative_path_from(target.sandbox.root)}"
              input_paths_key = UserProjectIntegrator::TargetIntegrator::XCFileListConfigKey.new(input_file_list_path, input_file_list_relative_path)
              input_paths = input_paths_by_config[input_paths_key] = []
              input_paths.concat([dsym_paths, *bcsymbolmap_paths].flatten.compact)

              output_file_list_path = target.copy_dsyms_script_output_files_path
              output_file_list_relative_path = "${PODS_ROOT}/#{output_file_list_path.relative_path_from(target.sandbox.root)}"
              output_paths_key = UserProjectIntegrator::TargetIntegrator::XCFileListConfigKey.new(output_file_list_path, output_file_list_relative_path)
              output_paths = output_paths_by_config[output_paths_key] = []

              dsym_output_paths = dsym_paths.map { |dsym_path| "${DWARF_DSYM_FOLDER_PATH}/#{File.basename(dsym_path)}" }
              bcsymbolmap_output_paths = bcsymbolmap_paths.map { |bcsymbolmap_path| "${DWARF_DSYM_FOLDER_PATH}/#{File.basename(bcsymbolmap_path)}" }
              output_paths.concat([dsym_output_paths, *bcsymbolmap_output_paths].flatten.compact)
            end

            UserProjectIntegrator::TargetIntegrator.set_input_output_paths(phase, input_paths_by_config, output_paths_by_config)
          end

          # Adds the ODRs that are related to this app spec. This includes the app spec dependencies as well as the ODRs
          # coming from the app spec itself.
          #
          # @param [Xcodeproj::PBXNativeTarget] native_target
          #         the native target for which to add the ODR file references into.
          #
          # @param [Specification] app_spec
          #         the app spec to integrate ODRs for.
          #
          # @return [void]
          #
          def add_on_demand_resources(native_target, app_spec)
            dependent_targets = target.dependent_targets_for_app_spec(app_spec)
            parent_odr_group = native_target.project.group_for_spec(app_spec.name)

            # Add ODRs of the app spec dependencies first.
            dependent_targets.each do |pod_target|
              file_accessors = pod_target.file_accessors.select do |fa|
                fa.spec.library_specification? ||
                  fa.spec.test_specification? && pod_target.test_app_hosts_by_spec[fa.spec]&.first == app_spec
              end
              target_odr_group_name = "#{pod_target.label}-OnDemandResources"
              UserProjectIntegrator::TargetIntegrator.update_on_demand_resources(target.sandbox, native_target.project,
                                                                                 native_target, file_accessors,
                                                                                 parent_odr_group, target_odr_group_name)
            end

            # Now add the ODRs of our own app spec declaration.
            file_accessor = target.file_accessors.find { |fa| fa.spec == app_spec }
            target_odr_group_name = "#{target.subspec_label(app_spec)}-OnDemandResources"
            UserProjectIntegrator::TargetIntegrator.update_on_demand_resources(target.sandbox, native_target.project,
                                                                               native_target, file_accessor,
                                                                               parent_odr_group, target_odr_group_name)
          end

          # @return [String] the message that should be displayed for the target
          #         integration.
          #
          def integration_message
            "Integrating target `#{target.name}`"
          end

          # @return [PodTarget] the target part of the installation result.
          #
          def target
            target_installation_result.target
          end

          # @param [Specification, Array<Specification>] specs
          #         the specs to return script phrases from.
          #
          # @return [Array<Hash<Symbol=>String>] an array of all combined script phases from the specs.
          #
          def script_phases_for_specs(specs)
            Array(specs).flat_map { |spec| spec.consumer(target.platform).script_phases }
          end
        end
      end
    end
  end
end
