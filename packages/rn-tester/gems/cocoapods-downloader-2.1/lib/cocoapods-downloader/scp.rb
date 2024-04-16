require 'uri'
require 'cocoapods-downloader/remote_file'

module Pod
  module Downloader
    class Scp < RemoteFile
      DEFAULT_PORT = 22

      private

      executable :scp

      def download_file(full_filename)
        scp! '-P', port, '-q', source, full_filename
      end

      def source
        "#{uri.user ? uri.user + '@' : ''}#{uri.host}:'#{uri.path}'"
      end

      def port
        uri.port || DEFAULT_PORT
      end

      def uri
        @uri ||= URI.parse(url)
      end
    end
  end
end
