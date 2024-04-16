# frozen_string_literal: true
class RubyObjectLeakTracker
  attr_reader :previous_count_hash, :current_count_hash

  def initialize
    @previous_count_hash = @current_count_hash = {}    
  end

  def difference_between_runs(basis=@previous_count_hash)
    @difference_between_runs ||= Hash[@current_count_hash.map do |object_class, count|
      [object_class, count - (basis[object_class] || 0)]
    end]
  end

  def total_difference_between_runs
    difference_between_runs(@initial_count_hash).values.inject(0) { |sum, count| sum + count }
  end

  def capture_initial_memory_usage
    capture_memory_usage
    @initial_count_hash = @current_count_hash
  end

  def capture_memory_usage
    @difference_between_runs = nil
    @previous_count_hash = @current_count_hash

    class_to_count = Hash.new { |hash, key| hash[key] = 0 }
    ObjectSpace.each_object { |obj| class_to_count[obj.class] += 1 }

    sorted_class_to_count = class_to_count.sort_by { |k, v| -v }
    @current_count_hash = Hash[sorted_class_to_count]
  end

  def dump_status(logger)
    diff = difference_between_runs
    most_used_objects = current_count_hash.to_a.sort_by(&:last).reverse[0, 20]

    most_used_objects.each do |object_class, count|
      delta = diff[object_class]
      logger.add(log_level(delta), sprintf("\t%s: %d (%+d)", object_class, count, delta))
    end
  end

  private
  def log_level(delta)
    delta > 0 ? Logger::WARN : Logger::DEBUG
  end
end
