module Pod
  class Installer
    # Context object designed to be used with the HooksManager which describes
    # the context of the installer before spec sources have been created
    #
    class SourceProviderHooksContext
      # @return [Array<Source>] The source objects to send to the installer
      #
      attr_reader :sources

      # @return [SourceProviderHooksContext] Convenience class method to generate the
      #         static context.
      #
      def self.generate
        result = new
        result
      end

      def initialize
        @sources = []
      end

      # @param [Source] source object to be added to the installer
      #
      # @return [void]
      #
      def add_source(source)
        unless source.nil?
          @sources << source
        end
      end
    end
  end
end
