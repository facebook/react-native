module Pod
  class Installer
    class Xcode
      # The {SinglePodsProjectGenerator} handles generation of the 'Pods/Pods.xcodeproj'
      #
      class SinglePodsProjectGenerator < PodsProjectGenerator
        # Generates single `Pods/Pods.xcodeproj`.
        #
        # @return [PodsProjectGeneratorResult]
        #
        def generate!
          project_path = sandbox.project_path
          platforms = aggregate_targets.map(&:platform)
          project_generator = ProjectGenerator.new(sandbox, project_path, pod_targets, build_configurations,
                                                   platforms, project_object_version, config.podfile_path)
          project = project_generator.generate!
          install_file_references(project, pod_targets)

          pod_target_installation_results = install_all_pod_targets(project, pod_targets)
          aggregate_target_installation_results = install_aggregate_targets(project, aggregate_targets)
          target_installation_results = InstallationResults.new(pod_target_installation_results, aggregate_target_installation_results)

          integrate_targets(target_installation_results.pod_target_installation_results)
          wire_target_dependencies(target_installation_results)
          PodsProjectGeneratorResult.new(project, {}, target_installation_results)
        end

        private

        def install_all_pod_targets(project, pod_targets)
          UI.message '- Installing Pod Targets' do
            install_pod_targets(project, pod_targets)
          end
        end
      end
    end
  end
end
