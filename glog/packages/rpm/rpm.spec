%define	RELEASE	1
%define rel     %{?CUSTOM_RELEASE} %{!?CUSTOM_RELEASE:%RELEASE}
%define	prefix	/usr

Name: %NAME
Summary: A C++ application logging library
Version: %VERSION
Release: %rel
Group: Development/Libraries
URL: http://github.com/google/glog
License: BSD
Vendor: Google
Packager: Google Inc. <opensource@google.com>
Source: https://github.com/google/glog/archive/v%{VERSION}.tar.gz
Distribution: Redhat 7 and above.
Buildroot: %{_tmppath}/%{name}-root
Prefix: %prefix

%description
The %name package contains a library that implements application-level
logging.  This library provides logging APIs based on C++-style
streams and various helper macros.

%package devel
Summary: A C++ application logging library
Group: Development/Libraries
Requires: %{NAME} = %{VERSION}

%description devel
The %name-devel package contains static and debug libraries and header
files for developing applications that use the %name package.

%changelog
    * Wed Mar 26 2008 <opensource@google.com>
    - First draft

%prep
%setup

%build
./configure
make prefix=%prefix

%install
rm -rf $RPM_BUILD_ROOT
make prefix=$RPM_BUILD_ROOT%{prefix} install

%clean
rm -rf $RPM_BUILD_ROOT

%files
%defattr(-,root,root)

## Mark all installed files within /usr/share/doc/{package name} as
## documentation.  This depends on the following two lines appearing in
## Makefile.am:
##     docdir = $(prefix)/share/doc/$(PACKAGE)-$(VERSION)
##     dist_doc_DATA = AUTHORS COPYING ChangeLog INSTALL NEWS README
%docdir %{prefix}/share/doc/%{NAME}-%{VERSION}
%{prefix}/share/doc/%{NAME}-%{VERSION}/*

%{prefix}/lib/libglog.so.0
%{prefix}/lib/libglog.so.0.0.0

%files devel
%defattr(-,root,root)

%{prefix}/include/glog
%{prefix}/lib/libglog.a
%{prefix}/lib/libglog.la
%{prefix}/lib/libglog.so
%{prefix}/lib/pkgconfig/libglog.pc
