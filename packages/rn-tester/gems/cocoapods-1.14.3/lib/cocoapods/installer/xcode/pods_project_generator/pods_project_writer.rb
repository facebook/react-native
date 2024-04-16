module Pod
  class Installer
    class Xcode
      class PodsProjectWriter
        # @return [Sandbox] sandbox
        #         The Pods sandbox instance.
        #
        attr_reader :sandbox

        # @return [Array<Project>] projects
        #         The list project to write.
        #
        attr_reader :projects

        # @return [Hash<String, TargetInstallationResult>] pod_target_installation_results
        #         Hash of pod target name to installation results.
        #
        attr_reader :pod_target_installation_results

        # @return [InstallationOptions] installation_options
        #
        attr_reader :installation_options

        # Initialize a new instance
        #
        # @param [Sandbox] sandbox @see #sandbox
        # @param [Project] projects @see #project
        # @param [Hash<String, TargetInstallationResult>] pod_target_installation_results @see #pod_target_installation_results
        # @param [InstallationOptions] installation_options @see #installation_options
        #
        def initialize(sandbox, projects, pod_target_installation_results, installation_options)
          @sandbox = sandbox
          @projects = projects
          @pod_target_installation_results = pod_target_installation_results
          @installation_options = installation_options
        end

        # Writes projects to disk.
        #
        # @yield If provided, this block will execute right before writing the projects to disk.
        #
        def write!
          cleanup_projects(projects)

          projects.each do |project|
            library_product_types = [:framework, :dynamic_library, :static_library]
            results_by_native_target = Hash[pod_target_installation_results.map do |_, result|
              [result.native_target, result]
            end]
            project.recreate_user_schemes(false) do |scheme, target|
              next unless target.respond_to?(:symbol_type)
              next unless library_product_types.include? target.symbol_type
              installation_result = results_by_native_target[target]
              next unless installation_result
              installation_result.test_native_targets.each do |test_native_target|
                scheme.add_test_target(test_native_target)
              end
            end
          end

          yield if block_given?

          save_projects(projects)
        end

        private

        # Cleans up projects before writing.
        #
        def cleanup_projects(projects)
          projects.each do |project|
            [project.pods, project.support_files_group,
             project.development_pods, project.dependencies_group].each { |group| group.remove_from_project if group.empty? }
          end
        end

        # Sorts and then saves projects which writes them to disk.
        #
        def save_projects(projects)
          projects.each do |project|
            project.sort(:groups_position => :below)
            UI.message "- Writing Xcode project file to #{UI.path project.path}" do
              project.save
            end
          end
        end
      end
    end
  end
end
