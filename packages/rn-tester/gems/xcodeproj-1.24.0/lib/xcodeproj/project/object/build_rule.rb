module Xcodeproj
  class Project
    module Object
      # This class represents a custom build rule of a Target.
      #
      class PBXBuildRule < AbstractObject
        # @!group Attributes

        # @return [String] the name of the rule.
        #
        attribute :name, String

        # @return [String] a string representing what compiler to use.
        #
        # @example
        #   `com.apple.compilers.proxy.script`.
        #
        attribute :compiler_spec, String

        # @return [String] the discovered dependency file to use.
        #
        # @example
        #   `$(DERIVED_FILES_DIR)/$(INPUT_FILE_NAME).d`.
        #
        attribute :dependency_file, String

        # @return [String] the type of the files that should be processed by
        #         this rule.
        #
        # @example
        #   `pattern.proxy`.
        #
        attribute :file_type, String

        # @return [String] the pattern of the files that should be processed by
        #         this rule. This attribute is an alternative to to
        #         `file_type`.
        #
        # @example
        #   `*.css`.
        #
        attribute :file_patterns, String

        # @return [String] whether the rule is editable.
        #
        # @example
        #   `1`.
        #
        attribute :is_editable, String, '1'

        # @return [ObjectList<PBXFileReference>] the file references for the
        #         input files files.
        #
        attribute :input_files, Array

        # @return [ObjectList<PBXFileReference>] the file references for the
        #         output files.
        #
        attribute :output_files, Array

        # @return [ObjectList<String>] the compiler flags used when creating the
        #         respective output files.
        #
        attribute :output_files_compiler_flags, Array

        # @return [String] whether the rule should be run once per architecture.
        #
        # @example
        #   `0`.
        #
        attribute :run_once_per_architecture, String

        # @return [String] the content of the script to use for the build rule.
        #
        # @note   This attribute is present if the #{#compiler_spec} is
        #         `com.apple.compilers.proxy.script`
        #
        attribute :script, String

        # @!group Helpers

        # Adds an output file with the specified compiler flags.
        #
        # @param  [PBXFileReference] file the file to add.
        #
        # @param  [String] compiler_flags the compiler flags for the file.
        #
        # @return [Void]
        #
        def add_output_file(file, compiler_flags = '')
          (self.output_files ||= []) << file
          (self.output_files_compiler_flags ||= []) << compiler_flags
        end

        # @return [Array<[PBXFileReference, String]>]
        #         An array containing tuples of output files and their compiler
        #         flags.
        #
        def output_files_and_flags
          (output_files || []).zip(output_files_compiler_flags || [])
        end

        def ascii_plist_annotation
          " #{isa} "
        end
      end
    end
  end
end
