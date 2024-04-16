# frozen_string_literal: true

require 'cocoapods/xcode/xcframework/xcframework_slice'

module Pod
  module Xcode
    class XCFramework
      # @return [String] target_name the target name this XCFramework belongs to
      #
      attr_reader :target_name

      # @return [Pathname] path the path to the .xcframework on disk
      #
      attr_reader :path

      # @return [Pod::Version] the format version of the .xcframework
      #
      attr_reader :format_version

      # @return [Array<XCFramework::Slice>] the slices contained inside this .xcframework
      #
      attr_reader :slices

      # @return [Hash] the contents of the parsed plist
      #
      attr_reader :plist

      # Initializes an XCFramework instance with a path on disk
      #
      # @param [String] target_name @see target_name
      # @param [Pathname, String] path @see path
      #
      # @return [XCFramework] the xcframework at the given path
      #
      def initialize(target_name, path)
        @target_name = target_name
        @path = Pathname.new(path).tap do |p|
          raise 'Absolute path is required' unless p.absolute?
        end

        @plist = Xcodeproj::Plist.read_from_path(plist_path)
        parse_plist_contents
      end

      # @return [Pathname] the path to the Info.plist
      #
      def plist_path
        path + 'Info.plist'
      end

      # @return [String] the basename of the framework
      #
      def name
        File.basename(path, '.xcframework')
      end

      # @return [Boolean] true if any slices use dynamic linkage
      #
      def includes_dynamic_slices?
        build_type.dynamic?
      end

      # @return [Boolean] true if any slices use dynamic linkage
      #
      def includes_static_slices?
        build_type.static?
      end

      # @return [Pod::BuildType] the build type of the contained slices
      #
      # @note As CocoaPods does not support mixed packaging nor linkage for xcframework slices,
      #       we pick the first slice and assume all are the same
      #
      def build_type
        @build_type ||= slices.first.build_type
      end

      private

      def parse_plist_contents
        @format_version = Pod::Version.new(plist['XCFrameworkFormatVersion'])
        @slices = plist['AvailableLibraries'].map do |library|
          identifier = library['LibraryIdentifier']
          relative_path = library['LibraryPath']
          archs = library['SupportedArchitectures']
          platform_name = library['SupportedPlatform']
          platform_variant = library['SupportedPlatformVariant']
          headers = library['HeadersPath']

          slice_root = path.join(identifier)
          slice_path = slice_root.join(relative_path)
          headers = slice_root.join(headers) unless headers.nil?
          XCFramework::Slice.new(slice_path, identifier, archs, platform_name, :platform_variant => platform_variant, :headers => headers)
        end.sort_by(&:identifier)
        raise Informative, "XCFramework at #{path} does not contain any frameworks or libraries." if slices.empty?
      end
    end
  end
end
