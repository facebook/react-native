
Pod::Spec.new do |spec|
  spec.name = 'boost'
  spec.version = '1.63.0'
  spec.license = { :type => 'Boost Software License', :file => "LICENSE_1_0.txt" }
  spec.homepage = 'http://www.boost.org'
  spec.summary = 'Boost provides free peer-reviewed portable C++ source libraries.'
  spec.authors = 'Rene Rivera'
  spec.source = { :http => 'https://github.com/react-native-community/boost-for-react-native/releases/download/v1.63.0-0/boost_1_63_0.tar.gz' }

  # Pinning to the same version as React.podspec.
  spec.platforms = { :ios => "8.0", :tvos => "9.2" }
  spec.requires_arc = false
  spec.xcconfig = {
    :HEADER_SEARCH_PATHS => "\"${PODS_ROOT}/boost\""
  }

  spec.subspec 'string_algorithms-includes' do |cs|
    cs.preserve_paths = [
      "boost/*.h",
      "boost/predef/**/*.h",
      "boost/*.hpp",
      "boost/algorithm/*.hpp",
      "boost/algorithm/**/*.hpp",
      "boost/config/**/*.hpp",
      "boost/core/*.hpp",
      "boost/range/**/*.hpp",
      "boost/bind/**/*.hpp",
      "boost/detail/**/*.hpp",
      "boost/exception/**/*.hpp",
      "boost/function/**/*.hpp",
      "boost/concept/**/*hpp",
      "boost/utility/**/*.hpp",
      "boost/type_traits/**/*.hpp",
      "boost/mpl/**/*.hpp",
      "boost/preprocessor/**/*.hpp",
      "boost/iterator/**/*.hpp"
    ]
  end

  spec.subspec 'shared_ptr-includes' do |cs|
    cs.preserve_paths = [
      "boost/*.h",
      "boost/predef/**/*.h",
      "boost/*.hpp",
      "boost/config/**/*.hpp",
      "boost/core/*.hpp",
      "boost/exception/detail/attribute_noreturn.hpp",
      "boost/exception/exception.hpp",
      "boost/detail/*.hpp",
      "boost/smart_ptr/*.hpp",
      "boost/smart_ptr/**/*.hpp"
    ]
  end

  spec.subspec 'pointer_cast-includes' do |cs|
    cs.preserve_paths = 'boost/pointer_cast.hpp'
  end

  spec.subspec 'numeric-includes' do |cs|
    cs.preserve_paths = 'boost/numeric/**/*.hpp'
  end

  spec.subspec 'preprocessor-includes' do |cs|
    cs.preserve_paths = 'boost/preprocessor/**/*.hpp'
  end

  spec.subspec 'math-includes' do |cs|
    cs.preserve_paths = [
      "boost/*.h",
      "boost/predef/**/*.h",
      "boost/*.hpp",
      "boost/math/**/*.hpp",
      "boost/config/**/*.hpp",
      "boost/detail/*.hpp",
      "boost/utility/*.hpp",
      "boost/mpl/**/*.hpp",
      "boost/type_traits/**/*.hpp",
      "boost/accumulators/**/*.hpp"
    ]
  end

  spec.subspec 'graph-includes' do |cs|
    cs.preserve_paths = [
      "boost/*.h",
      "boost/predef/**/*.h",
      "boost/*.hpp",
      "boost/{algorithm,accumulators,circular_buffer,archive,bimap,bind,chrono,concept,config,container,date_time,detail,dynamic_bitset,exception,filesystem,format,function,functional,fusion,graph,integer,intrusive,io,iterator,math,move,mpi,mpl,multi_index,numeric,optional,parameter,pending,preprocessor,property_map,property_tree,proto,python,random,range,ratio,regex,serialization,smart_ptr,spirit,system,test,thread,tr1,tuple,type_traits,typeof,units,unordered,utility,variant,xpressive}/**/*.hpp",
      "boost/xpressive/**/*.ipp"
    ]
  end
  spec.subspec 'type_index-includes' do |cs|
    cs.preserve_paths = 'boost/type_index/**/*.hpp'
  end

end

    
