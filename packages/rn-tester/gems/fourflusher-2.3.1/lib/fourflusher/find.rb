require 'fourflusher/simctl'
require 'json'
require 'rubygems/version'

module Fourflusher
  # Metadata about an installed Xcode simulator
  class Simulator
    attr_reader :id
    attr_reader :name
    attr_reader :os_version

    def os_name
      @os_name.downcase.to_sym
    end

    def compatible?(other_version)
      other_version <= os_version
    end

    def to_s
      "#{@name} (#{@id}) - #{@os_name} #{@os_version}"
    end

    # Compare function for sorting simulators in order by
    # - OS Name: ascending
    # - OS Version: descending
    # - Device type: iPhone first, then ascending
    # - Model: ascending
    def sim_list_compare(other)
      return os_name.to_s <=> other.os_name.to_s unless os_name == other.os_name
      return other.os_version <=> os_version unless os_version == other.os_version
      device1, model1 = device_and_model
      device2, model2 = other.device_and_model
      return device_compare(device1, device2) unless device1 == device2
      return model1 <=> model2 unless model1.nil? || model2.nil?
      model2.nil? ? 1 : -1
    end

    def device_compare(my_device, other_device)
      return -1 if my_device == 'iPhone'
      return 1 if other_device == 'iPhone'
      return my_device <=> other_device unless my_device.nil? || other_device.nil?
      other_device.nil? ? 1 : -1
    end

    # Returns the [device, model] for use during sorting
    # Examples: [iPhone, 5s], [iPhone, 6s Plus], [Apple Watch Series 2, 38mm]
    def device_and_model
      if os_name == :watchos
        # Sample string: Apple Watch Series 2 - 38mm
        name.split ' - '
      else
        # Sample string: "iPhone 5s" or "iPhone 6 Plus" or "iPad Air 2"
        if name.start_with? 'Apple TV'
          # The last part is the model, and the rest is the device
          parts = name.rpartition(' ').reject { |str| str.strip.empty? }
          [parts[0...-1].join(' '), parts.drop(parts.count - 1).join(' ')].map(&:strip)
        else
          # The first part is device, and the rest is the model
          name.split ' ', 2
        end
      end
    end

    private

    def initialize(device_json, os_name, os_version)
      @id = device_json['udid']
      @name = device_json['name']
      @os_name = os_name
      @os_version = Gem::Version.new os_version
    end
  end

  # {
  #   "devices" : {
  #     "iOS 10.0" : [
  #       {
  #         "state" : "Shutdown",
  #         "availability" : "(available)",
  #         "name" : "iPhone 5",
  #         "udid" : "B7D21008-CC16-47D6-A9A9-885FE1FC47A8"
  #       },
  #       {
  #         "state" : "Shutdown",
  #         "availability" : "(available)",
  #         "name" : "iPhone 5s",
  #         "udid" : "38EAE7BD-90C3-4C3D-A672-3AF683EEC5A2"
  #       },
  #     ]
  #   }
  # }

  # Executes `simctl` commands
  class SimControl
    def simulator(filter, os_name = :ios, minimum_version = '1.0')
      usable_simulators(filter, os_name, minimum_version).first
    end

    def usable_simulators(filter = nil, os = :ios, minimum_version = '1.0')
      sims = fetch_sims
      oses = sims.map(&:os_name).uniq
      os = os.downcase.to_sym

      unless oses.include?(os)
        fail "Could not find a `#{os}` simulator (valid values: #{oses.join(', ')}). Ensure that "\
          "Xcode -> Window -> Devices has at least one `#{os}` simulator listed or otherwise add one."
      end

      return sims if filter.nil?
      minimum_version = Gem::Version.new(minimum_version)
      sims = sims.select { |sim| sim.os_name == os && sim.compatible?(minimum_version) }

      return [sims.min_by(&:os_version)] if filter == :oldest

      found_sims = sims.select { |sim| sim.name == filter }
      return found_sims if found_sims.count > 0
      sims.select { |sim| sim.name.start_with?(filter) }
    end

    private

    # Gets the simulators and transforms the simctl json into Simulator objects
    def fetch_sims
      device_list = JSON.parse(list(['-j', 'devices']))['devices']
      unless device_list.is_a?(Hash)
        msg = "Expected devices to be of type Hash but instated found #{device_list.class}"
        fail Fourflusher::Informative, msg
      end
      device_list.flat_map do |runtime_str, devices|
        # This format changed with Xcode 10.2.
        if runtime_str.start_with?('com.apple.CoreSimulator.SimRuntime.')
          # Sample string: com.apple.CoreSimulator.SimRuntime.iOS-12-2
          _unused, os_info = runtime_str.split 'com.apple.CoreSimulator.SimRuntime.'
          os_name, os_major_version, os_minor_version = os_info.split '-'
          os_version = "#{os_major_version}.#{os_minor_version}"
        else
          # Sample string: iOS 9.3
          os_name, os_version = runtime_str.split ' '
        end

        devices.map do |device|
          device_is_available = device['isAvailable'] == 'YES' || device['isAvailable'] == true

          if device['availability'] == '(available)' || device_is_available
            Simulator.new(device, os_name, os_version)
          end
        end
      end.compact.sort(&:sim_list_compare)
    end
  end
end
