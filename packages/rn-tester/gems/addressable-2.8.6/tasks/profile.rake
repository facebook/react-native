# frozen_string_literal: true

namespace :profile do
  desc "Profile Template match memory allocations"
  task :template_match_memory do
    require "memory_profiler"
    require "addressable/template"

    start_at = Time.now.to_f
    template = Addressable::Template.new("http://example.com/{?one,two,three}")
    report = MemoryProfiler.report do
      30_000.times do
        template.match(
          "http://example.com/?one=one&two=floo&three=me"
        )
      end
    end
    end_at = Time.now.to_f
    print_options = { scale_bytes: true, normalize_paths: true }
    puts "\n\n"

    if ENV["CI"]
      report.pretty_print(print_options)
    else
      t_allocated = report.scale_bytes(report.total_allocated_memsize)
      t_retained  = report.scale_bytes(report.total_retained_memsize)

      puts "Total allocated: #{t_allocated} (#{report.total_allocated} objects)"
      puts "Total retained:  #{t_retained} (#{report.total_retained} objects)"
      puts "Took #{end_at - start_at} seconds"

      FileUtils.mkdir_p("tmp")
      report.pretty_print(to_file: "tmp/memprof.txt", **print_options)
    end
  end

  desc "Profile URI parse memory allocations"
  task :memory do
    require "memory_profiler"
    require "addressable/uri"
    if ENV["IDNA_MODE"] == "pure"
      Addressable.send(:remove_const, :IDNA)
      load "addressable/idna/pure.rb"
    end

    start_at = Time.now.to_f
    report = MemoryProfiler.report do
      30_000.times do
        Addressable::URI.parse(
          "http://google.com/stuff/../?with_lots=of&params=asdff#!stuff"
        ).normalize
      end
    end
    end_at = Time.now.to_f
    print_options = { scale_bytes: true, normalize_paths: true }
    puts "\n\n"

    if ENV["CI"]
      report.pretty_print(**print_options)
    else
      t_allocated = report.scale_bytes(report.total_allocated_memsize)
      t_retained  = report.scale_bytes(report.total_retained_memsize)

      puts "Total allocated: #{t_allocated} (#{report.total_allocated} objects)"
      puts "Total retained:  #{t_retained} (#{report.total_retained} objects)"
      puts "Took #{end_at - start_at} seconds"

      FileUtils.mkdir_p("tmp")
      report.pretty_print(to_file: "tmp/memprof.txt", **print_options)
    end
  end
end
