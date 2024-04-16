module Pod
  module Generator
    # Generates an xcfilelist file.
    #
    class FileList
      # @return [Array<String>] The paths of the files in the file list.
      #
      attr_reader :paths

      # Initialize a new instance
      #
      # @param  [Array<String>] paths
      #         @see paths
      #
      def initialize(paths)
        @paths = paths
      end

      # Generates the contents of the file list.
      #
      # @return [String]
      #
      def generate
        paths.join("\n")
      end

      # Generates and saves the file list to the given path.
      #
      # @param  [Pathname] path
      #         The path where the file list should be stored.
      #
      # @return [void]
      #
      def save_as(path)
        path.open('w') { |file_list| file_list.write(generate) }
      end
    end
  end
end
