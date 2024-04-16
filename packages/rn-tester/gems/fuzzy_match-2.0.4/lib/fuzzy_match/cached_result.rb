require 'active_record_inline_schema'

class FuzzyMatch
  class CachedResult < ::ActiveRecord::Base
    if ::ActiveRecord::VERSION::STRING >= '3.2'
      self.table_name = :fuzzy_match_cached_results
    else
      set_table_name :fuzzy_match_cached_results
    end

    class << self
      def setup(from_scratch = false)
        if from_scratch
          connection.drop_table :fuzzy_match_cached_results rescue nil
        end
        auto_upgrade!
      end
    end

    col :a_class
    col :a
    col :b_class
    col :b
    add_index [:a_class, :b_class, :a], :name => 'aba'
    add_index [:a_class, :b_class, :b], :name => 'abb'
    add_index [:a_class, :b_class, :a, :b], :name => 'abab'
    
    module ActiveRecordBaseExtension
      # required options:
      # :primary_key - what to call on this class
      # :foreign_key - what to call on the other class
      def cache_fuzzy_match_with(other_active_record_class, options)
        other = other_active_record_class.to_s.singularize.camelcase
        me = name
        if me < other
          a = me
          b = other
          primary_key = :a
          foreign_key = :b
        else
          a = other
          b = me
          primary_key = :b
          foreign_key = :a
        end

        # def aircraft
        define_method other.underscore.pluralize do
          other.constantize.where options[:foreign_key] => send("#{other.underscore.pluralize}_foreign_keys")
        end
  
        # def flight_segments_foreign_keys
        define_method "#{other.underscore.pluralize}_foreign_keys" do
          fz = ::FuzzyMatch::CachedResult.arel_table
          sql = fz.project(fz[foreign_key]).where(fz["#{primary_key}_class".to_sym].eq(self.class.name).and(fz["#{foreign_key}_class".to_sym].eq(other)).and(fz[primary_key].eq(send(options[:primary_key])))).to_sql
          connection.select_values sql
        end
  
        # def cache_aircraft!
        define_method "cache_#{other.underscore.pluralize}!" do
          other_class = other.constantize
          primary_key_value = send options[:primary_key]
          other_class.fuzzy_match.find_all(primary_key_value).each do |other_instance|
            attrs = {}
            attrs[primary_key] = primary_key_value
            attrs["#{primary_key}_class"] = self.class.name
            attrs[foreign_key] = other_instance.send options[:foreign_key]
            attrs["#{foreign_key}_class"] = other
            unless ::FuzzyMatch::CachedResult.exists? attrs
              ::FuzzyMatch::CachedResult.create! attrs
            end
          end
        end
      end
    end
  end
end

::ActiveRecord::Base.extend ::FuzzyMatch::CachedResult::ActiveRecordBaseExtension
