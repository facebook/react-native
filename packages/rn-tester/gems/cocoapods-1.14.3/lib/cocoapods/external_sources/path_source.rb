module Pod
  module ExternalSources
    # Provides support for fetching a specification file from a path local to
    # the machine running the installation.
    #
    class PathSource < AbstractExternalSource
      # @see  AbstractExternalSource#fetch
      #
      def fetch(sandbox)
        title = "Fetching podspec for `#{name}` #{description}"
        UI.section(title, '-> ') do
          podspec = podspec_path
          unless podspec.exist?
            raise Informative, "No podspec found for `#{name}` in " \
              "`#{declared_path}`"
          end
          store_podspec(sandbox, podspec, podspec.extname == '.json')
          is_absolute = absolute?(declared_path)
          sandbox.store_local_path(name, podspec, is_absolute)
          sandbox.remove_checkout_source(name)
        end
      end

      # @see  AbstractExternalSource#description
      #
      def description
        "from `#{declared_path}`"
      end

      private

      # @!group Helpers

      # @return [String] The path as declared by the user.
      #
      def declared_path
        result = params[:path]
        result.to_s if result
      end

      # @return [Pathname] The absolute path of the podspec.
      #
      def podspec_path
        path = Pathname(normalized_podspec_path(declared_path))
        path.exist? ? path : Pathname("#{path}.json")
      end

      # @return [Boolean]
      #
      def absolute?(path)
        Pathname(path).absolute? || path.to_s.start_with?('~')
      end
    end
  end
end
