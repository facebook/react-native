module Pod
  class Installer
    class Xcode
      class PodsProjectGenerator
        # A simple container produced after a pod project generation is completed.
        #
        class PodsProjectGeneratorResult
          # @return [Project] project
          #
          attr_reader :project

          # @return [Hash{Project => Array<PodTargets>}] Project by pod targets map
          #
          attr_reader :projects_by_pod_targets

          # @return [InstallationResults] target installation results
          #
          attr_reader :target_installation_results

          # Initialize a new instance
          #
          # @param [Project] project @see #project
          # @param [Hash{Project => Array<PodTargets>}] projects_by_pod_targets @see #projects_by_pod_targets
          # @param [InstallationResults] target_installation_results @see #target_installation_results
          #
          def initialize(project, projects_by_pod_targets, target_installation_results)
            @project = project
            @projects_by_pod_targets = projects_by_pod_targets
            @target_installation_results = target_installation_results
          end

          # @param [Pod::Specification] spec
          #        A spec which was included in the generated project
          #
          # @return [Xcodeproj::PBXNativeTarget] the native target for the spec
          #
          def native_target_for_spec(spec)
            installation_results_by_spec[spec.root].native_target_for_spec(spec)
          end

          private

          def installation_results_by_spec
            @target_installation_results_by_spec ||= begin
              target_installation_results.pod_target_installation_results.values.each_with_object({}) do |installation_results, hash|
                hash[installation_results.target.root_spec] = installation_results
              end
            end
          end
        end
      end
    end
  end
end
