# frozen_string_literal: true
module Xcodeproj
  class Project
    module Object
      class GroupableHelper
        class << self
          # @param  [PBXGroup, PBXFileReference] object
          #         The object to analyze.
          #
          # @return [PBXGroup, PBXProject] The parent of the object.
          #
          def parent(object)
            referrers = object.referrers.uniq
            if referrers.count > 1
              referrers = referrers.grep(PBXGroup)
            end

            if referrers.count == 0
              raise '[Xcodeproj] Consistency issue: no parent ' \
                "for object `#{object.display_name}`: "\
                "`#{object.referrers.join('`, `')}`"
            elsif referrers.count > 1
              raise '[Xcodeproj] Consistency issue: unexpected multiple parents ' \
                "for object `#{object.display_name}`: "\
                "#{object.referrers}"
            end
            referrers.first
          end

          # @param  [PBXGroup, PBXFileReference] object
          #         The object to analyze.
          #
          # @return [Array<PBXGroup, PBXProject>] The parents of the object.
          #
          def parents(object)
            if main_group?(object)
              []
            else
              parent = parent(object)
              parents(parent).push(parent)
            end
          end

          # @param  [PBXGroup, PBXFileReference] object
          #         The object to analyze.
          #
          # @return [String] A representation of the group hierarchy.
          #
          def hierarchy_path(object)
            unless main_group?(object)
              parent = parent(object)
              parent = parent.hierarchy_path if parent.respond_to?(:hierarchy_path)
              "#{parent}/#{object.display_name}"
            end
          end

          # @param  [PBXGroup, PBXFileReference] object
          #         The object to analyze.
          #
          # @return [Bool] Wether the object is the main group of the project.
          #
          def main_group?(object)
            object.equal?(object.project.main_group)
          end

          # Moves the object to a new parent.
          #
          # @param  [PBXGroup, PBXFileReference] object
          #         The object to move.
          #
          # @param  [PBXGroup] new_parent
          #         The new parent.
          #
          # @return [void]
          #
          def move(object, new_parent)
            unless object
              raise "[Xcodeproj] Attempt to move nil object to `#{new_parent}`."
            end
            unless new_parent
              raise "[Xcodeproj] Attempt to move object `#{object}` to nil parent."
            end
            if new_parent.equal?(object)
              raise "[Xcodeproj] Attempt to move object `#{object}` to itself."
            end
            if parents(new_parent).include?(object)
              raise "[Xcodeproj] Attempt to move object `#{object}` to a child object `#{new_parent}`."
            end

            object.parent.children.delete(object)
            new_parent << object
          end

          # @param  [PBXGroup, PBXFileReference] object
          #         The object to analyze.
          #
          # @return [Pathname] The absolute path of the object resolving the
          #         source tree.
          #
          def real_path(object)
            source_tree = source_tree_real_path(object)
            path = object.path || ''.freeze
            if source_tree
              source_tree + path
            else
              Pathname(path)
            end
          end

          # @param  [PBXGroup, PBXFileReference] object
          #         The object to analyze.
          #
          # @return [Pathname] The path of the object without resolving the
          #         source tree.
          #
          def full_path(object)
            folder =  case object.source_tree
                      when '<group>'
                        object_parent = parent(object)
                        if object_parent.isa == 'PBXProject'.freeze
                          nil
                        else
                          full_path(object_parent)
                        end
                      when 'SOURCE_ROOT'
                        nil
                      when '<absolute>'
                        Pathname.new('/'.freeze)
                      else
                        Pathname.new("${#{object.source_tree}}")
                      end
            folder ||= Pathname.new('')
            if object.path
              folder + object.path
            else
              folder
            end
          end

          # @param  [PBXGroup, PBXFileReference] object
          #         The object to analyze.
          #
          # @return [Pathname] The absolute path of the source tree of the
          #         object.
          #
          def source_tree_real_path(object)
            case object.source_tree
            when '<group>'
              object_parent = parent(object)
              if object_parent.isa == 'PBXProject'.freeze
                object.project.project_dir + object.project.root_object.project_dir_path
              else
                real_path(object_parent)
              end
            when 'SOURCE_ROOT'
              object.project.project_dir
            when '<absolute>'
              nil
            else
              Pathname.new("${#{object.source_tree}}")
            end
          end

          # @return [Hash{Symbol => String}] The source tree values by they
          #         symbol representation.
          #
          SOURCE_TREES_BY_KEY = {
            :absolute        => '<absolute>',
            :group           => '<group>',
            :project         => 'SOURCE_ROOT',
            :built_products  => 'BUILT_PRODUCTS_DIR',
            :developer_dir   => 'DEVELOPER_DIR',
            :sdk_root        => 'SDKROOT',
          }.freeze

          # Sets the source tree of the given object.
          #
          # @param  [Symbol, String] source_tree
          #         The source tree, either a string or a key for
          #         {SOURCE_TREES_BY_KEY}.
          #
          # @return [void]
          #
          def set_source_tree(object, source_tree)
            source_tree = normalize_source_tree(source_tree)
            object.source_tree = source_tree
          end

          # Sets the path of the given object according to the provided source
          # tree key. The path is converted to relative according to the real
          # path of the source tree for group and project source trees, if both
          # paths are relative or absolute. Otherwise the path is set as
          # provided.
          #
          # @param  [PBXGroup, PBXFileReference] object
          #         The object whose path needs to be set.
          #
          # @param  [#to_s] path
          #         The path.
          #
          # @param  [Symbol, String] source_tree
          #         The source tree, either a string or a key for
          #         {SOURCE_TREES_BY_KEY}.
          #
          # @return [void]
          #
          def set_path_with_source_tree(object, path, source_tree)
            path = Pathname(path)
            source_tree = normalize_source_tree(source_tree)
            object.source_tree = source_tree

            if source_tree == SOURCE_TREES_BY_KEY[:absolute]
              unless path.absolute?
                raise '[Xcodeproj] Attempt to set a relative path with an ' \
                  "absolute source tree: `#{path}`"
              end
              object.path = path.to_s
            elsif source_tree == SOURCE_TREES_BY_KEY[:group] || source_tree == SOURCE_TREES_BY_KEY[:project]
              source_tree_real_path = GroupableHelper.source_tree_real_path(object)
              if source_tree_real_path && source_tree_real_path.absolute? == path.absolute?
                relative_path = path.relative_path_from(source_tree_real_path)
                object.path = relative_path.to_s
              else
                object.path = path.to_s
              end
            else
              object.path = path.to_s
            end
          end

          private

          # @group Helpers
          #-------------------------------------------------------------------#

          # Converts the given source tree to its string value.
          #
          # @param  [Symbol, String] source_tree
          #         The source tree, either a string or a key for
          #         {SOURCE_TREES_BY_KEY}.
          #
          # @return [String] the string value of the source tree.
          #
          def normalize_source_tree(source_tree)
            if source_tree.is_a?(Symbol)
              source_tree = SOURCE_TREES_BY_KEY[source_tree]
            end

            unless SOURCE_TREES_BY_KEY.values.include?(source_tree)
              raise "[Xcodeproj] Unrecognized source tree option `#{source_tree}`"
            end
            source_tree
          end

          #-------------------------------------------------------------------#
        end
      end
    end
  end
end
