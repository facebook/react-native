module Pod
  class Installer
    # Controller class responsible of executing the prepare command
    # of a single Pod.
    #
    class PodSourcePreparer
      # @return [Specification] the root specification of the Pod.
      #
      attr_reader :spec

      # @return [Pathname] the folder where the source of the Pod is located.
      #
      attr_reader :path

      # Initialize a new instance
      #
      # @param [Specification] spec the root specification of the Pod.
      # @param [Pathname] path the folder where the source of the Pod is located.
      #
      def initialize(spec, path)
        raise "Given spec isn't a root spec, but must be." unless spec.root?
        @spec = spec
        @path = path
      end

      #-----------------------------------------------------------------------#

      public

      # @!group Preparation

      # Executes the prepare command if there is one.
      #
      # @return [void]
      #
      def prepare!
        run_prepare_command
      end

      #-----------------------------------------------------------------------#

      private

      # @!group Preparation Steps

      extend Executable
      executable :bash

      # Runs the prepare command bash script of the spec.
      #
      # @note   Unsets the `CDPATH` env variable before running the
      #         shell script to avoid issues with relative paths
      #         (issue #1694).
      #
      # @return [void]
      #
      def run_prepare_command
        return unless spec.prepare_command
        UI.section(' > Running prepare command', '', 1) do
          Dir.chdir(path) do
            begin
              ENV.delete('CDPATH')
              ENV['COCOAPODS_VERSION'] = Pod::VERSION
              prepare_command = spec.prepare_command.strip_heredoc.chomp
              full_command = "\nset -e\n" + prepare_command
              bash!('-c', full_command)
            ensure
              ENV.delete('COCOAPODS_VERSION')
            end
          end
        end
      end

      #-----------------------------------------------------------------------#
    end
  end
end
