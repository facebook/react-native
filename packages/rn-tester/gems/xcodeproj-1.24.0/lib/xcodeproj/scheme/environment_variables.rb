require 'xcodeproj/scheme/xml_element_wrapper'

module Xcodeproj
  class XCScheme
    VARIABLES_NODE = 'EnvironmentVariables'
    VARIABLE_NODE = 'EnvironmentVariable'

    # This class wraps the EnvironmentVariables node of a .xcscheme XML file. This
    # is just a container of EnvironmentVariable objects. It can either appear on a
    # LaunchAction or TestAction scheme group.
    #
    class EnvironmentVariables < XMLElementWrapper
      # @param [nil,REXML::Element,Array<EnvironmentVariable>,Array<Hash{Symbol => String,Bool}>] node_or_variables
      #        The 'EnvironmentVariables' XML node, or list of environment variables, that this object represents.
      #          - If nil, an empty 'EnvironmentVariables' XML node will be created
      #          - If an REXML::Element, it must be named 'EnvironmentVariables'
      #          - If an Array of objects or Hashes, they'll each be passed to {#assign_variable}
      #
      def initialize(node_or_variables = nil)
        create_xml_element_with_fallback(node_or_variables, VARIABLES_NODE) do
          @all_variables = []
          node_or_variables.each { |var| assign_variable(var) } unless node_or_variables.nil?
        end
      end

      # @return [Array<EnvironmentVariable>]
      #         The key value pairs currently set in @xml_element
      #
      def all_variables
        @all_variables ||= @xml_element.get_elements(VARIABLE_NODE).map { |variable| EnvironmentVariable.new(variable) }
      end

      # Adds a given variable to the set of environment variables, or replaces it if that key already exists
      #
      # @param [EnvironmentVariable,Hash{Symbol => String,Bool}] variable
      #        The variable to add or update, backed by an EnvironmentVariable node.
      #          - If an EnvironmentVariable, the previous reference will still be valid
      #          - If a Hash, must conform to {EnvironmentVariable#initialize} requirements
      # @return [Array<EnvironmentVariable>]
      #         The new set of environment variables after addition
      #
      def assign_variable(variable)
        env_var = variable.is_a?(EnvironmentVariable) ? variable : EnvironmentVariable.new(variable)
        all_variables.each { |existing_var| remove_variable(existing_var) if existing_var.key == env_var.key }
        @xml_element.add_element(env_var.xml_element)
        @all_variables << env_var
      end

      # Removes a specified variable (by string or object) from the set of environment variables
      #
      # @param [EnvironmentVariable,String] variable
      #        The variable to remove
      # @return [Array<EnvironmentVariable>]
      #         The new set of environment variables after removal
      #
      def remove_variable(variable)
        env_var = variable.is_a?(EnvironmentVariable) ? variable : all_variables.find { |var| var.key == variable }
        raise "Unexpected parameter type: #{env_var.class}" unless env_var.is_a?(EnvironmentVariable)
        @xml_element.delete_element(env_var.xml_element)
        @all_variables -= [env_var]
      end

      # @param [String] key
      #        The key to lookup
      # @return [EnvironmentVariable] variable
      #         Returns the matching environment variable for a specified key
      #
      def [](key)
        all_variables.find { |var| var.key == key }
      end

      # Assigns a value for a specified key
      #
      # @param [String] key
      #        The key to update in the environment variables
      # @param [String] value
      #        The value to lookup
      # @return [EnvironmentVariable] variable
      #         The newly updated environment variable
      #
      def []=(key, value)
        assign_variable(:key => key, :value => value)
        self[key]
      end

      # @return [Array<Hash{Symbol => String,Bool}>]
      #         The current environment variables represented as an array
      #
      def to_a
        all_variables.map(&:to_h)
      end
    end

    # This class wraps the EnvironmentVariable node of a .xcscheme XML file.
    # Environment variables are accessible via the NSDictionary returned from
    # [[NSProcessInfo processInfo] environment] in your app code.
    #
    class EnvironmentVariable < XMLElementWrapper
      # @param [nil,REXML::Element,Hash{Symbol => String,Bool}] node_or_variable
      #        - If nil, it will create a default XML node to use
      #        - If a REXML::Element, should be a <EnvironmentVariable> XML node to wrap
      #        - If a Hash, must contain keys :key and :value (Strings) and optionally :enabled (Boolean)
      #
      def initialize(node_or_variable)
        create_xml_element_with_fallback(node_or_variable, VARIABLE_NODE) do
          raise "Must pass a Hash with 'key' and 'value'!" unless node_or_variable.is_a?(Hash) &&
              node_or_variable.key?(:key) && node_or_variable.key?(:value)

          @xml_element.attributes['key'] = node_or_variable[:key]
          @xml_element.attributes['value'] = node_or_variable[:value]

          @xml_element.attributes['isEnabled'] = if node_or_variable.key?(:enabled)
                                                   bool_to_string(node_or_variable[:enabled])
                                                 else
                                                   bool_to_string(true)
                                                 end
        end
      end

      # Returns the EnvironmentValue's key
      # @return [String]
      #
      def key
        @xml_element.attributes['key']
      end

      # Sets the EnvironmentValue's key
      # @param [String] key
      #
      def key=(key)
        @xml_element.attributes['key'] = key
      end

      # Returns the EnvironmentValue's value
      # @return [String]
      #
      def value
        @xml_element.attributes['value']
      end

      # Sets the EnvironmentValue's value
      # @param [String] value
      #
      def value=(value)
        @xml_element.attributes['value'] = value
      end

      # Returns the EnvironmentValue's enabled state
      # @return [Bool]
      #
      def enabled
        string_to_bool(@xml_element.attributes['isEnabled'])
      end

      # Sets the EnvironmentValue's enabled state
      # @param [Bool] enabled
      #
      def enabled=(enabled)
        @xml_element.attributes['isEnabled'] = bool_to_string(enabled)
      end

      # @return [Hash{:key => String, :value => String, :enabled => Bool}]
      #         The environment variable XML node with attributes converted to a representative Hash
      #
      def to_h
        { :key => key, :value => value, :enabled => enabled }
      end
    end
  end
end
