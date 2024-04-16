#!/usr/bin/env ruby

if RUBY_ENGINE == 'ruby' || RUBY_ENGINE == 'rbx'
  require 'mkmf'
  require 'rbconfig'

  def system_libffi_usable?
    # We need pkg_config or ffi.h
    libffi_ok = pkg_config("libffi") ||
        have_header("ffi.h") ||
        find_header("ffi.h", "/usr/local/include", "/usr/include/ffi",
                    "/Library/Developer/CommandLineTools/SDKs/MacOSX.sdk/usr/include/ffi",
                    "/Applications/Xcode.app/Contents/Developer/Platforms/MacOSX.platform/Developer/SDKs/MacOSX.sdk/usr/include/ffi") ||
        (find_header("ffi.h", `xcrun --sdk macosx --show-sdk-path`.strip + "/usr/include/ffi") rescue false)

    # Ensure we can link to ffi_prep_closure_loc
    libffi_ok &&= have_library("ffi", "ffi_prep_closure_loc", [ "ffi.h" ]) ||
                  have_library("libffi", "ffi_prep_closure_loc", [ "ffi.h" ]) ||
                  have_library("libffi-8", "ffi_prep_closure_loc", [ "ffi.h" ])

    if RbConfig::CONFIG['host_os'] =~ /mswin/
      have_library('libffi_convenience')
      have_library('shlwapi')
    end

    libffi_ok
  end

  dir_config("ffi_c")

  # recent versions of ruby add restrictive ansi and warning flags on a whim - kill them all
  $warnflags = ''
  $CFLAGS.gsub!(/[\s+]-ansi/, '')
  $CFLAGS.gsub!(/[\s+]-std=[^\s]+/, '')
  # solaris 10 needs -c99 for <stdbool.h>
  $CFLAGS << " -g -std=c99" if RbConfig::CONFIG['host_os'] =~ /solaris(!?2\.11)/
  if enable_config("debug")
    $CPPFLAGS += " #{RbConfig::CONFIG["debugflags"]}"
    $LDFLAGS += " #{RbConfig::CONFIG["debugflags"]}"
  end

  # Check whether we use system libffi
  system_libffi = enable_config('system-libffi', :try)

  if system_libffi == :try
    system_libffi = ENV['RUBY_CC_VERSION'].nil? && system_libffi_usable?
  elsif system_libffi
    abort "system libffi is not usable" unless system_libffi_usable?
  end

  if system_libffi
    have_func('ffi_prep_cif_var')
    $defs << "-DHAVE_RAW_API" if have_func("ffi_raw_call") && have_func("ffi_prep_raw_closure")
  else
    $defs << "-DHAVE_FFI_PREP_CIF_VAR"
    $defs << "-DUSE_INTERNAL_LIBFFI"

    # Ensure libffi symbols aren't exported when using static libffi.
    # This is to avoid interference with other gems like fiddle.
    # See https://github.com/ffi/ffi/issues/835
    append_ldflags "-Wl,--exclude-libs,ALL"
  end

  have_func 'rb_gc_mark_movable' # since ruby-2.7

  # Some linux archs need explicit linking to pthread, see https://github.com/ffi/ffi/issues/893
  append_ldflags "-pthread"

  ffi_alloc_default = RbConfig::CONFIG['host_os'] =~ /darwin/i && RbConfig::CONFIG['host'] =~ /arm|aarch64/i
  ffi_alloc_default = ffi_alloc_default || RbConfig::CONFIG['host'] =~ /hppa/i
  if enable_config('libffi-alloc', ffi_alloc_default)
    $defs << "-DUSE_FFI_ALLOC"
  end

  $defs << "-DHAVE_EXTCONF_H" if $defs.empty? # needed so create_header works

  create_header
  create_makefile("ffi_c")

  unless system_libffi
    File.open("Makefile", "a") do |mf|
      if enable_config("debug")
        mf.puts "LIBFFI_DEBUG=--enable-debug CPPFLAGS='#{RbConfig::CONFIG["debugflags"]}' LDFLAGS='#{RbConfig::CONFIG["debugflags"]}'"
      end

      if RbConfig::CONFIG['host_alias'] == "i386-w64-mingw32"
        host = "i686-w64-mingw32" # Work around host name without matching compiler name in rake-compiler-dock-1.3.0 on platform x86-mingw32
      elsif RbConfig::CONFIG.has_key?("host_alias")
        host = RbConfig::CONFIG['host_alias']
      end
      mf.puts "LIBFFI_HOST=--host=#{host}" if host

      if RbConfig::CONFIG['host_os'] =~ /darwin/i
        if RbConfig::CONFIG['host'] =~ /arm|aarch64/i
          mf.puts "LIBFFI_HOST=--host=aarch64-apple-#{RbConfig::CONFIG['host_os']}"
        end
        mf.puts "include ${srcdir}/libffi.darwin.mk"
      elsif RbConfig::CONFIG['host_os'] =~ /bsd/i
        mf.puts '.include "${srcdir}/libffi.bsd.mk"'
      elsif RbConfig::CONFIG['host_os'] =~ /mswin64/i
        mf.puts '!include $(srcdir)/libffi.vc64.mk'
      elsif RbConfig::CONFIG['host_os'] =~ /mswin32/i
        mf.puts '!include $(srcdir)/libffi.vc.mk'
      else
        mf.puts "include ${srcdir}/libffi.mk"
      end
    end
  end

else
  File.open("Makefile", "w") do |mf|
    mf.puts "# Dummy makefile for non-mri rubies"
    mf.puts "all install::\n"
  end
end
