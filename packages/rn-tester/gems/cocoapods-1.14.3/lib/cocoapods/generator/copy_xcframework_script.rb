require 'cocoapods/xcode'

module Pod
  module Generator
    class CopyXCFrameworksScript
      # @return [Array<Pod::Xcode::XCFramework>] List of xcframeworks to copy
      #
      attr_reader :xcframeworks

      # @return [Pathname] the root directory of the sandbox
      #
      attr_reader :sandbox_root

      # @return [Platform] the platform of the target for which this script will run
      #
      attr_reader :platform

      # Creates a script for copying XCFramework slcies into an intermediate build directory
      #
      # @param  [Array<Pod::Xcode::XCFramework>] xcframeworks
      #         the list of xcframeworks to copy
      #
      # @param  [Pathname] sandbox_root
      #         the root of the Sandbox into which this script will be installed
      #
      # @param  [Platform] platform
      #         the platform of the target for which this script will be run
      #
      def initialize(xcframeworks, sandbox_root, platform)
        @xcframeworks = xcframeworks
        @sandbox_root = sandbox_root
        @platform = platform
      end

      # Saves the resource script to the given pathname.
      #
      # @param  [Pathname] pathname
      #         The path where the embed frameworks script should be saved.
      #
      # @return [void]
      #
      def save_as(pathname)
        pathname.open('w') do |file|
          file.puts(script)
        end
        File.chmod(0o755, pathname.to_s)
      end

      # @return [String] The contents of the embed frameworks script.
      #
      def generate
        script
      end

      private

      # @!group Private Helpers

      # @return [String] The contents of the prepare artifacts script.
      #
      def script
        script = <<-SH.strip_heredoc
#{Pod::Generator::ScriptPhaseConstants::DEFAULT_SCRIPT_PHASE_HEADER}

#{Pod::Generator::ScriptPhaseConstants::RSYNC_PROTECT_TMP_FILES}

#{variant_for_slice}

#{archs_for_slice}

copy_dir()
{
  local source="$1"
  local destination="$2"

  # Use filter instead of exclude so missing patterns don't throw errors.
  echo "rsync --delete -av "${RSYNC_PROTECT_TMP_FILES[@]}" --links --filter \\"- CVS/\\" --filter \\"- .svn/\\" --filter \\"- .git/\\" --filter \\"- .hg/\\" \\"${source}*\\" \\"${destination}\\""
  rsync --delete -av "${RSYNC_PROTECT_TMP_FILES[@]}" --links --filter "- CVS/" --filter "- .svn/" --filter "- .git/" --filter "- .hg/" "${source}"/* "${destination}"
}

SELECT_SLICE_RETVAL=""

select_slice() {
  local xcframework_name="$1"
  xcframework_name="${xcframework_name##*/}"
  local paths=("${@:2}")
  # Locate the correct slice of the .xcframework for the current architectures
  local target_path=""

  # Split archs on space so we can find a slice that has all the needed archs
  local target_archs=$(echo $ARCHS | tr " " "\\n")

  local target_variant=""
  if [[ "$PLATFORM_NAME" == *"simulator" ]]; then
    target_variant="simulator"
  fi
  if [[ ! -z ${EFFECTIVE_PLATFORM_NAME+x} && "$EFFECTIVE_PLATFORM_NAME" == *"maccatalyst" ]]; then
    target_variant="maccatalyst"
  fi
  for i in ${!paths[@]}; do
    local matched_all_archs="1"
    local slice_archs="$(archs_for_slice "${xcframework_name}/${paths[$i]}")"
    local slice_variant="$(variant_for_slice "${xcframework_name}/${paths[$i]}")"
    for target_arch in $target_archs; do
      if ! [[ "${slice_variant}" == "$target_variant" ]]; then
        matched_all_archs="0"
        break
      fi

      if ! echo "${slice_archs}" | tr " " "\\n" | grep -F -q -x "$target_arch"; then
        matched_all_archs="0"
        break
      fi
    done

    if [[ "$matched_all_archs" == "1" ]]; then
      # Found a matching slice
      echo "Selected xcframework slice ${paths[$i]}"
      SELECT_SLICE_RETVAL=${paths[$i]}
      break
    fi
  done
}

install_xcframework() {
  local basepath="$1"
  local name="$2"
  local package_type="$3"
  local paths=("${@:4}")

  # Locate the correct slice of the .xcframework for the current architectures
  select_slice "${basepath}" "${paths[@]}"
  local target_path="$SELECT_SLICE_RETVAL"
  if [[ -z "$target_path" ]]; then
    echo "warning: [CP] $(basename ${basepath}): Unable to find matching slice in '${paths[@]}' for the current build architectures ($ARCHS) and platform (${EFFECTIVE_PLATFORM_NAME-${PLATFORM_NAME}})."
    return
  fi
  local source="$basepath/$target_path"

  local destination="#{Pod::Target::BuildSettings::XCFRAMEWORKS_BUILD_DIR_VARIABLE}/${name}"

  if [ ! -d "$destination" ]; then
    mkdir -p "$destination"
  fi

  copy_dir "$source/" "$destination"
  echo "Copied $source to $destination"
}

        SH
        xcframeworks.each do |xcframework|
          slices = xcframework.slices.select { |f| f.platform.symbolic_name == platform.symbolic_name }
          next if slices.empty?
          args = install_xcframework_args(xcframework, slices)
          script << "install_xcframework #{args}\n"
        end

        script << "\n" unless xcframeworks.empty?
        script
      end

      def shell_escape(value)
        "\"#{value}\""
      end

      def install_xcframework_args(xcframework, slices)
        root = xcframework.path
        args = [shell_escape("${PODS_ROOT}/#{root.relative_path_from(sandbox_root)}")]
        args << shell_escape(xcframework.target_name)
        is_framework = xcframework.build_type.framework?
        args << shell_escape(is_framework ? 'framework' : 'library')
        slices.each do |slice|
          args << shell_escape(slice.path.dirname.relative_path_from(root))
        end
        args.join(' ')
      end

      def variant_for_slice
        script = ''
        script << "variant_for_slice()\n"
        script << "{\n"
        script << "  case \"$1\" in\n"
        xcframeworks.each do |xcframework|
          root = xcframework.path
          xcframework.slices.each do |slice|
            script << "  #{shell_escape(root.basename.join(slice.path.dirname.relative_path_from(root)))})\n"
            script << "    echo \"#{slice.platform_variant}\"\n"
            script << "    ;;\n"
          end
        end
        script << "  esac\n"
        script << '}'
      end

      def archs_for_slice
        script = ''
        script << "archs_for_slice()\n"
        script << "{\n"
        script << "  case \"$1\" in\n"
        xcframeworks.each do |xcframework|
          root = xcframework.path
          xcframework.slices.each do |slice|
            script << "  #{shell_escape(root.basename.join(slice.path.dirname.relative_path_from(root)))})\n"
            script << "    echo \"#{slice.supported_archs.sort.join(' ')}\"\n"
            script << "    ;;\n"
          end
        end
        script << "  esac\n"
        script << '}'
      end

      class << self
        # @param  [Pathname] xcframework_path
        #         the base path of the .xcframework bundle
        #
        # @return [Array<Pathname>] all found .dSYM paths
        #
        def dsym_folder(xcframework_path)
          basename = File.basename(xcframework_path, '.xcframework')
          dsym_basename = basename + '.dSYMs'
          path = xcframework_path.dirname + dsym_basename
          Pathname.new(path) if File.directory?(path)
        end
      end
    end
  end
end
