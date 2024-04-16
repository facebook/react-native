module Pod
  module ExternalSources
    # Provides support for fetching a specification file from a source handled
    # by the downloader. Supports all the options of the downloader
    #
    # @note The podspec must be in the root of the repository and should have a
    #       name matching the one of the dependency.
    #
    class DownloaderSource < AbstractExternalSource
      # @see AbstractExternalSource#fetch
      #
      def fetch(sandbox)
        pre_download(sandbox)
      end

      # @see AbstractExternalSource#description
      #
      def description
        strategy = Downloader.strategy_from_options(params)
        options = params.dup
        url = options.delete(strategy)
        result = "from `#{url}`"
        options.each do |key, value|
          result << ", #{key} `#{value}`"
        end
        result
      end
    end
  end
end
