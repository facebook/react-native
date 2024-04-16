module Pod
  class Installer
    class Xcode
      # Wires up the dependencies for aggregate targets from the target installation results
      #
      class AggregateTargetDependencyInstaller
        require 'cocoapods/native_target_extension.rb'

        # @return [Hash{String => TargetInstallationResult}] The target installation results for pod targets.
        #
        attr_reader :pod_target_installation_results

        # @return [Hash{String => TargetInstallationResult}] The target installation results for aggregate targets.
        #
        attr_reader :aggregate_target_installation_results

        # @return [ProjectMetadataCache] The project metadata cache.
        #
        attr_reader :metadata_cache

        # @return [Sandbox] The sandbox used for this installation.
        #
        attr_reader :sandbox

        # Initialize a new instance.
        #
        # @param [Sandbox] sandbox @see #sandbox
        # @param [Hash{String => TargetInstallationResult}] aggregate_target_installation_results @see #aggregate_target_installation_results
        # @param [Hash{String => TargetInstallationResult}] pod_target_installation_results @see #pod_target_installation_results
        # @param [ProjectMetadataCache] metadata_cache @see #metadata_cache
        #
        def initialize(sandbox, aggregate_target_installation_results, pod_target_installation_results, metadata_cache)
          @sandbox = sandbox
          @aggregate_target_installation_results = aggregate_target_installation_results
          @pod_target_installation_results = pod_target_installation_results
          @metadata_cache = metadata_cache
        end

        def install!
          aggregate_target_installation_results.values.each do |aggregate_target_installation_result|
            aggregate_target = aggregate_target_installation_result.target
            aggregate_native_target = aggregate_target_installation_result.native_target
            project = aggregate_native_target.project
            # Wire up dependencies that are part of inherit search paths for this aggregate target.
            aggregate_target.search_paths_aggregate_targets.each do |search_paths_target|
              aggregate_native_target.add_dependency(aggregate_target_installation_results[search_paths_target.name].native_target)
            end
            # Wire up all pod target dependencies to aggregate target.
            aggregate_target.pod_targets.each do |pod_target|
              if pod_target_installation_result = pod_target_installation_results[pod_target.name]
                pod_target_native_target = pod_target_installation_result.native_target
                aggregate_native_target.add_dependency(pod_target_native_target)
              else
                # Hit the cache
                is_local = sandbox.local?(pod_target.pod_name)
                cached_dependency = metadata_cache.target_label_by_metadata[pod_target.label]
                project.add_cached_pod_subproject(sandbox, cached_dependency, is_local)
                Project.add_cached_dependency(sandbox, aggregate_native_target, cached_dependency)
              end
            end
          end
        end
      end
    end
  end
end
