require 'xcodeproj/workspace/reference'

module Xcodeproj
  class Workspace
    # Describes a file reference of a Workspace.
    #
    class FileReference < Reference
      # @return [String] the path to the project
      #
      attr_reader :path

      # @param [#to_s] path @see path
      # @param [#to_s] type @see type
      #
      def initialize(path, type = 'group')
        @path = Pathname.new(path.to_s).cleanpath.to_s
        @type = type.to_s
      end

      # @return [Bool] Wether a file reference is equal to another.
      #
      def ==(other)
        path == other.path && type == other.type
      end
      alias_method :eql?, :==

      # @return [Fixnum] A hash identical for equals objects.
      #
      def hash
        [path, type].hash
      end

      # Returns a file reference given XML representation.
      #
      # @param  [REXML::Element] xml_node
      #         the XML representation.
      #
      # @return [FileReference] The new file reference instance.
      #
      def self.from_node(xml_node)
        type, path = xml_node.attribute('location').value.split(':', 2)
        if type == 'group'
          path = prepend_parent_path(xml_node, path)
        end
        new(path, type)
      end

      # @return [REXML::Element] the XML representation of the file reference.
      #
      def to_node
        REXML::Element.new('FileRef').tap do |element|
          element.add_attribute('location', "#{type}:#{path}")
        end
      end

      # Returns the absolute path of a file reference given the path of the
      # directory containing workspace.
      #
      # @param  [#to_s] workspace_dir_path
      #         The Path of the directory containing the workspace.
      #
      # @return [String] The absolute path to the project.
      #
      def absolute_path(workspace_dir_path)
        workspace_dir_path = workspace_dir_path.to_s
        case type
        when 'group', 'container', 'self'
          File.expand_path(File.join(workspace_dir_path, path))
        when 'absolute'
          File.expand_path(path)
        when 'developer'
          raise "Developer workspace file reference type is not yet supported (#{path})"
        else
          raise "Unsupported workspace file reference type `#{type}`"
        end
      end
    end
  end
end
