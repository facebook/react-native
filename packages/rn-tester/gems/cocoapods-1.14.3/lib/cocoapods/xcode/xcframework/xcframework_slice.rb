require 'cocoapods/xcode/linkage_analyzer'

module Pod
  module Xcode
    class XCFramework
      class Slice
        # @return [Pathname] the path to the .framework, .a or .dylib of this slice
        #
        attr_reader :path

        # @return [Array<String>] list of supported architectures
        #
        attr_reader :supported_archs

        # @return [String] the framework identifier
        #
        attr_reader :identifier

        # @return [Platform] the supported platform
        #
        attr_reader :platform

        # @return [Symbol] the platform variant. Either :simulator or nil
        #
        attr_reader :platform_variant

        # @return [Pathname] the path to the headers
        #
        attr_reader :headers

        def initialize(path, identifier, archs, platform, platform_variant: nil, headers: path.join('Headers'))
          @path = path
          @identifier = identifier
          @supported_archs = archs
          @platform = Pod::Platform.new(platform)
          @platform_variant = platform_variant.to_sym unless platform_variant.nil?
          @headers = headers
        end

        # @return [String] the name of the framework
        #
        def name
          @name ||= begin
            case package_type
            when :framework
              File.basename(path, '.framework')
            when :library
              ext = File.extname(path)
              case ext
              when '.a', '.dylib'
                result = File.basename(path).gsub(/^lib/, '')
                result[0] = result.downcase[0]
                result
              else
                raise Informative, "Invalid package type `#{package_type}`"
              end
            else
              raise Informative, "Invalid package type `#{package_type}`"
            end
          end
        end

        # @return [Boolean] true if this is a slice built for simulator
        #
        def simulator_variant?
          @platform_variant == :simulator
        end

        # @return [Symbol] the package type of the slice - either :framework or :library
        #
        def package_type
          @package_type ||= begin
            ext = File.extname(path)
            case ext
            when '.framework'
              :framework
            when '.a', '.dylib'
              :library
            else
              raise Informative, "Invalid XCFramework slice type `#{ext}`"
            end
          end
        end

        # @return [Boolean] true if this slice is a framework, not a library
        #
        def framework?
          build_type.framework?
        end

        # @return [Boolean] true if this slice is a library, not a framework
        #
        def library?
          build_type.library?
        end

        # @return [Boolean] true if this slice contains a statically-linked binary
        #
        def static?
          build_type.static?
        end

        # @return [Boolean] true if this slice contains a dynamically-linked binary
        #
        def dynamic?
          build_type.dynamic?
        end

        # @return [BuildType] the build type of the binary
        #
        def build_type
          @build_type ||= begin
            linkage = Xcode::LinkageAnalyzer.dynamic_binary?(binary_path) ? :dynamic : :static
            ext = File.extname(path)
            packaging = case ext
                        when '.framework'
                          :framework
                        when '.a', '.dylib'
                          :library
                        else
                          raise Informative, "Invalid XCFramework slice type `#{ext}`"
                        end
            BuildType.new(:linkage => linkage, :packaging => packaging)
          end
        end

        # @return [Pathname] the path to the bundled binary
        #
        def binary_path
          @binary_path ||= begin
            case package_type
            when :framework
              path + name
            when :library
              path
            else
              raise Informative, "Invalid package type `#{package_type}`"
            end
          end
        end
      end
    end
  end
end
