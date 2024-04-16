module Xcodeproj
  # Computes the recursive diff of Hashes, Array and other objects.
  #
  # Useful to compare two projects. Inspired from
  # 'active_support/core_ext/hash/diff'.
  #
  # @example
  #   h1 = { :common => 'value', :changed => 'v1' }
  #   h2 = { :common => 'value', :changed => 'v2', :addition => 'new_value' }
  #   h1.recursive_diff(h2) == {
  #     :changed => {
  #       :self  => 'v1',
  #       :other => 'v2'
  #     },
  #     :addition => {
  #       :self  => nil,
  #       :other => 'new_value'
  #     }
  #   } #=> true
  #
  #
  #
  #
  module Differ
    # Computes the recursive difference of two given values.
    #
    # @param  [Object] value_1
    #         The first value to compare.
    #
    # @param  [Object] value_2
    #         The second value to compare.
    #
    # @param  [Object] key_1
    #         The key for the diff of value_1.
    #
    # @param  [Object] key_2
    #         The key for the diff of value_2.
    #
    # @param  [Object] id_key
    #         The key used to identify correspondent hashes in an array.
    #
    # @return [Hash] The diff
    # @return [Nil] if the given values are equal.
    #
    def self.diff(value_1, value_2, options = {})
      options[:key_1] ||= 'value_1'
      options[:key_2] ||= 'value_2'
      options[:id_key] ||= nil

      method = if value_1.class == value_2.class
                 case value_1
                 when Hash  then :hash_diff
                 when Array then :array_diff
                 else :generic_diff
                 end
               else
                 :generic_diff
               end
      send(method, value_1, value_2, options)
    end

    # Optimized for reducing the noise from the tree hash of projects
    #
    def self.project_diff(project_1, project_2, key_1 = 'project_1', key_2 = 'project_2')
      project_1 = project_1.to_tree_hash unless project_1.is_a?(Hash)
      project_2 = project_2.to_tree_hash unless project_2.is_a?(Hash)
      options = {
        :key_1  => key_1,
        :key_2  => key_2,
        :id_key => 'displayName',
      }
      diff(project_1, project_2, options)
    end

    #-------------------------------------------------------------------------#

    public

    # @!group Type specific handlers

    # Computes the recursive difference of two hashes.
    #
    # @see diff
    #
    def self.hash_diff(value_1, value_2, options)
      ensure_class(value_1, Hash)
      ensure_class(value_2, Hash)
      return nil if value_1 == value_2

      result = {}
      all_keys = (value_1.keys + value_2.keys).uniq
      all_keys.each do |key|
        key_value_1 = value_1[key]
        key_value_2 = value_2[key]
        diff = diff(key_value_1, key_value_2, options)
        if diff
          result[key] = diff if diff
        end
      end
      if result.empty?
        nil
      else
        result
      end
    end

    # Returns the recursive diff of two arrays.
    #
    # @see diff
    #
    def self.array_diff(value_1, value_2, options)
      ensure_class(value_1, Array)
      ensure_class(value_2, Array)
      return nil if value_1 == value_2

      new_objects_value_1 = array_non_unique_diff(value_1, value_2)
      new_objects_value_2 = array_non_unique_diff(value_2, value_1)
      return nil if value_1.empty? && value_2.empty?

      matched_diff = {}
      if id_key = options[:id_key]
        matched_value_1 = []
        matched_value_2 = []
        new_objects_value_1.each do |entry_value_1|
          if entry_value_1.is_a?(Hash)
            id_value = entry_value_1[id_key]
            entry_value_2 = new_objects_value_2.find do |entry|
              entry[id_key] == id_value
            end
            if entry_value_2
              matched_value_1 << entry_value_1
              matched_value_2 << entry_value_2
              diff = diff(entry_value_1, entry_value_2, options)
              matched_diff[id_value] = diff if diff
            end
          end
        end

        new_objects_value_1 -= matched_value_1
        new_objects_value_2 -= matched_value_2
      end

      if new_objects_value_1.empty? && new_objects_value_2.empty?
        if matched_diff.empty?
          nil
        else
          matched_diff
        end
      else
        result = {}
        result[options[:key_1]] = new_objects_value_1 unless new_objects_value_1.empty?
        result[options[:key_2]] = new_objects_value_2 unless new_objects_value_2.empty?
        result[:diff] = matched_diff unless matched_diff.empty?
        result
      end
    end

    # Returns the diff of two generic objects.
    #
    # @see diff
    #
    def self.generic_diff(value_1, value_2, options)
      return nil if value_1 == value_2

      {
        options[:key_1] => value_1,
        options[:key_2] => value_2,
      }
    end

    #-------------------------------------------------------------------------#

    public

    # @!group Cleaning

    # Returns a copy of the hash where the given key is removed recursively.
    #
    # @param  [Hash] hash
    #         The hash to clean
    #
    # @param  [Object] key
    #         The key to remove.
    #
    # @return [Hash] A copy of the hash without the key.
    #
    def self.clean_hash(hash, key)
      new_hash = hash.dup
      self.clean_hash!(new_hash, key)
      new_hash
    end

    # Recursively cleans a key from the given hash.
    #
    # @param  [Hash] hash
    #         The hash to clean
    #
    # @param  [Object] key
    #         The key to remove.
    #
    # @return [void]
    #
    def self.clean_hash!(hash, key)
      hash.delete(key)
      hash.each do |_, value|
        case value
        when Hash
          clean_hash!(value, key)
        when Array
          value.each { |entry| clean_hash!(entry, key) if entry.is_a?(Hash) }
        end
      end
    end

    #-------------------------------------------------------------------------#

    private

    # @! Helpers

    # Ensures that the given object belongs to the given class.
    #
    # @param  [Object] object
    #         The object to check.
    #
    # @param  [Class] klass
    #         the expected class of the object.
    #
    # @raise  If the object doesn't belong to the given class.
    #
    # @return [void]
    #
    def self.ensure_class(object, klass)
      raise "Wrong type `#{object.inspect}`" unless object.is_a?(klass)
    end

    # Returns the difference between two arrays, taking into account the number of times an element
    # repeats in both arrays.
    #
    # @param  [Array] value_1
    #         First array to the difference operation.
    #
    # @param  [Array] value_2
    #         Second array to the difference operation.
    #
    # @return [Array]
    #
    def self.array_non_unique_diff(value_1, value_2)
      value_2_elements_by_count = value_2.reduce({}) do |hash, element|
        updated_element_hash = hash.key?(element) ? { element => hash[element] + 1 } : { element => 1 }
        hash.merge(updated_element_hash)
      end

      value_1_elements_by_deletions =
        value_1.to_set.map do |element|
          times_to_delete_element = value_2_elements_by_count[element] || 0
          next [element, times_to_delete_element]
        end.to_h

      value_1.select do |element|
        if value_1_elements_by_deletions[element] > 0
          value_1_elements_by_deletions[element] -= 1
          next false
        end
        next true
      end
    end
    #-------------------------------------------------------------------------#
  end
end
