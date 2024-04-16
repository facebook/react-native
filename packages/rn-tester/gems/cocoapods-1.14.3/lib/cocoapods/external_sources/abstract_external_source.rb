module Pod
  module ExternalSources
    # Abstract class that defines the common behaviour of external sources.
    #
    class AbstractExternalSource
      # @return [String] the name of the Pod described by this external source.
      #
      attr_reader :name

      # @return [Hash{Symbol => String}] the hash representation of the
      #         external source.
      #
      attr_reader :params

      # @return [String] the path where the podfile is defined to resolve
      #         relative paths.
      #
      attr_reader :podfile_path

      # @return [Boolean] Whether the source is allowed to touch the cache.
      #
      attr_reader :can_cache
      alias_method :can_cache?, :can_cache

      # Initialize a new instance
      #
      # @param [String] name @see #name
      # @param [Hash] params @see #params
      # @param [String] podfile_path @see #podfile_path
      # @param [Boolean] can_cache @see #can_cache
      #
      def initialize(name, params, podfile_path, can_cache = true)
        @name = name
        @params = params
        @podfile_path = podfile_path
        @can_cache = can_cache
      end

      # @return [Boolean] whether an external source source is equal to another
      #         according to the {#name} and to the {#params}.
      #
      def ==(other)
        return false if other.nil?
        name == other.name && params == other.params
      end

      public

      # @!group Subclasses hooks

      # Fetches the external source from the remote according to the params.
      #
      # @param  [Sandbox] _sandbox
      #         the sandbox where the specification should be stored.
      #
      # @return [void]
      #
      def fetch(_sandbox)
        raise 'Abstract method'
      end

      # @return [String] a string representation of the source suitable for UI.
      #
      def description
        raise 'Abstract method'
      end

      protected

      # Return the normalized path for a podspec for a relative declared path.
      #
      # @param  [String] declared_path
      #         The path declared in the podfile.
      #
      # @return [String] The uri of the podspec appending the name of the file
      #         and expanding it if necessary.
      #
      # @note   If the declared path is expanded only if the represents a path
      #         relative to the file system.
      #
      def normalized_podspec_path(declared_path)
        extension = File.extname(declared_path)
        if extension == '.podspec' || extension == '.json'
          path_with_ext = declared_path
        else
          path_with_ext = "#{declared_path}/#{name}.podspec"
        end
        podfile_dir = File.dirname(podfile_path || '')
        File.expand_path(path_with_ext, podfile_dir)
      end

      private

      # @! Subclasses helpers

      # Pre-downloads a Pod passing the options to the downloader and informing
      # the sandbox.
      #
      # @param  [Sandbox] sandbox
      #         The sandbox where the Pod should be downloaded.
      #
      # @note   To prevent a double download of the repository the pod is
      #         marked as pre-downloaded indicating to the installer that only
      #         clean operations are needed.
      #
      # @todo  The downloader configuration is the same of the
      #        #{PodSourceInstaller} and it needs to be kept in sync.
      #
      # @return [void]
      #
      def pre_download(sandbox)
        title = "Pre-downloading: `#{name}` #{description}"
        UI.titled_section(title,  :verbose_prefix => '-> ') do
          target = sandbox.pod_dir(name)
          begin
            download_result = Downloader.download(download_request, target, :can_cache => can_cache)
          rescue Pod::DSLError => e
            raise Informative, "Failed to load '#{name}' podspec: #{e.message}"
          rescue => e
            raise Informative, "Failed to download '#{name}': #{e.message}"
          end

          spec = download_result.spec
          raise Informative, "Unable to find a specification for '#{name}'." unless spec

          # since the podspec might be cleaned, we want the checksum to refer
          # to the json in the sandbox
          spec.defined_in_file = nil

          store_podspec(sandbox, spec)
          sandbox.store_pre_downloaded_pod(name)
          sandbox.store_checkout_source(name, download_result.checkout_options)
        end
      end

      def download_request
        Downloader::Request.new(
          :name => name,
          :params => params,
        )
      end

      # Stores the podspec in the sandbox and marks it as from an external
      # source.
      #
      # @param  [Sandbox] sandbox
      #         The sandbox where the specification should be stored.
      #
      # @param  [Pathname, String, Specification] spec
      #         The path of the specification or its contents.
      #
      # @note   All the concrete implementations of #{fetch} should invoke this
      #         method.
      #
      # @note   The sandbox ensures that the podspec exists and that the names
      #         match.
      #
      # @return [void]
      #
      def store_podspec(sandbox, spec, json = false)
        begin
          spec = case spec
                 when Pathname
                   Specification.from_file(spec)
                 when String
                   path = "#{name}.podspec"
                   path << '.json' if json
                   Specification.from_string(spec, path).tap { |s| s.defined_in_file = nil }
                 when Specification
                   spec.dup
                 else
                   raise "Unknown spec type: #{spec}"
                 end
        rescue Pod::DSLError => e
          raise Informative, "Failed to load '#{name}' podspec: #{e.message}"
        end

        validate_podspec(spec)
        sandbox.store_podspec(name, spec, true, true)
      end

      def validate_podspec(podspec)
        defined_in_file = podspec.defined_in_file
        podspec.defined_in_file = nil

        validator = validator_for_podspec(podspec)
        validator.quick = true
        validator.allow_warnings = true
        validator.ignore_public_only_results = true
        Config.instance.with_changes(:silent => true) do
          validator.validate
        end
        unless validator.validated?
          raise Informative, "The `#{name}` pod failed to validate due to #{validator.failure_reason}:\n#{validator.results_message}"
        end
      ensure
        podspec.defined_in_file = defined_in_file
      end

      def validator_for_podspec(podspec)
        Validator.new(podspec, [], [])
      end
    end
  end
end
