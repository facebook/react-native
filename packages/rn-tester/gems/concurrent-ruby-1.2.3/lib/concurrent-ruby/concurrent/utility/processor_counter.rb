require 'etc'
require 'rbconfig'
require 'concurrent/delay'

module Concurrent
  # @!visibility private
  module Utility

    # @!visibility private
    class ProcessorCounter
      def initialize
        @processor_count          = Delay.new { compute_processor_count }
        @physical_processor_count = Delay.new { compute_physical_processor_count }
      end

      def processor_count
        @processor_count.value
      end

      def physical_processor_count
        @physical_processor_count.value
      end

      private

      def compute_processor_count
        if Concurrent.on_jruby?
          java.lang.Runtime.getRuntime.availableProcessors
        else
          Etc.nprocessors
        end
      end

      def compute_physical_processor_count
        ppc = case RbConfig::CONFIG["target_os"]
              when /darwin\d\d/
                IO.popen("/usr/sbin/sysctl -n hw.physicalcpu", &:read).to_i
              when /linux/
                cores = {} # unique physical ID / core ID combinations
                phy   = 0
                IO.read("/proc/cpuinfo").scan(/^physical id.*|^core id.*/) do |ln|
                  if ln.start_with?("physical")
                    phy = ln[/\d+/]
                  elsif ln.start_with?("core")
                    cid        = phy + ":" + ln[/\d+/]
                    cores[cid] = true if not cores[cid]
                  end
                end
                cores.count
              when /mswin|mingw/
                require 'win32ole'
                result_set = WIN32OLE.connect("winmgmts://").ExecQuery(
                  "select NumberOfCores from Win32_Processor")
                result_set.to_enum.collect(&:NumberOfCores).reduce(:+)
              else
                processor_count
              end
        # fall back to logical count if physical info is invalid
        ppc > 0 ? ppc : processor_count
      rescue
        return 1
      end
    end
  end

  # create the default ProcessorCounter on load
  @processor_counter = Utility::ProcessorCounter.new
  singleton_class.send :attr_reader, :processor_counter

  # Number of processors seen by the OS and used for process scheduling. For
  # performance reasons the calculated value will be memoized on the first
  # call.
  #
  # When running under JRuby the Java runtime call
  # `java.lang.Runtime.getRuntime.availableProcessors` will be used. According
  # to the Java documentation this "value may change during a particular
  # invocation of the virtual machine... [applications] should therefore
  # occasionally poll this property." Subsequently the result will NOT be
  # memoized under JRuby.
  #
  # Otherwise Ruby's Etc.nprocessors will be used.
  #
  # @return [Integer] number of processors seen by the OS or Java runtime
  #
  # @see http://docs.oracle.com/javase/6/docs/api/java/lang/Runtime.html#availableProcessors()
  def self.processor_count
    processor_counter.processor_count
  end

  # Number of physical processor cores on the current system. For performance
  # reasons the calculated value will be memoized on the first call.
  #
  # On Windows the Win32 API will be queried for the `NumberOfCores from
  # Win32_Processor`. This will return the total number "of cores for the
  # current instance of the processor." On Unix-like operating systems either
  # the `hwprefs` or `sysctl` utility will be called in a subshell and the
  # returned value will be used. In the rare case where none of these methods
  # work or an exception is raised the function will simply return 1.
  #
  # @return [Integer] number physical processor cores on the current system
  #
  # @see https://github.com/grosser/parallel/blob/4fc8b89d08c7091fe0419ca8fba1ec3ce5a8d185/lib/parallel.rb
  #
  # @see http://msdn.microsoft.com/en-us/library/aa394373(v=vs.85).aspx
  # @see http://www.unix.com/man-page/osx/1/HWPREFS/
  # @see http://linux.die.net/man/8/sysctl
  def self.physical_processor_count
    processor_counter.physical_processor_count
  end
end
