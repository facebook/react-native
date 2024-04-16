module Pod
  class Installer
    class Xcode
      class PodsProjectGenerator
        # Controller class responsible of installing the file references of the
        # specifications in the Pods project.
        #
        class FileReferencesInstaller
          # Regex for extracting the region portion of a localized file path. Ex. `Resources/en.lproj` --> `en`
          LOCALIZATION_REGION_FILEPATTERN_REGEX = /(\/|^)(?<region>[^\/]*?)\.lproj(\/|$)/

          # @return [Sandbox] The sandbox of the installation.
          #
          attr_reader :sandbox

          # @return [Array<PodTarget>] The pod targets of the installation.
          #
          attr_reader :pod_targets

          # @return [Project] The project to install the file references into.
          #
          attr_reader :pods_project

          # @return [Boolean] add support for preserving the file structure of externally sourced pods, in addition to local pods.
          #
          attr_reader :preserve_pod_file_structure

          # Initialize a new instance
          #
          # @param [Sandbox] sandbox @see #sandbox
          # @param [Array<PodTarget>] pod_targets @see #pod_targets
          # @param [Project] pods_project @see #pods_project
          # @param [Boolean] preserve_pod_file_structure @see #preserve_pod_file_structure
          #
          def initialize(sandbox, pod_targets, pods_project, preserve_pod_file_structure = false)
            @sandbox = sandbox
            @pod_targets = pod_targets
            @pods_project = pods_project
            @preserve_pod_file_structure = preserve_pod_file_structure
          end

          # Installs the file references.
          #
          # @return [void]
          #
          def install!
            refresh_file_accessors
            prepare_pod_groups
            add_source_files_references
            add_frameworks_bundles
            add_vendored_libraries
            add_resources
            add_developer_files unless sandbox.development_pods.empty?
            link_headers
          end

          #-----------------------------------------------------------------------#

          private

          # @!group Installation Steps

          # Reads the file accessors contents from the file system.
          #
          # @note   The contents of the file accessors are modified by the clean
          #         step of the #{PodSourceInstaller} and by the pre install hooks.
          #
          # @return [void]
          #
          def refresh_file_accessors
            file_accessors.reject do |file_accessor|
              pod_name = file_accessor.spec.name
              sandbox.local?(pod_name)
            end.map(&:path_list).uniq.each(&:read_file_system)
          end

          # Prepares the main groups to which all files will be added for the respective target
          #
          def prepare_pod_groups
            file_accessors.each do |file_accessor|
              pod_name = file_accessor.spec.name
              next unless sandbox.local?(pod_name)
              root_name = Specification.root_name(pod_name)
              path = file_accessor.root
              group = pods_project.group_for_spec(root_name)
              group.set_path(path) unless group.path == path
            end
          end

          # Adds the source files of the Pods to the Pods project.
          #
          # @note   The source files are grouped by Pod and in turn by subspec
          #         (recursively).
          #
          # @return [void]
          #
          def add_source_files_references
            UI.message '- Adding source files' do
              add_file_accessors_paths_to_pods_group(:source_files, nil, true)
            end
          end

          # Adds the bundled frameworks to the Pods project
          #
          # @return [void]
          #
          def add_frameworks_bundles
            UI.message '- Adding frameworks' do
              add_file_accessors_paths_to_pods_group(:vendored_frameworks, :frameworks)
            end
          end

          # Adds the bundled libraries to the Pods project
          #
          # @return [void]
          #
          def add_vendored_libraries
            UI.message '- Adding libraries' do
              add_file_accessors_paths_to_pods_group(:vendored_libraries, :frameworks)
            end
          end

          # Adds the resources of the Pods to the Pods project.
          #
          # @note   The source files are grouped by Pod and in turn by subspec
          #         (recursively) in the resources group.
          #
          # @return [void]
          #
          def add_resources
            UI.message '- Adding resources' do
              refs = add_file_accessors_paths_to_pods_group(:resources, :resources, true)
              refs.concat add_file_accessors_paths_to_pods_group(:resource_bundle_files, :resources, true)
              add_known_regions(refs)
            end
          end

          def add_developer_files
            UI.message '- Adding development pod helper files' do
              file_accessors.each do |file_accessor|
                pod_name = file_accessor.spec.name
                next unless sandbox.local?(pod_name)
                root_name = Specification.root_name(pod_name)
                paths = file_accessor.developer_files
                next if paths.empty?
                group = pods_project.group_for_spec(root_name, :developer)
                paths.each do |path|
                  ref = pods_project.add_file_reference(path, group, false)
                  if path.extname == '.podspec'
                    pods_project.mark_ruby_file_ref(ref)
                  end
                end
              end
            end
          end

          # Creates the link to the headers of the Pod in the sandbox.
          #
          # @return [void]
          #
          def link_headers
            UI.message '- Linking headers' do
              pod_targets.each do |pod_target|
                # When integrating Pod as frameworks, built Pods are built into
                # frameworks, whose headers are included inside the built
                # framework. Those headers do not need to be linked from the
                # sandbox.
                next if pod_target.build_as_framework? && pod_target.should_build?

                pod_target_header_mappings = pod_target.header_mappings_by_file_accessor.values
                pod_target_header_mappings.each do |header_mappings|
                  header_mappings.each do |namespaced_path, files|
                    pod_target.build_headers.add_files(namespaced_path, files)
                  end
                end

                public_header_mappings = pod_target.public_header_mappings_by_file_accessor.values
                public_header_mappings.each do |header_mappings|
                  header_mappings.each do |namespaced_path, files|
                    sandbox.public_headers.add_files(namespaced_path, files)
                  end
                end
              end
            end
          end

          #-----------------------------------------------------------------------#

          private

          # @!group Private Helpers

          # @return [Array<Sandbox::FileAccessor>] The file accessors for all the
          #         specs platform combinations.
          #
          def file_accessors
            @file_accessors ||= pod_targets.flat_map(&:file_accessors).compact
          end

          # Adds file references to the list of the paths returned by the file
          # accessor with the given key to the given group of the Pods project.
          #
          # @param  [Symbol] file_accessor_key
          #         The method of the file accessor which would return the list of
          #         the paths.
          #
          # @param  [Symbol] group_key
          #         The key of the group of the Pods project.
          #
          # @param  [Boolean] reflect_file_system_structure
          #         Whether organizing a local pod's files in subgroups inside
          #         the pod's group is allowed.
          #
          # @return [Array<PBXFileReference>] the added file references
          #
          def add_file_accessors_paths_to_pods_group(file_accessor_key, group_key = nil, reflect_file_system_structure = false)
            file_accessors.flat_map do |file_accessor|
              paths = file_accessor.send(file_accessor_key)
              paths = allowable_project_paths(paths)
              next [] if paths.empty?

              pod_name = file_accessor.spec.name
              preserve_pod_file_structure_flag = (sandbox.local?(pod_name) || preserve_pod_file_structure) && reflect_file_system_structure
              base_path = preserve_pod_file_structure_flag ? common_path(paths) : nil
              actual_group_key = preserve_pod_file_structure_flag ? nil : group_key
              group = pods_project.group_for_spec(pod_name, actual_group_key)
              paths.map do |path|
                pods_project.add_file_reference(path, group, preserve_pod_file_structure_flag, base_path)
              end
            end
          end

          # Filters a list of paths down to those paths which can be added to
          # the Xcode project. Some paths are intermediates and only their children
          # should be added, while some paths are treated as bundles and their
          # children should not be added directly.
          #
          # @param  [Array<Pathname>] paths
          #         The paths to files or directories on disk.
          #
          # @return [Array<Pathname>] The paths which can be added to the Xcode project
          #
          def allowable_project_paths(paths)
            lproj_paths = Set.new
            lproj_paths_with_files = Set.new

            # Remove all file ref under .docc folder, but preserve the .docc folder
            paths = merge_to_docc_folder(paths)

            allowable_paths = paths.select do |path|
              path_str = path.to_s

              # We add the directory for a Core Data model, but not the items in it.
              next if path_str =~ /.*\.xcdatamodeld\/.+/i

              # We add the directory for a Core Data migration mapping, but not the items in it.
              next if path_str =~ /.*\.xcmappingmodel\/.+/i

              # We add the directory for an asset catalog, but not the items in it.
              next if path_str =~ /.*\.xcassets\/.+/i

              if path_str =~ /\.lproj(\/|$)/i
                # If the element is an .lproj directory then save it and potentially
                # add it later if we don't find any contained items.
                if path_str =~ /\.lproj$/i && path.directory?
                  lproj_paths << path
                  next
                end

                # Collect the paths for the .lproj directories that contain files.
                lproj_path = /(^.*\.lproj)\/.*/i.match(path_str)[1]
                lproj_paths_with_files << Pathname(lproj_path)

                # Directories nested within an .lproj directory are added as file
                # system references so their contained items are not added directly.
                next if path.dirname.dirname == lproj_path
              end

              true
            end

            # Only add the path for the .lproj directories that do not have anything
            # within them added as well. This generally happens if the glob within the
            # resources directory was not a recursive glob.
            allowable_paths + lproj_paths.subtract(lproj_paths_with_files).to_a
          end

          # Returns a Pathname of the nearest parent from which all the given paths descend.
          # Converts each Pathname to a list of path components and finds the longest common prefix
          #
          # @param  [Array<Pathname>] paths
          #         The paths to files or directories on disk. Must be absolute paths
          #
          # @return [Pathname] Pathname of the nearest parent shared by paths, or nil if none exists
          #
          def common_path(paths)
            return nil if paths.empty?
            strs = paths.map do |path|
              unless path.absolute?
                raise ArgumentError, "Paths must be absolute #{path}"
              end
              path.dirname.to_s
            end
            min, max = strs.minmax
            min = min.split('/')
            max = max.split('/')
            idx = min.size.times { |i| break i if min[i] != max[i] }
            result = Pathname.new(min[0...idx].join('/'))
            # Don't consider "/" a common path
            return result unless result.to_s == '' || result.to_s == '/'
          end

          # Adds the known localization regions to the root of the project
          #
          # @param [Array<PBXFileReferences>] file_references the resource file references
          #
          def add_known_regions(file_references)
            pattern = LOCALIZATION_REGION_FILEPATTERN_REGEX
            regions = file_references.map do |ref|
              if (match = ref.path.to_s.match(pattern))
                match[:region]
              end
            end.compact

            pods_project.root_object.known_regions = (pods_project.root_object.known_regions | regions).sort
          end

          #-----------------------------------------------------------------------#
        end
      end
    end
  end
end

# If we have an non-empty .docc folder, remove all paths under the folder
# but keep the folder itself
#
# @param [Array<Pathname>] paths the paths to inspect
#
# @return [Array<Pathname>] The resulted list of paths.
#
def merge_to_docc_folder(paths)
  docc_paths_with_files = Set.new
  allowable_paths = paths.select do |path|
    path_str = path.to_s

    if path_str =~ /\.docc(\/|$)/i

      # we want folder with files
      next if path.directory?

      # remove everything after ".docc", but keep ".docc"
      folder_path = path_str.split("\.docc")[0] + "\.docc"

      docc_paths_with_files << Pathname(folder_path)
      next

    end
    true
  end

  allowable_paths + docc_paths_with_files.to_a
end
