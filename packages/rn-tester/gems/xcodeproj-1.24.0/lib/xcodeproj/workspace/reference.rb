module Xcodeproj
  class Workspace
    # Describes a file/group reference of a Workspace.
    #
    class Reference
      # @return [String] the type of reference to the project
      #
      # This can be of the following values:
      # - absolute
      # - group
      # - container
      # - developer (unsupported)
      #
      attr_reader :type

      # Returns the relative path to the parent group reference (if one exists)
      # prepended to the passed in path.
      #
      # @param  [REXML::Element] xml_node
      #         the XML representation.
      #
      # @param  [String] path
      #         the path that will be prepended to.
      #
      # @return [String] the extended path including the parent node's path.
      #
      def self.prepend_parent_path(xml_node, path)
        if !xml_node.parent.nil? && (xml_node.parent.name == 'Group')
          group = GroupReference.from_node(xml_node.parent)
          if !group.location.nil? && !group.location.empty?
            path = '' if path.nil?
            path = File.join(group.location, path)
          end
        end

        path
      end
    end
  end
end
