module Pod
  module ExternalSources
    # Provides support for fetching a specification file from an URL. Can be
    # http, file, etc.
    #
    class PodspecSource < AbstractExternalSource
      # @see AbstractExternalSource#fetch
      #
      def fetch(sandbox)
        title = "Fetching podspec for `#{name}` #{description}"
        UI.titled_section(title,  :verbose_prefix => '-> ') do
          podspec_path = Pathname(podspec_uri)
          is_json = podspec_path.extname == '.json'
          if podspec_path.exist?
            store_podspec(sandbox, podspec_path, is_json)
          else
            require 'cocoapods/open-uri'
            begin
              OpenURI.open_uri(podspec_uri) { |io| store_podspec(sandbox, io.read, is_json) }
            rescue OpenURI::HTTPError => e
              status = e.io.status.join(' ')
              raise Informative, "Failed to fetch podspec for `#{name}` at `#{podspec_uri}`.\n Error: #{status}"
            end
          end
        end
      end

      # @see AbstractExternalSource#description
      #
      def description
        "from `#{params[:podspec]}`"
      end

      private

      # @!group Helpers

      # @return [String] The uri of the podspec appending the name of the file
      #         and expanding it if necessary.
      #
      # @note   If the declared path is expanded only if the represents a path
      #         relative to the file system.
      #
      def podspec_uri
        declared_path = params[:podspec].to_s
        if declared_path =~ %r{^.+://}
          declared_path
        else
          normalized_podspec_path(declared_path)
        end
      end
    end
  end
end
