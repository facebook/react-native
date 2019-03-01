# vim:ft=python
import os

double_conversion_sources = ['double-conversion/' + x for x in SConscript('double-conversion/SConscript')]
double_conversion_test_sources = ['test/cctest/' + x for x in SConscript('test/cctest/SConscript')]

DESTDIR = ARGUMENTS.get('DESTDIR', '')
prefix = ARGUMENTS.get('prefix', '/usr/local')
lib = ARGUMENTS.get('libsuffix', 'lib')
libdir = os.path.join(DESTDIR + prefix, lib)

env = Environment(CPPPATH='#', LIBS=['m', 'stdc++'],
    CXXFLAGS=ARGUMENTS.get('CXXFLAGS', ''))
debug = ARGUMENTS.get('debug', 0)
optimize = ARGUMENTS.get('optimize', 0)
env.Replace(CXX = ARGUMENTS.get('CXX', 'g++'))

# for shared lib, requires scons 2.3.0
env['SHLIBVERSION'] = '1.0.0'

CCFLAGS = []
if int(debug):
  CCFLAGS.append(ARGUMENTS.get('CXXFLAGS', '-g -Wall -Wshadow -Werror'))
if int(optimize):
  CCFLAGS.append(ARGUMENTS.get('CXXFLAGS', '-O3'))

env.Append(CCFLAGS = " ".join(CCFLAGS))

double_conversion_shared_objects = [
    env.SharedObject(src) for src in double_conversion_sources]
double_conversion_static_objects = [
    env.StaticObject(src) for src in double_conversion_sources]

library_name = 'double-conversion'

static_lib = env.StaticLibrary(library_name, double_conversion_static_objects)
static_lib_pic = env.StaticLibrary(library_name + '_pic', double_conversion_shared_objects)
shared_lib = env.SharedLibrary(library_name, double_conversion_shared_objects)

env.Program('run_tests', double_conversion_test_sources, LIBS=[static_lib])

env.InstallVersionedLib(libdir, shared_lib)
env.Install(libdir, static_lib)
env.Install(libdir, static_lib_pic)

env.Alias('install', libdir)
