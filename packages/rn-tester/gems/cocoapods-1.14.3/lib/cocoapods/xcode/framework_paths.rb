module Pod
  module Xcode
    class FrameworkPaths
      # @return [String] the path to the .framework
      #
      attr_reader :source_path

      # @return [String, Nil] the dSYM path, if one exists
      #
      attr_reader :dsym_path

      # @return [Array<String>, Nil] the bcsymbolmap files path array, if one exists
      #
      attr_reader :bcsymbolmap_paths

      def initialize(source_path, dsym_path = nil, bcsymbolmap_paths = nil)
        @source_path = source_path
        @dsym_path = dsym_path
        @bcsymbolmap_paths = bcsymbolmap_paths
      end

      def ==(other)
        if other.class == self.class
          other.source_path == @source_path && other.dsym_path == @dsym_path && other.bcsymbolmap_paths == @bcsymbolmap_paths
        else
          false
        end
      end

      alias eql? ==

      def hash
        [source_path, dsym_path, bcsymbolmap_paths].hash
      end

      def all_paths
        [source_path, dsym_path, bcsymbolmap_paths].flatten.compact
      end

      # @param [Pathname] path the path to the `.framework` bundle
      #
      # @return [FrameworkPaths] the path of the framework with dsym & bcsymbolmap paths, if found
      #
      def self.from_path(path)
        dsym_name = "#{path.basename}.dSYM"
        dsym_path = Pathname.new("#{path.dirname}/#{dsym_name}")
        dsym_path = nil unless dsym_path.exist?
        bcsymbolmap_paths = Pathname.glob(path.dirname, '*.bcsymbolmap')

        FrameworkPaths.new(path, dsym_path, bcsymbolmap_paths)
      end
    end
  end
end
