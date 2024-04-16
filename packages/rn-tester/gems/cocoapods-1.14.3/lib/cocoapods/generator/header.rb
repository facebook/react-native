module Pod
  module Generator
    # Generates a header file.
    #
    # According to the platform the header imports `UIKit/UIKit.h` or
    # `Cocoa/Cocoa.h`.
    #
    class Header
      # @return [Symbol] the platform for which the prefix header will be
      #         generated.
      #
      attr_reader :platform

      # @return [Array<String>] The list of the headers to import.
      #
      attr_accessor :imports

      # @return [Array<String>] The list of the modules to import.
      #
      attr_reader :module_imports

      # Initialize a new instance
      #
      # @param  [Symbol] platform
      #         @see platform
      #
      def initialize(platform)
        @platform = platform
        @imports = []
        @module_imports = []
      end

      # Generates the contents of the header according to the platform.
      #
      # @note   If the platform is iOS an import call to `UIKit/UIKit.h` is
      #         added to the top of the prefix header. For OS X `Cocoa/Cocoa.h`
      #         is imported.
      #
      # @return [String]
      #
      def generate
        result = ''
        result << "#ifdef __OBJC__\n"
        result << generate_platform_import_header
        result << "#else\n"
        result << "#ifndef FOUNDATION_EXPORT\n"
        result << "#if defined(__cplusplus)\n"
        result << "#define FOUNDATION_EXPORT extern \"C\"\n"
        result << "#else\n"
        result << "#define FOUNDATION_EXPORT extern\n"
        result << "#endif\n"
        result << "#endif\n"
        result << "#endif\n"
        result << "\n"

        imports.each do |import|
          result << %(#import "#{import}"\n)
        end

        unless module_imports.empty?
          module_imports.each do |import|
            result << %(\n@import #{import})
          end
          result << "\n"
        end

        result
      end

      # Generates and saves the header to the given path.
      #
      # @param  [Pathname] path
      #         The path where the header should be stored.
      #
      # @return [void]
      #
      def save_as(path)
        path.open('w') { |header| header.write(generate) }
      end

      #-----------------------------------------------------------------------#

      protected

      # Generates the contents of the header according to the platform.
      #
      # @note   If the platform is iOS an import call to `UIKit/UIKit.h` is
      #         added to the top of the header. For OS X `Cocoa/Cocoa.h` is
      #         imported.
      #
      # @return [String]
      #
      def generate_platform_import_header
        case platform.name
        when :ios then "#import <UIKit/UIKit.h>\n"
        when :tvos then "#import <UIKit/UIKit.h>\n"
        when :osx then "#import <Cocoa/Cocoa.h>\n"
        else "#import <Foundation/Foundation.h>\n"
        end
      end
    end
  end
end
