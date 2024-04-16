Pod::Spec.new do |s|
  s.name         = 'Realm'
  s.version      = '0.94'
  s.authors      = 'Realm', { 'Realm' => 'help@realm.io' }
  s.homepage     = 'https://realm.io/'
  s.summary      = 'Realm is a modern data framework & database for iOS & OS X.'
  s.description  = 'The Realm database, for Objective-C. (If you want to use Realm from Swift, see the “RealmSwift” pod.)\n\nRealm is a mobile database: a replacement for Core Data & SQLite. You can use it on iOS & OS X. Realm is not an ORM on top SQLite: instead it uses its own persistence engine, built for simplicity (& speed). Learn more and get help at https://realm.io'
  s.platform     = :watchos

  s.source       = { :git => 'https://github.com/realm/realm-cocoa.git', :tag => 'v0.94.0' }
  s.source_files = 'Realm/*.{m,mm}', 'Realm/ObjectStore/*.cpp'
  s.xcconfig     = { 'CLANG_CXX_LANGUAGE_STANDARD": "compiler-default' => 'OTHER_CPLUSPLUSFLAGS": "-std=c++1y $(inherited)' }
  s.prefix_header_file = 'Classes/Realm.pch'
  s.license      = {
    :type => 'Apache 2.0',
    :file => 'LICENSE'
  }
end
