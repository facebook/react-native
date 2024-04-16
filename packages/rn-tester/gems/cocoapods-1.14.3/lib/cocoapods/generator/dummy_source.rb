module Pod
  module Generator
    class DummySource
      attr_reader :class_name

      def initialize(class_name_identifier)
        validated_class_name_identifier = class_name_identifier.gsub(/[^0-9a-z_]/i, '_')
        @class_name = "PodsDummy_#{validated_class_name_identifier}"
      end

      # @return [String] the string contents of the dummy source file.
      #
      def generate
        result = <<-source.strip_heredoc
          #import <Foundation/Foundation.h>
          @interface #{class_name} : NSObject
          @end
          @implementation #{class_name}
          @end
        source
        result
      end

      def save_as(pathname)
        pathname.open('w') do |source|
          source.write(generate)
        end
      end
    end
  end
end
