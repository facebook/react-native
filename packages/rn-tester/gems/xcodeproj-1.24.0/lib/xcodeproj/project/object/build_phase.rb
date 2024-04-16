module Xcodeproj
  class Project
    module Object
      # @abstract
      #
      # This class is abstract and it doesn't appear in the project document.
      #
      class AbstractBuildPhase < AbstractObject
        # @!group Attributes

        # @return [ObjectList<PBXBuildFile>] the files processed by this build
        #         configuration.
        #
        has_many :files, PBXBuildFile

        # @return [String] some kind of magic number which usually is
        #         '2147483647' (can be also `8` and `12` in
        #         PBXCopyFilesBuildPhase, one of the masks is
        #         run_only_for_deployment_postprocessing).
        #
        attribute :build_action_mask, String, '2147483647'

        # @return [String] whether or not this should only be processed before
        #         deployment. Can be either '0', or '1'.
        #
        # @note   This option is exposed in Xcode in the UI of
        #         PBXCopyFilesBuildPhase as `Copy only when installing` or in
        #         PBXShellScriptBuildPhase as `Run script only when
        #         installing`.
        #
        attribute :run_only_for_deployment_postprocessing, String, '0'

        # @return [String] whether or not this run script will be forced to
        #         run even on incremental builds. Can be either '1', or
        #         missing. By default this option is disabled in Xcode.
        #
        # @note   This setting is exposed in Xcode in the UI of
        #         PBXShellScriptBuildPhase as `Based on
        #         dependency analysis` (selected by default).
        #
        attribute :always_out_of_date, String

        # @return [String] Comments associated with this build phase.
        #
        # @note   This is apparently no longer used by Xcode.
        #
        attribute :comments, String

        #--------------------------------------#

        public

        # @!group Helpers

        # @return [Array<PBXFileReference>] the list of all the files
        #         referenced by this build phase.
        #
        def files_references
          files.map(&:file_ref)
        end

        # @return [Array<String>] The display name of the build files.
        #
        def file_display_names
          files.map(&:display_name)
        end

        # @return [PBXBuildFile] the first build file associated with the given
        #         file reference if one exists.
        #
        def build_file(file_ref)
          (file_ref.referrers & files).first
        end

        # Returns whether a build file for the given file reference exists.
        #
        # @param  [PBXFileReference] file_ref
        #
        # @return [Bool] whether the reference is already present.
        #
        def include?(file_ref)
          !build_file(file_ref).nil?
        end

        # Adds a new build file, initialized with the given file reference, to
        # the phase.
        #
        # @param  [PBXFileReference] file_ref
        #         The file reference that should be added to the build phase.
        #
        # @return [PBXBuildFile] the build file generated.
        #
        def add_file_reference(file_ref, avoid_duplicates = false)
          if avoid_duplicates && existing = build_file(file_ref)
            existing
          else
            build_file = project.new(PBXBuildFile)
            build_file.file_ref = file_ref
            files << build_file
            build_file
          end
        end

        # Removes the build file associated with the given file reference from
        # the phase.
        #
        # @param  [PBXFileReference] file_ref
        #         The file to remove
        #
        # @return [void]
        #
        def remove_file_reference(file_ref)
          build_file = files.find { |bf| bf.file_ref == file_ref }
          remove_build_file(build_file) if build_file
        end

        # Removes a build file from the phase and clears its relationship to
        # the file reference.
        #
        # @param  [PBXBuildFile] build_file the file to remove
        #
        # @return [void]
        #
        def remove_build_file(build_file)
          build_file.file_ref = nil
          build_file.remove_from_project
        end

        # Removes all the build files from the phase and clears their
        # relationship to the file reference.
        #
        # @return [void]
        #
        def clear
          files.objects.each do |bf|
            remove_build_file(bf)
          end
        end
        alias_method :clear_build_files, :clear

        def display_name
          super.gsub(/BuildPhase$/, '')
        end

        def ascii_plist_annotation
          " #{display_name} "
        end

        # Sorts the build files of the phase according to the display
        # name or the path.
        #
        # @param  [Hash] _options
        #         Not used.
        #
        # @return [void]
        #
        def sort(_options = nil)
          files.sort! do |x, y|
            result = File.basename(x.display_name.downcase, '.*') <=> File.basename(y.display_name.downcase, '.*')
            if result.zero?
              result = File.extname(x.display_name.downcase) <=> File.extname(y.display_name.downcase)
              if result.zero? && x.file_ref.respond_to?(:full_path) && y.file_ref.respond_to?(:full_path)
                result = x.file_ref.full_path.to_s.downcase <=> y.file_ref.full_path.to_s.downcase
              end
            end
            result
          end
        end
      end

      #-----------------------------------------------------------------------#

      # The phase responsible of copying headers. Known as `Copy Headers` in
      # the UI.
      #
      # @note This phase can appear only once in a target.
      #
      class PBXHeadersBuildPhase < AbstractBuildPhase
      end

      #-----------------------------------------------------------------------#

      # The phase responsible of compiling the files. Known as `Compile
      # Sources` in the UI.
      #
      # @note This phase can appear only once in a target.
      #
      class PBXSourcesBuildPhase < AbstractBuildPhase
      end

      #-----------------------------------------------------------------------#

      # The phase responsible on linking with frameworks. Known as `Link Binary
      # With Libraries` in the UI.
      #
      # @note This phase can appear only once in a target.
      #
      class PBXFrameworksBuildPhase < AbstractBuildPhase
      end

      #-----------------------------------------------------------------------#

      # The resources build phase apparently is a specialized copy build phase
      # for resources. Known as `Copy Bundle Resources` in the UI. It is
      # unclear if this is the only one capable of optimizing PNG.
      #
      # @note This phase can appear only once in a target.
      #
      class PBXResourcesBuildPhase < AbstractBuildPhase
      end

      #-----------------------------------------------------------------------#

      # Phase that copies the files to the bundle of the target (aka `Copy
      # Files`).
      #
      # @note This phase can appear multiple times in a target.
      #
      class PBXCopyFilesBuildPhase < AbstractBuildPhase
        # @!group Attributes

        # @return [String] the name of the build phase.
        #
        attribute :name, String

        # @return [String] the subpath of `dst_subfolder_spec` where this file
        #         should be copied to.
        #
        # @note   Can accept environment variables like `$(PRODUCT_NAME)`.
        #
        attribute :dst_path, String, ''

        # @return [String] the path (destination) where the files should be
        #         copied to.
        #
        attribute :dst_subfolder_spec, String, Constants::COPY_FILES_BUILD_PHASE_DESTINATIONS[:resources]

        # @return [Hash{String => Hash}] A hash suitable to display the build
        #         phase to the user.
        #
        def pretty_print
          {
            display_name => {
              'Destination Path' => dst_path,
              'Destination Subfolder' => Constants::COPY_FILES_BUILD_PHASE_DESTINATIONS.key(dst_subfolder_spec).to_s,
              'Files' => files.map(&:pretty_print),
            },
          }
        end

        # Alias method for #dst_subfolder_spec=, which accepts symbol values
        # instead of numeric string values.
        #
        # @param [Symbol] value
        #        one of `COPY_FILES_BUILD_PHASE_DESTINATIONS.keys`
        #
        # @raise [StandardError] if value is not a valid known key
        #
        def symbol_dst_subfolder_spec=(value)
          numeric_value = Constants::COPY_FILES_BUILD_PHASE_DESTINATIONS[value]
          raise "[Xcodeproj] Value checking error: got `#{value.inspect}` for" \
              ' attribute: dst_subfolder_spec' if numeric_value.nil?
          self.dst_subfolder_spec = numeric_value
        end

        # Alias method for #dst_subfolder_spec, which returns symbol values
        # instead of numeric string values.
        #
        # @return [Symbol]
        #
        def symbol_dst_subfolder_spec
          key = Constants::COPY_FILES_BUILD_PHASE_DESTINATIONS.find { |_, num| num == dst_subfolder_spec }
          key ? key.first : nil
        end
      end

      #-----------------------------------------------------------------------#

      # A phase responsible of running a shell script (aka `Run Script`).
      #
      # @note This phase can appear multiple times in a target.
      #
      class PBXShellScriptBuildPhase < AbstractBuildPhase
        # @!group Attributes

        # @return [String] the name of the build phase.
        #
        attribute :name, String

        # @return [Array<String>] an array of the paths to pass to the script.
        #
        # @example
        #   "$(SRCROOT)/myfile"
        #
        attribute :input_paths, Array, []

        # @return [Array<String>] an array of input file list paths of the script.
        #
        # @example
        #   "$(SRCROOT)/newInputFile.xcfilelist"
        #
        attribute :input_file_list_paths, Array, []

        # @return [Array<String>] an array of output paths of the script.
        #
        # @example
        #   "$(DERIVED_FILE_DIR)/myfile"
        #
        attribute :output_paths, Array, []

        # @return [Array<String>] an array of output file list paths of the script.
        #
        # @example
        #   "$(SRCROOT)/newOutputFile.xcfilelist"
        #
        attribute :output_file_list_paths, Array, []

        # @return [String] the path to the script interpreter.
        #
        # @note   Defaults to `/bin/sh`.
        #
        attribute :shell_path, String, '/bin/sh'

        # @return [String] the actual script to perform.
        #
        # @note   Defaults to a comment string.
        #
        attribute :shell_script, String, "# Type a script or drag a script file from your workspace to insert its path.\n"

        # @return [String] whether or not the ENV variables should be shown in
        #         the build log.
        #
        attribute :show_env_vars_in_log, String

        # @return [String] the discovered dependency file to use.
        #
        attribute :dependency_file, String

        # @return [Hash{String => Hash}] A hash suitable to display the build
        #         phase to the user.
        #
        def pretty_print
          {
            display_name => {
              'Input File List Paths' => input_file_list_paths || [],
              'Input Paths' => input_paths || [],
              'Output File List Paths' => output_file_list_paths || [],
              'Output Paths' => output_paths || [],
              'Shell Path' => shell_path,
              'Shell Script' => shell_script,
            },
          }
        end
      end

      #-----------------------------------------------------------------------#

      # Apparently a build phase named `Build Carbon Resources` (Observed for
      # kernel extensions targets).
      #
      # @note This phase can appear multiple times in a target.
      #
      class PBXRezBuildPhase < AbstractBuildPhase
      end

      #-----------------------------------------------------------------------#
    end
  end
end
