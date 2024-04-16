# frozen_string_literal: true
require 'xcodeproj/project/object/helpers/groupable_helper'

module Xcodeproj
  class Project
    module Object
      class FileReferencesFactory
        class << self
          # Creates a new reference with the given path and adds it to the
          # given group. The reference is configured according to the extension
          # of the path.
          #
          # @param  [PBXGroup] group
          #         The group to which to add the reference.
          #
          # @param  [#to_s] path
          #         The, preferably absolute, path of the reference.
          #
          # @param  [Symbol] source_tree
          #         The source tree key to use to configure the path (@see
          #         GroupableHelper::SOURCE_TREES_BY_KEY).
          #
          # @return [PBXFileReference, XCVersionGroup] The new reference.
          #
          def new_reference(group, path, source_tree)
            ref = case File.extname(path).downcase
                  when '.xcdatamodeld'
                    new_xcdatamodeld(group, path, source_tree)
                  when '.xcodeproj'
                    new_subproject(group, path, source_tree)
                  else
                    new_file_reference(group, path, source_tree)
                  end

            configure_defaults_for_file_reference(ref)
            ref
          end

          # Creates a file reference to a static library and adds it to the
          # given group.
          #
          # @param  [PBXGroup] group
          #         The group to which to add the reference.
          #
          # @param  [#to_s] product_basename
          #         The name of the static library.
          #
          # @return [PBXFileReference] The new file reference.
          #
          def new_product_ref_for_target(group, product_basename, product_type)
            if product_type == :static_library
              prefix = 'lib'
            end
            extension = Constants::PRODUCT_UTI_EXTENSIONS[product_type]
            path = "#{prefix}#{product_basename}"
            path += ".#{extension}" if extension
            ref = new_reference(group, path, :built_products)
            ref.include_in_index = '0'
            ref.set_explicit_file_type
            ref
          end

          # Creates a file reference to a new bundle and adds it to the given
          # group.
          #
          # @param  [PBXGroup] group
          #         The group to which to add the reference.
          #
          # @param  [#to_s] product_basename
          #         The name of the bundle.
          #
          # @return [PBXFileReference] The new file reference.
          #
          def new_bundle(group, product_basename)
            ref = new_reference(group, "#{product_basename}.bundle", :built_products)
            ref.include_in_index = '0'
            ref.set_explicit_file_type('wrapper.cfbundle')
            ref
          end

          private

          # @group Private Helpers
          #-------------------------------------------------------------------#

          # Creates a new file reference with the given path and adds it to the
          # given group.
          #
          # @param  [PBXGroup] group
          #         The group to which to add the reference.
          #
          # @param  [#to_s] path
          #         The, preferably absolute, path of the reference.
          #
          # @param  [Symbol] source_tree
          #         The source tree key to use to configure the path (@see
          #         GroupableHelper::SOURCE_TREES_BY_KEY).
          #
          # @return [PBXFileReference] The new file reference.
          #
          def new_file_reference(group, path, source_tree)
            path = Pathname.new(path)
            ref = group.project.new(PBXFileReference)
            group.children << ref
            GroupableHelper.set_path_with_source_tree(ref, path, source_tree)
            ref.set_last_known_file_type
            ref
          end

          # Creates a new version group reference to an xcdatamodeled adding
          # the xcdatamodel files included in the wrapper as children file
          # references.
          #
          # @param  [PBXGroup] group
          #         The group to which to add the reference.
          #
          # @param  [#to_s] path
          #         The, preferably absolute, path of the reference.
          #
          # @param  [Symbol] source_tree
          #         The source tree key to use to configure the path (@see
          #         GroupableHelper::SOURCE_TREES_BY_KEY).
          #
          # @note  To match Xcode behaviour the current version is read from
          #         the .xccurrentversion file, if it doesn't exist the last
          #         xcdatamodel according to its path is set as the current
          #         version.
          #
          # @return [XCVersionGroup] The new reference.
          #
          def new_xcdatamodeld(group, path, source_tree)
            path = Pathname.new(path)
            ref = group.project.new(XCVersionGroup)
            group.children << ref
            GroupableHelper.set_path_with_source_tree(ref, path, source_tree)
            ref.version_group_type = 'wrapper.xcdatamodel'

            real_path = group.real_path.join(path)
            current_version_name = nil
            if real_path.exist?
              real_path.children.each do |child_path|
                if File.extname(child_path) == '.xcdatamodel'
                  new_file_reference(ref, child_path, :group)
                elsif File.basename(child_path) == '.xccurrentversion'
                  full_path = real_path + File.basename(child_path)
                  xccurrentversion = Plist.read_from_path(full_path)
                  current_version_name = xccurrentversion['_XCCurrentVersionName']
                end
              end

              if current_version_name
                ref.current_version = ref.children.find do |obj|
                  obj.path.split('/').last == current_version_name
                end
              end
            end

            ref
          end

          # Creates a file reference to another Xcode subproject and setups the
          # proxies to the targets.
          #
          # @param  [PBXGroup] group
          #         The group to which to add the reference.
          #
          # @param  [#to_s] path
          #         The, preferably absolute, path of the reference.
          #
          # @param  [Symbol] source_tree
          #         The source tree key to use to configure the path (@see
          #         GroupableHelper::SOURCE_TREES_BY_KEY).
          #
          # @note   To analyze the targets the given project is read and thus
          #         it should already exist in the disk.
          #
          # @return [PBXFileReference] The new file reference.
          #
          def new_subproject(group, path, source_tree)
            ref = new_file_reference(group, path, source_tree)
            ref.include_in_index = nil

            product_group_ref = find_products_group_ref(group, true)

            subproj = Project.open(path)
            subproj.products_group.files.each do |product_reference|
              container_proxy = group.project.new(PBXContainerItemProxy)
              container_proxy.container_portal = ref.uuid
              container_proxy.proxy_type = Constants::PROXY_TYPES[:reference]
              container_proxy.remote_global_id_string = product_reference.uuid
              container_proxy.remote_info = 'Subproject'

              reference_proxy = group.project.new(PBXReferenceProxy)
              extension = File.extname(product_reference.path)[1..-1]
              reference_proxy.file_type = Constants::FILE_TYPES_BY_EXTENSION[extension]
              reference_proxy.path = product_reference.path
              reference_proxy.remote_ref = container_proxy
              reference_proxy.source_tree = 'BUILT_PRODUCTS_DIR'

              product_group_ref << reference_proxy
            end

            attribute = PBXProject.references_by_keys_attributes.find { |attrb| attrb.name == :project_references }
            project_reference = ObjectDictionary.new(attribute, group.project.root_object)
            project_reference[:project_ref] = ref
            project_reference[:product_group] = product_group_ref
            group.project.root_object.project_references << project_reference

            ref
          end

          # Configures a file reference according to the extension to math
          # Xcode behaviour.
          #
          # @param  [PBXFileReference] ref
          #         The file reference to configure.
          #
          # @note   To closely match the Xcode behaviour the name attribute of
          #         the file reference is set only if the path of the file is
          #         not equal to the path of the group.
          #
          # @return [void]
          #
          def configure_defaults_for_file_reference(ref)
            if ref.path.include?('/')
              ref.name = ref.path.split('/').last
            end

            if File.extname(ref.path).downcase == '.framework'
              ref.include_in_index = nil
            end
          end

          def find_products_group_ref(group, should_create = false)
            product_group_ref =
              (group.project.root_object.product_ref_group ||= group.project.main_group.find_subpath('Products', should_create))
            product_group_ref
          end

          #-------------------------------------------------------------------#
        end
      end
    end
  end
end
