module Pod
  module Generator
    # Generates an umbrella header file for clang modules, which are used by
    # dynamic frameworks on iOS 8 and OSX 10.10 under the hood.
    #
    # If the target is a +PodTarget+, then the umbrella header is required
    # to make all public headers in a convenient manner available without the
    # need to write out header declarations for every library header.
    #
    class UmbrellaHeader < Header
      # @return [Target]
      #         the target, which provides the product name
      attr_reader :target

      # Initialize a new instance
      #
      # @param  [Target] target
      #         @see target
      #
      def initialize(target)
        super(target.platform)
        @target = target
      end

      # Generates the contents of the umbrella header according to the included
      # pods.
      #
      # @return [String]
      #
      def generate
        result = super

        result << "\n"

        result << <<-eos.strip_heredoc
        FOUNDATION_EXPORT double #{target.product_module_name}VersionNumber;
        FOUNDATION_EXPORT const unsigned char #{target.product_module_name}VersionString[];
        eos

        result << "\n"

        result
      end
    end
  end
end
