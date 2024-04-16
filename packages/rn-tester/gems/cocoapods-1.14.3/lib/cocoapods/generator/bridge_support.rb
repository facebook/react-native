module Pod
  module Generator
    class BridgeSupport
      extend Executable
      executable :gen_bridge_metadata

      attr_reader :headers

      def initialize(headers)
        @headers = headers
      end

      def search_paths
        @headers.map { |header| "-I '#{header.dirname}'" }.uniq
      end

      def save_as(pathname)
        gen_bridge_metadata('-c', search_paths.join(' '), '-o', pathname, *headers)
      end
    end
  end
end
