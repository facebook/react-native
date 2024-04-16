
module Pod
  class Installer
    # Controller class responsible for downloading the activated specifications
    # of a single Pod.
    #
    # @note This class needs to consider all the activated specs of a Pod.
    #
    class PodSourceDownloader
      UNENCRYPTED_PROTOCOLS = %w(http git).freeze

      # @return [Sandbox] The installation target.
      #
      attr_reader :sandbox

      # @return [Podfile] the podfile that should be integrated with the user
      #         projects.
      #
      attr_reader :podfile

      # @return [Hash{Symbol=>Array}] The specifications that need to be
      #         installed grouped by platform.
      #
      attr_reader :specs_by_platform

      # @return [Boolean] Whether the installer is allowed to touch the cache.
      #
      attr_reader :can_cache
      alias can_cache? can_cache

      # Initialize a new instance
      #
      # @param [Sandbox] sandbox @see #sandbox
      # @param [Podfile] podfile @see #podfile
      # @param [Hash{Symbol=>Array}] specs_by_platform @see #specs_by_platform
      # @param [Boolean] can_cache @see #can_cache
      #
      def initialize(sandbox, podfile, specs_by_platform, can_cache: true)
        @sandbox = sandbox
        @podfile = podfile
        @specs_by_platform = specs_by_platform
        @can_cache = can_cache
      end

      # @return [String] A string suitable for debugging.
      #
      def inspect
        "<#{self.class} sandbox=#{sandbox.root} pod=#{root_spec.name}"
      end

      # @return [String] The name of the pod this downloader is downloading.
      #
      def name
        root_spec.name
      end

      #-----------------------------------------------------------------------#

      public

      # @!group Downloading

      # Creates the target in the Pods project and the relative support files.
      #
      # @return [void]
      #
      def download!
        verify_source_is_secure(root_spec)
        download_result = Downloader.download(download_request, root, :can_cache => can_cache?)

        if (specific_source = download_result.checkout_options) && specific_source != root_spec.source
          sandbox.store_checkout_source(root_spec.name, specific_source)
        end

        sandbox.store_downloaded_pod(root_spec.name)
      end

      #-----------------------------------------------------------------------#

      private

      # @!group Download Steps

      # Verify the source of the spec is secure, which is used to show a warning to the user if that isn't the case
      # This method doesn't verify all protocols, but currently only prohibits unencrypted 'http://' and 'git://''
      # connections.
      #
      # @return [void]
      #
      def verify_source_is_secure(root_spec)
        return if root_spec.source.nil? || (root_spec.source[:http].nil? && root_spec.source[:git].nil?)
        source = if !root_spec.source[:http].nil?
                   URI(root_spec.source[:http].to_s)
                 elsif !root_spec.source[:git].nil?
                   git_source = root_spec.source[:git].to_s
                   return unless git_source =~ /^#{URI::DEFAULT_PARSER.make_regexp}$/
                   URI(git_source)
                 end
        if UNENCRYPTED_PROTOCOLS.include?(source.scheme) && source.host != 'localhost'
          UI.warn "'#{root_spec.name}' uses the unencrypted '#{source.scheme}' protocol to transfer the Pod. " \
                'Please be sure you\'re in a safe network with only trusted hosts. ' \
                'Otherwise, please reach out to the library author to notify them of this security issue.'
        end
      end

      def download_request
        Downloader::Request.new(
          :spec => root_spec,
          :released => released?,
        )
      end

      #-----------------------------------------------------------------------#

      private

      # @!group Convenience methods.

      # @return [Array<Specifications>] the specification of the Pod used in
      #         this installation.
      #
      def specs
        specs_by_platform.values.flatten
      end

      # @return [Specification] the root specification of the Pod.
      #
      def root_spec
        specs.first.root
      end

      # @return [Pathname] the folder where the source of the Pod is located.
      #
      def root
        sandbox.pod_dir(root_spec.name)
      end

      # @return [Boolean] whether the source has been pre downloaded in the
      #         resolution process to retrieve its podspec.
      #
      def predownloaded?
        sandbox.predownloaded_pods.include?(root_spec.name)
      end

      # @return [Boolean] whether the pod uses the local option and thus
      #         CocoaPods should not interfere with the files of the user.
      #
      def local?
        sandbox.local?(root_spec.name)
      end

      def released?
        sandbox.specification(root_spec.name) != root_spec
      end

      #-----------------------------------------------------------------------#
    end
  end
end
