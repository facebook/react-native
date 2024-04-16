require 'cocoapods/target/build_settings'

module Pod
  # Model class which describes a Pods target.
  #
  # The Target class stores and provides the information necessary for
  # working with a target in the Podfile and its dependent libraries.
  # This class is used to represent both the targets and their libraries.
  #
  class Target
    DEFAULT_VERSION = '1.0.0'.freeze
    DEFAULT_NAME = 'Default'.freeze
    DEFAULT_BUILD_CONFIGURATIONS = { 'Release' => :release, 'Debug' => :debug }.freeze

    # @return [Sandbox] The sandbox where the Pods should be installed.
    #
    attr_reader :sandbox

    # @return [Hash{String=>Symbol}] A hash representing the user build
    #         configurations where each key corresponds to the name of a
    #         configuration and its value to its type (`:debug` or `:release`).
    #
    attr_reader :user_build_configurations

    # @return [Array<String>] The value for the ARCHS build setting.
    #
    attr_reader :archs

    # @return [Platform] the platform of this target.
    #
    attr_reader :platform

    # @return [BuildSettings] the build settings for this target.
    #
    attr_reader :build_settings

    # @return [BuildType] the build type for this target.
    #
    attr_reader :build_type
    private :build_type

    # @return [Boolean] whether the target can be linked to app extensions only.
    #
    attr_reader :application_extension_api_only

    # @return [Boolean] whether the target must be compiled with Swift's library
    # evolution support, necessary for XCFrameworks.
    #
    attr_reader :build_library_for_distribution

    # Initialize a new target
    #
    # @param [Sandbox] sandbox @see #sandbox
    # @param [BuildType] build_type @see #build_type
    # @param [Hash{String=>Symbol}] user_build_configurations @see #user_build_configurations
    # @param [Array<String>] archs @see #archs
    # @param [Platform] platform @see #platform
    #
    def initialize(sandbox, build_type, user_build_configurations, archs, platform)
      @sandbox = sandbox
      @user_build_configurations = user_build_configurations
      @archs = archs
      @platform = platform
      @build_type = build_type

      @application_extension_api_only = false
      @build_library_for_distribution = false
      @build_settings = create_build_settings
    end

    # @return [String] the name of the library.
    #
    def name
      label
    end

    alias to_s name

    # @return [String] the label for the target.
    #
    def label
      DEFAULT_NAME
    end

    # @return [String] The version associated with this target
    #
    def version
      DEFAULT_VERSION
    end

    # @return [Boolean] Whether the target uses Swift code
    #
    def uses_swift?
      false
    end

    # @return [Boolean] whether the target is built dynamically
    #
    def build_as_dynamic?
      build_type.dynamic?
    end

    # @return [Boolean] whether the target is built as a dynamic framework
    #
    def build_as_dynamic_framework?
      build_type.dynamic_framework?
    end

    # @return [Boolean] whether the target is built as a dynamic library
    #
    def build_as_dynamic_library?
      build_type.dynamic_library?
    end

    # @return [Boolean] whether the target is built as a framework
    #
    def build_as_framework?
      build_type.framework?
    end

    # @return [Boolean] whether the target is built as a library
    #
    def build_as_library?
      build_type.library?
    end

    # @return [Boolean] whether the target is built statically
    #
    def build_as_static?
      build_type.static?
    end

    # @return [Boolean] whether the target is built as a static framework
    #
    def build_as_static_framework?
      build_type.static_framework?
    end

    # @return [Boolean] whether the target is built as a static library
    #
    def build_as_static_library?
      build_type.static_library?
    end

    # @deprecated Prefer {build_as_static_framework?}.
    #
    # @return [Boolean] Whether the target should build a static framework.
    #
    def static_framework?
      build_as_static_framework?
    end

    # @return [String] the name to use for the source code module constructed
    #         for this target, and which will be used to import the module in
    #         implementation source files.
    #
    def product_module_name
      c99ext_identifier(label)
    end

    # @return [String] the name of the product.
    #
    def product_name
      if build_as_framework?
        framework_name
      else
        static_library_name
      end
    end

    # @return [String] the name of the product excluding the file extension or
    #         a product type specific prefix, depends on #requires_frameworks?
    #         and #product_module_name or #label.
    #
    def product_basename
      if build_as_framework?
        product_module_name
      else
        label
      end
    end

    # @return [String] the name of the framework, depends on #label.
    #
    # @note This may not depend on #requires_frameworks? indirectly as it is
    #       used for migration.
    #
    def framework_name
      "#{product_module_name}.framework"
    end

    # @return [String] the name of the library, depends on #label.
    #
    # @note This may not depend on #requires_frameworks? indirectly as it is
    #       used for migration.
    #
    def static_library_name
      "lib#{label}.a"
    end

    # @return [Symbol] either :framework or :static_library, depends on
    #         #build_as_framework?.
    #
    def product_type
      build_as_framework? ? :framework : :static_library
    end

    # @return [String] A string suitable for debugging.
    #
    def inspect
      "#<#{self.class} name=#{name}>"
    end

    #-------------------------------------------------------------------------#

    # @!group Framework support

    # @deprecated Prefer {build_as_framework?}.
    #
    # @return [Boolean] whether the generated target needs to be implemented
    #         as a framework
    #
    def requires_frameworks?
      build_as_framework?
    end

    #-------------------------------------------------------------------------#

    # @!group Support files

    # @return [Pathname] the folder where to store the support files of this
    #         library.
    #
    def support_files_dir
      sandbox.target_support_files_dir(name)
    end

    # @param  [String] variant
    #         The variant of the xcconfig. Used to differentiate build
    #         configurations.
    #
    # @return [Pathname] the absolute path of the xcconfig file.
    #
    def xcconfig_path(variant = nil)
      if variant
        support_files_dir + "#{label}.#{variant.to_s.gsub(File::SEPARATOR, '-').downcase}.xcconfig"
      else
        support_files_dir + "#{label}.xcconfig"
      end
    end

    # @return [Pathname] the absolute path of the header file which contains
    #         the exported foundation constants with framework version
    #         information and all headers, which should been exported in the
    #         module map.
    #
    def umbrella_header_path
      module_map_path.parent + "#{label}-umbrella.h"
    end

    def umbrella_header_path_to_write
      module_map_path_to_write.parent + "#{label}-umbrella.h"
    end

    # @return [Pathname] the absolute path of the LLVM module map file that
    #         defines the module structure for the compiler.
    #
    def module_map_path
      module_map_path_to_write
    end

    # @!private
    #
    # @return [Pathname] the absolute path of the module map file that
    #         CocoaPods writes. This can be different from `module_map_path`
    #         if the module map gets symlinked.
    #
    def module_map_path_to_write
      basename = "#{label}.modulemap"
      support_files_dir + basename
    end

    # @return [Pathname] the absolute path of the bridge support file.
    #
    def bridge_support_path
      support_files_dir + "#{label}.bridgesupport"
    end

    # @return [Pathname] the absolute path of the Info.plist file.
    #
    def info_plist_path
      support_files_dir + "#{label}-Info.plist"
    end

    # @return [Hash] additional entries for the generated Info.plist
    #
    def info_plist_entries
      {}
    end

    # @return [Pathname] the path of the dummy source generated by CocoaPods
    #
    def dummy_source_path
      support_files_dir + "#{label}-dummy.m"
    end

    # Mark the target as extension-only.
    # Translates to APPLICATION_EXTENSION_API_ONLY = YES in the build settings.
    #
    def mark_application_extension_api_only
      @application_extension_api_only = true
    end

    # Compiles the target with Swift's library evolution support, necessary to
    # build XCFrameworks.
    # Translates to BUILD_LIBRARY_FOR_DISTRIBUTION = YES in the build settings.
    #
    def mark_build_library_for_distribution
      @build_library_for_distribution = true
    end

    # @return [Pathname] The absolute path of the prepare artifacts script.
    #
    # @deprecated
    #
    # @todo Remove in 2.0
    #
    def prepare_artifacts_script_path
      support_files_dir + "#{label}-artifacts.sh"
    end

    # Returns an extension in the target that corresponds to the
    # resource's input extension.
    #
    # @param [String] input_extension
    #        The input extension to map to.
    #
    # @return [String] The output extension.
    #
    def self.output_extension_for_resource(input_extension)
      case input_extension
      when '.storyboard'        then '.storyboardc'
      when '.xib'               then '.nib'
      when '.xcdatamodel'       then '.mom'
      when '.xcdatamodeld'      then '.momd'
      when '.xcmappingmodel'    then '.cdm'
      when '.xcassets'          then '.car'
      else                      input_extension
      end
    end

    def self.resource_extension_compilable?(input_extension)
      output_extension_for_resource(input_extension) != input_extension && input_extension != '.xcassets'
    end

    #-------------------------------------------------------------------------#

    private

    # Transforms the given string into a valid +identifier+ after C99ext
    # standard, so that it can be used in source code where escaping of
    # ambiguous characters is not applicable.
    #
    # @param  [String] name
    #         any name, which may contain leading numbers, spaces or invalid
    #         characters.
    #
    # @return [String]
    #
    def c99ext_identifier(name)
      name.gsub(/^([0-9])/, '_\1').gsub(/[^a-zA-Z0-9_]/, '_')
    end

    def create_build_settings
      BuildSettings.new(self)
    end
  end
end
