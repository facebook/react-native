module Pod
  class Installer
    class Xcode
      # Wires up the dependencies between targets from the target installation results
      #
      class PodTargetDependencyInstaller
        require 'cocoapods/native_target_extension.rb'

        # @return [Sandbox] The sandbox used for this installation.
        #
        attr_reader :sandbox

        # @return [TargetInstallationResults] The target installation results for pod targets.
        #
        attr_reader :pod_target_installation_results

        # @return [ProjectMetadataCache] The metadata cache for targets.
        #
        attr_reader :metadata_cache

        # Initialize a new instance.
        #
        # @param [Sandbox] sandbox @see #sandbox
        # @param [TargetInstallationResults] pod_target_installation_results @see #pod_target_installation_results
        # @param [ProjectMetadataCache] metadata_cache @see #metadata_cache
        #
        def initialize(sandbox, pod_target_installation_results, metadata_cache)
          @sandbox = sandbox
          @pod_target_installation_results = pod_target_installation_results
          @metadata_cache = metadata_cache
        end

        def install!
          # Wire up pod targets
          pod_target_installation_results.values.each do |pod_target_installation_result|
            pod_target = pod_target_installation_result.target
            native_target = pod_target_installation_result.native_target
            project = native_target.project

            # First, wire up all resource bundles.
            wire_resource_bundle_targets(pod_target_installation_result.resource_bundle_targets,
                                         native_target, pod_target)
            # Wire up all dependencies to this pod target, if any.
            wire_target_dependencies(pod_target, native_target, project, pod_target_installation_results,
                                     metadata_cache)

            # Wire up test native targets.
            unless pod_target_installation_result.test_native_targets.empty?
              wire_test_native_targets(pod_target, pod_target_installation_result, pod_target_installation_results,
                                       project, metadata_cache)
            end

            # Wire up app native targets.
            unless pod_target_installation_result.app_native_targets.empty?
              wire_app_native_targets(pod_target, pod_target_installation_result, pod_target_installation_results,
                                      project, metadata_cache)
            end
          end
        end

        private

        def wire_resource_bundle_targets(resource_bundle_targets, native_target, pod_target)
          resource_bundle_targets.each do |resource_bundle_target|
            native_target.add_dependency(resource_bundle_target)
            if pod_target.build_as_dynamic_framework? && pod_target.should_build?
              native_target.add_resources([resource_bundle_target.product_reference])
            end
          end
        end

        def wire_target_dependencies(pod_target, native_target, project, pod_target_installation_results, metadata_cache)
          dependent_targets = pod_target.dependent_targets
          dependent_targets.each do |dependent_target|
            is_local = sandbox.local?(dependent_target.pod_name)
            if installation_result = pod_target_installation_results[dependent_target.name]
              dependent_project = installation_result.native_target.project
              if dependent_project != project
                project.add_pod_subproject(dependent_project, is_local)
              end
              native_target.add_dependency(installation_result.native_target)
            else
              # Hit the cache
              cached_dependency = metadata_cache.target_label_by_metadata[dependent_target.label]
              project.add_cached_pod_subproject(sandbox, cached_dependency, is_local)
              Project.add_cached_dependency(sandbox, native_target, cached_dependency)
            end
          end
        end

        def wire_test_native_targets(pod_target, installation_result, pod_target_installation_results, project, metadata_cache)
          installation_result.test_specs_by_native_target.each do |test_native_target, test_spec|
            resource_bundle_native_targets = installation_result.test_resource_bundle_targets[test_spec.name] || []
            resource_bundle_native_targets.each do |test_resource_bundle_target|
              test_native_target.add_dependency(test_resource_bundle_target)
            end

            test_dependent_targets = pod_target.test_dependent_targets_by_spec_name.fetch(test_spec.name, []).+([pod_target]).uniq
            test_dependent_targets.each do |test_dependent_target|
              is_local = sandbox.local?(test_dependent_target.pod_name)
              if dependency_installation_result = pod_target_installation_results[test_dependent_target.name]
                dependent_test_project = dependency_installation_result.native_target.project
                if dependent_test_project != project
                  project.add_pod_subproject(dependent_test_project, is_local)
                end
                test_native_target.add_dependency(dependency_installation_result.native_target)
              else
                # Hit the cache
                cached_dependency = metadata_cache.target_label_by_metadata[test_dependent_target.label]
                project.add_cached_pod_subproject(sandbox, cached_dependency, is_local)
                Project.add_cached_dependency(sandbox, test_native_target, cached_dependency)
              end
            end

            if app_host_target_label = pod_target.app_host_target_label(test_spec)
              app_host_pod_target_label, app_host_target_label = *app_host_target_label
              wire_test_native_target_app_host(test_native_target, pod_target, pod_target_installation_results, project, metadata_cache, app_host_pod_target_label, app_host_target_label)
            end
          end
        end

        def wire_test_native_target_app_host(test_native_target, pod_target, pod_target_installation_results, project, metadata_cache, app_host_pod_target_label, app_host_target_label)
          if dependency_installation_result = pod_target_installation_results[app_host_pod_target_label]
            unless app_native_target = dependency_installation_result.app_host_target_labelled(app_host_target_label)
              raise Informative, "Did not find target with label #{app_host_target_label} in the set of targets installed for #{app_host_pod_target_label}."
            end

            dependent_test_project = app_native_target.project
            if dependent_test_project != project
              project.add_subproject_reference(dependent_test_project, project.dependencies_group)
            end

            app_host_target_names = app_native_target.resolved_build_setting('PRODUCT_NAME', true)
            test_native_target.build_configurations.each do |configuration|
              app_host_target_name = app_host_target_names[configuration.name] || target.name
              case test_native_target.symbol_type
              when :unit_test_bundle
                test_host = "$(BUILT_PRODUCTS_DIR)/#{app_host_target_name}.app/"
                test_host << 'Contents/MacOS/' if pod_target.platform == :osx
                test_host << app_host_target_name.to_s
                configuration.build_settings['BUNDLE_LOADER'] = '$(TEST_HOST)'
                configuration.build_settings['TEST_HOST'] = test_host
              when :ui_test_bundle
                configuration.build_settings['TEST_TARGET_NAME'] = app_host_target_name
              end
            end
            target_attributes = project.root_object.attributes['TargetAttributes'] || {}
            target_attributes[test_native_target.uuid.to_s] = { 'TestTargetID' => app_native_target.uuid.to_s }
            project.root_object.attributes['TargetAttributes'] = target_attributes
            test_native_target.add_dependency(app_native_target)
          elsif cached_dependency = metadata_cache.target_label_by_metadata[app_host_target_label]
            # Hit the cache
            project.add_cached_subproject_reference(sandbox, cached_dependency, project.dependencies_group)
            Project.add_cached_dependency(sandbox, test_native_target, cached_dependency)
          else
            raise "Expected to either have an installation or cache result for #{app_host_target_label} (from pod #{app_host_pod_target_label}) " \
              "for target #{test_native_target.name} in project #{project.project_name}"
          end
        end

        def wire_app_native_targets(pod_target, installation_result, pod_target_installation_results, project, metadata_cache)
          installation_result.app_specs_by_native_target.each do |app_native_target, app_spec|
            resource_bundle_native_targets = installation_result.app_resource_bundle_targets[app_spec.name] || []
            resource_bundle_native_targets.each do |app_resource_bundle_target|
              app_native_target.add_dependency(app_resource_bundle_target)
            end

            app_dependent_targets = pod_target.app_dependent_targets_by_spec_name.fetch(app_spec.name, []).unshift(pod_target).uniq
            app_dependent_targets.each do |app_dependent_target|
              is_local = sandbox.local?(app_dependent_target.pod_name)
              if dependency_installation_result = pod_target_installation_results[app_dependent_target.name]
                resource_bundle_native_targets = dependency_installation_result.app_resource_bundle_targets[app_spec.name]
                unless resource_bundle_native_targets.nil?
                  resource_bundle_native_targets.each do |app_resource_bundle_target|
                    app_native_target.add_dependency(app_resource_bundle_target)
                  end
                end
                dependency_project = dependency_installation_result.native_target.project
                if dependency_project != project
                  project.add_pod_subproject(dependency_project, is_local)
                end
                app_native_target.add_dependency(dependency_installation_result.native_target)
              else
                # Hit the cache
                cached_dependency = metadata_cache.target_label_by_metadata[app_dependent_target.label]
                project.add_cached_pod_subproject(sandbox, cached_dependency, is_local)
                Project.add_cached_dependency(sandbox, app_native_target, cached_dependency)
              end
            end
          end
        end
      end
    end
  end
end
