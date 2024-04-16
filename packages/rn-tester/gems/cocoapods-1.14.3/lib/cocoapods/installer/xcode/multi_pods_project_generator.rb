module Pod
  class Installer
    class Xcode
      # The {MultiPodsProjectGenerator} handles generation of the 'Pods/Pods.xcodeproj' and Xcode projects
      # for every {PodTarget}. All Pod Target projects are nested under the 'Pods.xcodeproj'.
      #
      class MultiPodsProjectGenerator < PodsProjectGenerator
        # Generates `Pods/Pods.xcodeproj` and all pod target subprojects.
        #
        # @return [PodsProjectGeneratorResult]
        #
        def generate!
          # Generate container Pods.xcodeproj.
          container_project = create_container_project(aggregate_targets, sandbox.project_path)

          project_paths_by_pod_targets = pod_targets.group_by do |pod_target|
            sandbox.pod_target_project_path(pod_target.project_name)
          end
          projects_by_pod_targets = Hash[project_paths_by_pod_targets.map do |project_path, pod_targets|
            project = create_pods_project(pod_targets, project_path, container_project)
            [project, pod_targets]
          end]

          # Note: We must call `install_file_references` on all pod targets before installing them.
          pod_target_installation_results = install_all_pod_targets(projects_by_pod_targets)
          aggregate_target_installation_results = install_aggregate_targets_into_project(container_project, aggregate_targets)
          target_installation_results = InstallationResults.new(pod_target_installation_results, aggregate_target_installation_results)

          integrate_targets(target_installation_results.pod_target_installation_results)
          wire_target_dependencies(target_installation_results)
          PodsProjectGeneratorResult.new(container_project, projects_by_pod_targets, target_installation_results)
        end

        private

        def create_container_project(aggregate_targets, path)
          return unless aggregate_targets
          platforms = aggregate_targets.map(&:platform)
          ProjectGenerator.new(sandbox, path, [], build_configurations, platforms,
                               project_object_version, config.podfile_path).generate!
        end

        def create_pods_project(pod_targets, path, parent_project)
          platforms = pod_targets.map(&:platform)
          project = ProjectGenerator.new(sandbox, path, pod_targets, build_configurations, platforms,
                                         project_object_version, false, :pod_target_subproject => true).generate!
          # Instead of saving every subproject to disk, we can optimize this by creating a temporary folder
          # the file reference can use so that we only have to call `save` once for all projects.
          project.path.mkpath
          if parent_project
            pod_name = pod_name_from_grouping(pod_targets)
            is_local = sandbox.local?(pod_name)
            parent_project.add_pod_subproject(project, is_local)
          end

          install_file_references(project, pod_targets)
          project
        end

        def install_all_pod_targets(projects_by_pod_targets)
          UI.message '- Installing Pod Targets' do
            projects_by_pod_targets.each_with_object({}) do |(project, pod_targets), target_installation_results|
              target_installation_results.merge!(install_pod_targets(project, pod_targets))
            end
          end
        end

        def install_aggregate_targets_into_project(project, aggregate_targets)
          return {} unless project
          install_aggregate_targets(project, aggregate_targets)
        end

        def pod_name_from_grouping(pod_targets)
          # The presumption here for multi pods project is that we group by `pod_name`, thus the grouping of `pod_targets`
          # should share the same `pod_name`.
          raise '[BUG] Expected at least 1 pod target' if pod_targets.empty?
          pod_targets.first.pod_name
        end
      end
    end
  end
end
