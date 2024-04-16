require 'xcodeproj/workspace/reference'

module Xcodeproj
  class Workspace
    # Describes a group reference of a Workspace.
    #
    class GroupReference < Reference
      # @return [String] the name of the group
      #
      attr_reader :name

      # @return [String] the location of the group on disk
      #
      attr_reader :location

      # @param [#to_s] name @see name
      # @param [#to_s] type @see type
      # @param [#to_s] location @see location
      #
      def initialize(name, type = 'container', location = '')
        @name = name.to_s
        @type = type.to_s
        @location = location.to_s
      end

      # @return [Bool] Whether a group reference is equal to another.
      #
      def ==(other)
        name == other.name && type == other.type && location == other.location
      end
      alias_method :eql?, :==

      # @return [Fixnum] A hash identical for equals objects.
      #
      def hash
        [name, type, location].hash
      end

      # Returns a group reference given XML representation.
      #
      # @param  [REXML::Element] xml_node
      #         the XML representation.
      #
      # @return [GroupReference] The new group reference instance.
      #
      def self.from_node(xml_node)
        location_array = xml_node.attribute('location').value.split(':', 2)
        type = location_array.first
        location = location_array[1] || ''
        if type == 'group'
          location = prepend_parent_path(xml_node, location)
        end
        name = xml_node.attribute('name').value
        new(name, type, location)
      end

      # @return [REXML::Element] the XML representation of the group reference.
      #
      def to_node
        REXML::Element.new('Group').tap do |element|
          element.add_attribute('location', "#{type}:#{location}")
          element.add_attribute('name', "#{name}")
        end
      end
    end
  end
end
