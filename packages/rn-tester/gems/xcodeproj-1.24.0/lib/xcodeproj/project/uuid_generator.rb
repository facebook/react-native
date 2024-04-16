module Xcodeproj
  class Project
    class UUIDGenerator
      require 'digest'

      def initialize(projects)
        @projects = Array(projects)
        @paths_by_object = {}
      end

      def generate!
        generate_all_paths_by_objects(@projects)

        new_objects_by_project = Hash[@projects.map do |project|
          [project, switch_uuids(project)]
        end]
        all_new_objects_by_project = new_objects_by_project.values.flat_map(&:values)
        all_objects_by_uuid = @projects.map(&:objects_by_uuid).inject(:merge)
        all_objects = @projects.flat_map(&:objects)
        verify_no_duplicates!(all_objects, all_new_objects_by_project)
        @projects.each { |project| fixup_uuid_references(project, all_objects_by_uuid) }
        new_objects_by_project.each do |project, new_objects_by_uuid|
          project.instance_variable_set(:@generated_uuids, project.instance_variable_get(:@available_uuids))
          project.instance_variable_set(:@objects_by_uuid, new_objects_by_uuid)
        end
      end

      private

      UUID_ATTRIBUTES = [:remote_global_id_string, :container_portal, :target_proxy].freeze

      def verify_no_duplicates!(all_objects, all_new_objects)
        duplicates = all_objects - all_new_objects
        UserInterface.warn "[Xcodeproj] Generated duplicate UUIDs:\n\n" <<
          duplicates.map { |d| "#{d.isa} -- #{@paths_by_object[d]}" }.join("\n") unless duplicates.empty?
      end

      def fixup_uuid_references(target_project, all_objects_by_uuid)
        fixup = ->(object, attr) do
          if object.respond_to?(attr) && link = all_objects_by_uuid[object.send(attr)]
            object.send(:"#{attr}=", link.uuid)
          end
        end
        target_project.objects.each do |object|
          UUID_ATTRIBUTES.each do |attr|
            fixup[object, attr]
          end
        end

        if (project_attributes = target_project.root_object.attributes) && project_attributes['TargetAttributes']
          project_attributes['TargetAttributes'] = Hash[project_attributes['TargetAttributes'].map do |target_uuid, attributes|
            if test_target_id = attributes['TestTargetID']
              attributes = attributes.merge('TestTargetID' => all_objects_by_uuid[test_target_id].uuid)
            end
            if target_object = all_objects_by_uuid[target_uuid]
              target_uuid = target_object.uuid
            end
            [target_uuid, attributes]
          end]
        end
      end

      def generate_all_paths_by_objects(projects)
        projects.each { |project| generate_paths(project.root_object, project.path.basename.to_s) }
      end

      def generate_paths(object, path = '')
        existing = @paths_by_object[object] || path
        return existing if @paths_by_object.key?(object)
        @paths_by_object[object] = path.size > existing.size ? path : existing

        object.to_one_attributes.each do |attrb|
          obj = attrb.get_value(object)
          generate_paths(obj, path + '/' << attrb.plist_name) if obj
        end

        object.to_many_attributes.each do |attrb|
          attrb.get_value(object).each do |o|
            generate_paths(o, path + '/' << attrb.plist_name << "/#{path_component_for_object(o)}")
          end
        end

        object.references_by_keys_attributes.each do |attrb|
          attrb.get_value(object).each do |dictionary|
            dictionary.each do |key, value|
              generate_paths(value, path + '/' << attrb.plist_name << "/k:#{key}/#{path_component_for_object(value)}")
            end
          end
        end
      end

      def switch_uuids(project)
        project.mark_dirty!
        project.objects.each_with_object({}) do |object, hash|
          next unless path = @paths_by_object[object]
          uuid = uuid_for_path(path)
          object.instance_variable_set(:@uuid, uuid)
          hash[uuid] = object
        end
      end

      def uuid_for_path(path)
        Digest::MD5.hexdigest(path).upcase
      end

      def path_component_for_object(object)
        @path_component_for_object ||= Hash.new do |cache, key|
          component = tree_hash_to_path(key.to_tree_hash)
          component << key.hierarchy_path.to_s if key.respond_to?(:hierarchy_path)
          cache[key] = component
        end
        @path_component_for_object[object]
      end

      def tree_hash_to_path(object, depth = 4)
        return '|' if depth.zero?
        case object
        when Hash
          object.sort.each_with_object('') do |(key, value), string|
            string << key << ':' << tree_hash_to_path(value, depth - 1) << ','
          end
        when Array
          object.map do |value|
            tree_hash_to_path(value, depth - 1)
          end.join(',')
        else
          object.to_s
        end
      end
    end
  end
end
