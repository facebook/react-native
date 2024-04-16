module Pod
  class Installer
    # Adds all the search paths into the sandbox HeaderStore and each pod target's HeaderStore.
    #
    class SandboxHeaderPathsInstaller
      # @return [Sandbox] The sandbox to use for this analysis.
      #
      attr_reader :sandbox

      # @return [Array<PodTarget>] The list of pod targets to analyze.
      #
      attr_reader :pod_targets

      # Initialize a new instance
      #
      # @param  [Sandbox] sandbox @see #sandbox
      # @param  [Array<PodTarget>] pod_targets @see #pod_targets
      #
      def initialize(sandbox, pod_targets)
        @pod_targets = pod_targets
        @sandbox = sandbox
      end

      def install!
        # Link all pod target header search paths into the HeaderStore.
        pod_targets.each do |pod_target|
          next if pod_target.build_as_framework? && pod_target.should_build?
          install_target(pod_target)
        end
      end

      private

      def install_target(pod_target)
        pod_target_header_mappings = pod_target.header_mappings_by_file_accessor.values
        public_header_mappings = pod_target.public_header_mappings_by_file_accessor.values
        added_build_headers = !pod_target_header_mappings.all?(&:empty?)
        added_public_headers = !public_header_mappings.all?(&:empty?)

        pod_target.build_headers.add_search_path(pod_target.headers_sandbox, pod_target.platform) if added_build_headers
        sandbox.public_headers.add_search_path(pod_target.headers_sandbox, pod_target.platform) if added_public_headers
      end
    end
  end
end
