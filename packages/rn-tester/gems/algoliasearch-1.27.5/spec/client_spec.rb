# encoding: UTF-8
require File.expand_path(File.join(File.dirname(__FILE__), 'spec_helper'))
require 'base64'

def is_include(array, attr, value)
  array.each do |elt|
    if elt[attr] == value
      return true
    end
  end
  return false
end

describe 'API keys', :maintainers_only => true do
  before(:all) do
    @index = Algolia::Index.new(safe_index_name("àlgol?a"))
    @index.delete_index rescue "not fatal"
  end

  after(:all) do
    @index.delete_index rescue "not fatal"
  end

  def wait_key(index, key, &block)
    1.upto(60) do # do not wait too long
      begin
        k = index.get_api_key(key)
        if block_given?
          return if yield k
          # not found
          sleep 1
          next
        end
        return
      rescue
        # not found
        sleep 1
      end
    end
  end

  def wait_key_missing(index, key)
    1.upto(60) do # do not wait too long
      begin
        k = index.get_api_key(key)
        sleep 1
      rescue
        # not found
        return
      end
    end
  end

  def wait_global_key(key, &block)
    1.upto(60) do # do not wait too long
      begin
        k = Algolia.get_api_key(key)
        if block_given?
          return if yield k
          # not found
          sleep 1
          next
        end
        return
      rescue
        # not found
        sleep 1
      end
    end
  end

  def wait_global_key_missing(key)
    1.upto(60) do # do not wait too long
      begin
        k = Algolia.get_api_key(key)
        sleep 1
      rescue
        # not found
        return
      end
    end
  end

  it "should test index keys" do
    @index.set_settings!({}) # ensure the index exists

    resIndex = @index.list_api_keys
    newIndexKey = @index.add_api_key(['search'])
    newIndexKey['key'].should_not eq("")
    wait_key(@index, newIndexKey['key'])
    resIndexAfter = @index.list_api_keys
    is_include(resIndex['keys'], 'value', newIndexKey['key']).should eq(false)
    is_include(resIndexAfter['keys'], 'value', newIndexKey['key']).should eq(true)
    indexKey = @index.get_api_key(newIndexKey['key'])
    indexKey['acl'][0].should eq('search')
    @index.update_api_key(newIndexKey['key'], ['addObject'])
    wait_key(@index, newIndexKey['key']) do |key|
      key['acl'] == ['addObject']
    end
    indexKey = @index.get_api_key(newIndexKey['key'])
    indexKey['acl'][0].should eq('addObject')
    @index.delete_api_key(newIndexKey['key'])
    wait_key_missing(@index, newIndexKey['key'])
    resIndexEnd = @index.list_api_keys
    is_include(resIndexEnd['keys'], 'value', newIndexKey['key']).should eq(false)
  end

  it "should test global keys" do
    res = Algolia.list_api_keys
    newKey = Algolia.add_api_key(['search'])
    newKey['key'].should_not eq("")
    wait_global_key(newKey['key'])
    resAfter = Algolia.list_api_keys
    is_include(res['keys'], 'value', newKey['key']).should eq(false)
    is_include(resAfter['keys'], 'value', newKey['key']).should eq(true)
    key = Algolia.get_api_key(newKey['key'])
    key['acl'][0].should eq('search')
    Algolia.update_api_key(newKey['key'], ['addObject'])
    wait_global_key(newKey['key']) do |key|
      key['acl'] == ['addObject']
    end
    key = Algolia.get_api_key(newKey['key'])
    key['acl'][0].should eq('addObject')
    Algolia.delete_api_key(newKey['key'])
    wait_global_key_missing(newKey['key'])
    resEnd = Algolia.list_api_keys
    is_include(resEnd['keys'], 'value', newKey['key']).should eq(false)

    # Restore the deleted key
    Algolia.restore_api_key(newKey['key'])
    wait_global_key(newKey['key'])
    key_end = Algolia.list_api_keys
    is_include(key_end['keys'], 'value', newKey['key']).should eq(true)

    # Re-delete the key
    Algolia.delete_api_key(newKey['key'])
  end

  it "Check add keys" do
    newIndexKey = @index.add_api_key(['search'])
    newIndexKey.should have_key('key')
    newIndexKey['key'].should be_a(String)
    newIndexKey.should have_key('createdAt')
    newIndexKey['createdAt'].should be_a(String)
    sleep 5 # no task ID here
    resIndex = @index.list_api_keys
    resIndex.should have_key('keys')
    resIndex['keys'].should be_a(Array)
    resIndex['keys'][0].should have_key('value')
    resIndex['keys'][0]['value'].should be_a(String)
    resIndex['keys'][0].should have_key('acl')
    resIndex['keys'][0]['acl'].should be_a(Array)
    resIndex['keys'][0].should have_key('validity')
    resIndex['keys'][0]['validity'].should be_a(Integer)
    indexKey = @index.get_api_key(newIndexKey['key'])
    indexKey.should have_key('value')
    indexKey['value'].should be_a(String)
    indexKey.should have_key('acl')
    indexKey['acl'].should be_a(Array)
    indexKey.should have_key('validity')
    indexKey['validity'].should be_a(Integer)
    task = @index.delete_api_key(newIndexKey['key'])
    task.should have_key('deletedAt')
    task['deletedAt'].should be_a(String)
  end
end

describe 'Client' do
  before(:all) do
    @index = Algolia::Index.new(safe_index_name("àlgol?a"))
    @index.delete_index rescue "not fatal"
  end

  after(:all) do
    @index.delete_index rescue "not fatal"
  end

  it "should tell if index exists" do
    @index.add_object!({ :name => "John Doe", :email => "john@doe.org" }, "1")
    expect(@index.exists?).to be true
  end

  it "should tell if index does not exist" do
    index = Algolia::Index.new('nonexistent_index')
    expect(index.exists?).to be false
  end

  it "should add a simple object" do
    @index.add_object!({ :name => "John Doe", :email => "john@doe.org" }, "1")
    res = @index.search("john")
    res["hits"].length.should eq(1)
  end

  it "should partial update a simple object" do
    @index.add_object!({ :name => "John Doe", :email => "john@doe.org" }, "1")
    res = @index.search("john")
    res["hits"].length.should eq(1)
    @index.partial_update_object!({ :name => "Robert Doe"}, "1")
    res = @index.search("robert")
    res["hits"].length.should eq(1)
  end

  it "should partial update a simple object, or add it if it doesn't exist" do
    res = @index.search("tonny@parker.org")
    res["hits"].length.should eq(0)
    @index.partial_update_object!({ :email => "tonny@parker.org" }, "1")
    res = @index.search("tonny@parker.org")
    res["hits"].length.should eq(1)
  end

  it "should partial update a simple object, but don't add it if it doesn't exist" do
    @index.partial_update_object!({ :email => "alex@boom.org" }, "51", false)
    res = @index.search("alex@boom.org")
    res["hits"].length.should eq(0)
  end

  it "should partial update a batch of objects, and add them if they don't exist" do
    batch = [
      { :objectID => "1", :email => "john@wanna.org" },
      { :objectID => "2", :email => "robert@wanna.org" }
    ]
    @index.partial_update_objects!(batch)
    res = @index.search("@wanna.org")
    res["hits"].length.should eq(2)
  end

  it "should partial update a batch of objects, but don't add them if they don't exist" do
    create_if_not_exits = false
    batch = [
      { :objectID => "11", :email => "john@be.org" },
      { :objectID => "22", :email => "robert@be.org" }
    ]
    @index.partial_update_objects!(batch, create_if_not_exits)
    res = @index.search("@be.org")
    res["hits"].length.should eq(0)
  end

  it "should add a set of objects" do
    @index.add_objects!([
      { :name => "Another", :email => "another1@example.org" },
      { :name => "Another", :email => "another2@example.org" }
    ])
    res = @index.search("another")
    res["hits"].length.should eq(2)
  end

  it "should partial update a simple object" do
    @index.add_object!({ :name => "John Doe", :email => "john@doe.org" }, "1")
    @index.add_object!({ :name => "John Doe", :email => "john@doe.org" }, "2")
    res = @index.search("john")
    res["hits"].length.should eq(2)
    @index.partial_update_objects!([{ :name => "Robert Doe", :objectID => "1"}, { :name => "Robert Doe", :objectID => "2"}])
    res = @index.search("robert")
    res["hits"].length.should eq(2)
  end

  it "should save a set of objects with their ids" do
    @index.save_object!({ :name => "objectid", :email => "objectid1@example.org", :objectID => 101 })
    res = @index.search("objectid")
    res["hits"].length.should eq(1)
  end

  it "should save a set of objects with their ids" do
    @index.save_objects!([
      { :name => "objectid", :email => "objectid1@example.org", :objectID => 101 },
      { :name => "objectid", :email => "objectid2@example.org", :objectID => 102 }
    ])
    res = @index.search("objectid")
    res["hits"].length.should eq(2)
  end

  it "should replace all objects" do
    @index.save_objects!([{:objectID => '1'}, {:objectID => '2'}])
    @index.replace_all_objects!([{'color' => 'black'}, {:objectID => '4', 'color' => 'green'}])

    res = @index.search('')
    res["hits"].length.should eq(2)
    res = @index.search('black')
    res["hits"][0]['color'].should eq('black')
    @index.get_object('4')['color'].should eq('green')
  end

  it "should throw an exception if invalid argument" do
    expect { @index.add_object!([ {:name => "test"} ]) }.to raise_error(ArgumentError)
    expect { @index.add_objects!([ [ {:name => "test"} ] ]) }.to raise_error(ArgumentError)
    expect { @index.save_object(1) }.to raise_error(ArgumentError)
    expect { @index.save_object("test") }.to raise_error(ArgumentError)
    expect { @index.save_object({ :objectID => 42 }.to_json) }.to raise_error(ArgumentError)
    expect { @index.save_objects([{}, ""]) }.to raise_error(ArgumentError)
    expect { @index.save_objects([1]) }.to raise_error(ArgumentError)
    expect { @index.save_objects!([1]) }.to raise_error(ArgumentError)
    expect { @index.save_object({ :foo => 42 }) }.to raise_error(ArgumentError) # missing objectID
  end

  it "should be thread safe" do
    @index.clear!
    @index.add_object!({ :name => "John Doe", :email => "john@doe.org" })
    @index.add_object!({ :name => "John Doe", :email => "john@doe.org" })

    threads = []
    64.times do
      t = Thread.new do
        10.times do
          res = @index.search("john")
          res["hits"].length.should eq(2)
        end
      end
      threads << t
    end
    threads.each { |t| t.join }
  end

  if !defined?(RUBY_ENGINE) || RUBY_ENGINE != 'jruby'
    it "should be fork safe" do
      8.times do
        Process.fork do
          10.times do
            res = @index.search("john")
            res["hits"].length.should eq(2)
          end
        end
      end
      Process.waitall
    end
  end

  it "should clear the index" do
    @index.clear!
    @index.search("")["hits"].length.should eq(0)
  end

  it "should have another index after" do
    index = Algolia::Index.new(safe_index_name("àlgol?a"))
    begin
      index.delete_index!
    rescue
      # friends_2 does not exist
    end
    res = Algolia.list_indexes
    is_include(res['items'], 'name', safe_index_name('àlgol?a')).should eq(false)
    index.add_object!({ :name => "Robert" })
    resAfter = Algolia.list_indexes
    is_include(resAfter['items'], 'name', safe_index_name('àlgol?a')).should eq(true)
  end

  it "should get a object" do
    @index.clear_index
    @index.add_object!({:firstname => "Robert"})
    @index.add_object!({:firstname => "Robert2"})
    res = @index.search('')
    res["nbHits"].should eq(2)
    object = @index.get_object(res['hits'][0]['objectID'])
    object['firstname'].should eq(res['hits'][0]['firstname'])

    object = @index.get_object(res['hits'][0]['objectID'], 'firstname')
    object['firstname'].should eq(res['hits'][0]['firstname'])

    objects = @index.get_objects([ res['hits'][0]['objectID'], res['hits'][1]['objectID'] ])
    objects.size.should eq(2)
  end

  it "should restrict attributesToRetrieve" do
    @index.clear_index
    @index.add_object({:firstname => "Robert", :lastname => "foo", :objectID => 1})
    @index.add_object!({:firstname => "Robert2", :lastname => "bar", :objectID => 2})
    objects = @index.get_objects([1, 2], ['firstname'])
    objects.size.should eq(2)
    objects[0].should eq({"firstname"=>"Robert", "objectID"=>"1"})
    objects[1].should eq({"firstname"=>"Robert2", "objectID"=>"2"})

    objects = @index.get_objects([1, 2], [:firstname])
    objects.size.should eq(2)
    objects[0].should eq({"firstname"=>"Robert", "objectID"=>"1"})
    objects[1].should eq({"firstname"=>"Robert2", "objectID"=>"2"})

    objects = @index.get_objects(["1", "2"], 'firstname,lastname')
    objects.size.should eq(2)
    objects[0].should eq({"firstname"=>"Robert", "lastname"=>"foo", "objectID"=>"1"})
    objects[1].should eq({"firstname"=>"Robert2", "lastname"=>"bar", "objectID"=>"2"})
  end

  it "should delete the object" do
    @index.clear
    @index.add_object!({:firstname => "Robert"})
    res = @index.search('')
    @index.search('')['nbHits'].should eq(1)
    @index.delete_object!(res['hits'][0]['objectID'])
    @index.search('')['nbHits'].should eq(0)
  end

  it "should not delete the index because the objectID is blank" do
    @index.clear
    @index.add_object!({:firstname => "Robert"})
    res = @index.search('')
    @index.search('')['nbHits'].should eq(1)
    expect { @index.delete_object('') }.to raise_error(ArgumentError)
    expect { @index.delete_object!(nil) }.to raise_error(ArgumentError)
    @index.search('')['nbHits'].should eq(1)
  end

  it "should delete several objects" do
    @index.clear
    @index.add_object!({:firstname => "Robert1"})
    @index.add_object!({:firstname => "Robert2"})
    res = @index.search('')
    @index.search('')['nbHits'].should eq(2)
    @index.delete_objects!(res['hits'].map { |h| h['objectID'] })
    @index.search('')['nbHits'].should eq(0)
  end

  it "should delete several objects by query" do
    @index.clear
    @index.add_object({:firstname => "Robert1"})
    @index.add_object!({:firstname => "Robert2"})
    @index.search('')['nbHits'].should eq(2)
    @index.delete_by_query!('rob')
    @index.search('')['nbHits'].should eq(0)
  end

  it "should not wipe the entire index with delete_by_query" do
    expect { @index.delete_by_query(nil) }.to raise_error(ArgumentError)
  end

  context 'delete_by' do
    it 'should not wipe the entire index' do
      expect { @index.delete_by(nil) }.to raise_error(ArgumentError)
    end

    it 'should fail with query passed' do
      @index.clear
      @index.add_object({:firstname => 'Robert1'})
      @index.add_object!({:firstname => 'Robert2'})
      @index.search('')['nbHits'].should eq(2)
      expect { @index.delete_by({ 'query' => 'abc' }) }.to raise_error(Algolia::AlgoliaProtocolError)
      @index.search('')['nbHits'].should eq(2)
    end

    it 'should work with filters' do
      @index.clear
      @index.set_settings!({:attributesForFaceting => ['firstname']})
      @index.add_object({:firstname => 'Robert1'})
      @index.add_object!({:firstname => 'Robert2'})
      @index.search('')['nbHits'].should eq(2)
      @index.delete_by!({ 'filters' => 'firstname:Robert1' })
      @index.search('')['nbHits'].should eq(1)
    end
  end

  it 'should find objects when needed' do
    index = Algolia::Index.new(safe_index_name("àlgol?à"))

    index.save_objects!([
      {:company => 'Algolia', :name => 'Julien Lemoine', :objectID => 'julien-lemoine'},
      {:company => 'Algolia', :name => 'Nicolas Dessaigne', :objectID => 'nicolas-dessaigne'},
      {:company => 'Amazon', :name =>' "Jeff Bezos', :objectID => '162590850'},
      {:company => 'Apple', :name => 'Steve Jobs', :objectID => '162590860'},
      {:company => 'Apple', :name => 'Steve Wozniak', :objectID => '162590870'},
      {:company => 'Arista Networks', :name => 'Jayshree Ullal', :objectID => '162590880'},
      {:company => 'Google', :name => 'Larry Page', :objectID => '162590890'},
      {:company => 'Google', :name => 'Rob Pike', :objectID => '162590900'},
      {:company => 'Google', :name => 'Sergueï Brin', :objectID => '162590910'},
      {:company => 'Microsoft', :name => 'Bill Gates', :objectID => '162590920'},
      {:company => 'SpaceX', :name => 'Elon Musk', :objectID => '162590930'},
      {:company => 'Tesla', :name => 'Elon Musk', :objectID => '162590940'},
      {:company => 'Yahoo', :name => 'Marissa Mayer', :objectID => '162590950'},
    ])

    res = index.search('algolia')
    Algolia::Index.get_object_position(res, 'nicolas-dessaigne').should eq(0)
    Algolia::Index.get_object_position(res, 'julien-lemoine').should eq(1)
    Algolia::Index.get_object_position(res, '').should eq(-1)

    expect {
      index.find_object({'query' => '', 'paginate' => true})
    }.to raise_exception(
      Algolia::AlgoliaObjectNotFoundError,
      'Object not found'
    )

    expect {
      index.find_object({'query' => '', 'paginate' => true}) { false }
    }.to raise_exception(
      Algolia::AlgoliaObjectNotFoundError,
      'Object not found'
    )

    obj = index.find_object({'query' => '', 'paginate' => true}) { true }
    obj['position'].should eq(0)
    obj['page'].should eq(0)

    # we use a lambda and convert it to a block with `&`
    # so as not to repeat the condition
    condition = lambda do |obj|
      obj.key?('company') and obj['company'] == 'Apple'
    end

    expect {
      index.find_object({'query' => 'algolia', 'paginate' => true}, &condition)
    }.to raise_exception(
      Algolia::AlgoliaObjectNotFoundError,
      'Object not found'
    )

    expect {
      index.find_object({'query' => '', 'paginate' => false, 'hitsPerPage' => 5}, &condition)
    }.to raise_exception(
      Algolia::AlgoliaObjectNotFoundError,
      'Object not found'
    )

    obj = index.find_object({'query' => '', 'paginate' => true, 'hitsPerPage' => 5}, &condition)
    obj['position'].should eq(0)
    obj['page'].should eq(2)
  end

  it "should copy the index" do
    index = Algolia::Index.new(safe_index_name("àlgol?à"))
    begin
      @index.clear_index
      Algolia.delete_index index.name
    rescue
      # friends_2 does not exist
    end

    @index.add_object!({:firstname => "Robert"})
    @index.search('')['nbHits'].should eq(1)

    Algolia.copy_index!(safe_index_name("àlgol?a"), safe_index_name("àlgol?à"))
    @index.delete_index!

    index.search('')['nbHits'].should eq(1)
    index.delete_index!
  end

  it "should copy only settings" do
    index = Algolia::Index.new(safe_index_name("àlgol?à"))
    begin
      @index.clear_index
      Algolia.delete_index index.name
    rescue
    end

    res = @index.set_settings!({
                                   'searchableAttributes' => ['one'],
                               })

    @index.wait_task(res['taskID'])
    Algolia.copy_settings!(@index.name, index.name)
    @index.delete_index!

    index.get_settings['searchableAttributes'].should eq(['one'])
    index.delete_index!
  end

  it "should copy only synonyms" do
    index = Algolia::Index.new(safe_index_name("àlgol?à"))
    begin
      @index.clear_index
      Algolia.delete_index index.name
    rescue
    end

    @index.save_synonym!('foo', {
        :objectID => 'foo', :synonyms => ['car', 'vehicle', 'auto'], :type => 'synonym',
    })

    Algolia.copy_synonyms!(@index.name, index.name)
    @index.delete_index!

    index.get_synonym('foo')['objectID'].should eq('foo')
    index.delete_index!
  end

  it "should copy only rules" do
    index = Algolia::Index.new(safe_index_name("àlgol?à"))
    begin
      @index.clear_index
      Algolia.delete_index index.name
    rescue
    end

    @index.save_rule!('bar', {
        :objectID => 'bar',
        :condition => {:pattern => 'test', :anchoring => 'contains'},
        :consequence => {:params => {:query => 'this is better'}}
    })

    Algolia.copy_rules!(@index.name, index.name)
    @index.delete_index!

    index.get_rule('bar')['objectID'].should eq('bar')
    index.delete_index!
  end

  it "should copy parts of the index only" do
    index = Algolia::Index.new(safe_index_name("àlgol?à"))
    begin
      @index.clear_index
      Algolia.delete_index! index.name
    rescue
      # friends_2 does not exist
    end

    @index.add_object!({:firstname => "Robert"})
    @index.batch_synonyms! [
      { :objectID => 'city', :type => 'synonym', :synonyms => ['San Francisco', 'SF'] },
      { :objectID => 'street', :type => 'altCorrection1', :word => 'street', :corrections => ['st'] }
    ]
    @index.search('')['nbHits'].should eq(1)
    @index.search_synonyms('')['nbHits'].should eq(2)

    res = Algolia.copy_index!(safe_index_name("àlgol?a"), safe_index_name("àlgol?à"), ["synonyms"])

    @index.delete_index!

    index.search_synonyms('')['nbHits'].should eq(2)
    index.delete_index!
  end

  it "should move the index" do
    @index.clear_index rescue "friends does not exist"
    index = Algolia::Index.new(safe_index_name("àlgol?à"))
    begin
      Algolia.delete_index! index.name
    rescue
      # friends_2 does not exist
    end

    @index.add_object!({:firstname => "Robert"})
    @index.search('')['nbHits'].should eq(1)

    Algolia.move_index!(safe_index_name("àlgol?a"), safe_index_name("àlgol?à"))

    index.search('')['nbHits'].should eq(1)
    index.delete_index
  end

  it "should retrieve the object" do
    @index.clear_index rescue "friends does not exist"
    @index.add_object!({:firstname => "Robert"})

    res = @index.browse

    res['hits'].size.should eq(1)
    res['hits'][0]['firstname'].should eq("Robert")
  end

  it "should get logs" do

    expect {
      Algolia::Index.new(safe_index_name('thisdefinitelyshouldntexist')).get_settings
    }.to raise_error(Algolia::AlgoliaProtocolError)
    res = Algolia.get_logs(0, 20, true)

    res['logs'].size.should > 0
    (res['logs'][0]['answer_code'].to_i / 100).should eq(4)
  end

  it "should search on multipleIndex" do
    @index.clear_index! rescue "Not fatal"
    @index.add_object!({ :name => "John Doe", :email => "john@doe.org" }, "1")
    res = Algolia.multiple_queries([{:index_name => safe_index_name("àlgol?a"), "query" => ""}])
    res["results"][0]["hits"].length.should eq(1)

    res = Algolia.multiple_queries([{"indexName" => safe_index_name("àlgol?a"), "query" => ""}], "indexName")
    res["results"][0]["hits"].length.should eq(1)
  end

  it "should get multiple objectIDs" do
    index_name_1 = safe_index_name("àlgol?a-multi")
    index_1 = Algolia::Index.new(index_name_1)
    index_1.save_object!({:objectID => "obj1-multi-get", :name => 'test'})

    index_name_2 = safe_index_name("àlgol?a-multi")
    index_2 = Algolia::Index.new(index_name_2)
    index_2.save_object!({:objectID => "obj2-multi-get", :name => 'another index'})

    requests = [
        { "indexName" => index_name_1, "objectID" => "obj1-multi-get" },
        { "indexName" => index_name_2, "objectID" => "obj2-multi-get" }
    ]

    response = Algolia.multiple_get_objects(requests)

    response['results'].count.should eq(2)

    index_1.delete_index rescue "not fatal"
    index_2.delete_index rescue "not fatal"
  end

  it "should throw if the index_name is missing in multiple_queries" do
    expect { Algolia.multiple_queries([{"query" => ""}]) }.to raise_error(ArgumentError)
  end

  it "should accept custom batch" do
    @index.clear_index! rescue "Not fatal"
    request = { "requests" => [
      {
        "action" => "addObject",
        "body" => {"firstname" => "Jimmie",
        "lastname" => "Barninger"}
      },
      {
        "action" => "addObject",
        "body" => {"firstname" => "Warren",
        "lastname" => "Speach"}
      },
      {
        "action" => "updateObject",
        "body" => {"firstname" => "Jimmie",
        "lastname" => "Barninger",
        "objectID" => "43"}
      },
      {
        "action" => "updateObject",
        "body" => {"firstname" => "Warren",
        "lastname" => "Speach"},
        "objectID" => "42"
      }
      ]}
    res = @index.batch!(request)
    @index.search('')['nbHits'].should eq(4)
  end

  it "should allow an array of tags" do
    @index.add_object!({ :name => "P1", :_tags => "t1" })
    @index.add_object!({ :name => "P2", :_tags => "t1" })
    @index.add_object!({ :name => "P3", :_tags => "t2" })
    @index.add_object!({ :name => "P4", :_tags => "t3" })
    @index.add_object!({ :name => "P5", :_tags => ["t3", "t4"] })

    @index.search("", { :tagFilters => ["t1"] })['hits'].length.should eq(2)         # t1
    @index.search("", { :tagFilters => ["t1", "t2"] })['hits'].length.should eq(0)   # t1 AND t2
    @index.search("", { :tagFilters => ["t3", "t4"] })['hits'].length.should eq(1)   # t3 AND t4
    @index.search("", { :tagFilters => [["t1", "t2"]] })['hits'].length.should eq(3) # t1 OR t2
  end

  it "should be facetable" do
    @index.clear!
    @index.set_settings( { :attributesForFacetting => ["f", "g"] })
    @index.add_object!({ :name => "P1", :f => "f1", :g => "g1" })
    @index.add_object!({ :name => "P2", :f => "f1", :g => "g2" })
    @index.add_object!({ :name => "P3", :f => "f2", :g => "g2" })
    @index.add_object!({ :name => "P4", :f => "f3", :g => "g2" })

    res = @index.search("", { :facets => "f" })
    res['facets']['f']['f1'].should eq(2)
    res['facets']['f']['f2'].should eq(1)
    res['facets']['f']['f3'].should eq(1)

    res = @index.search("", { :facets => "f", :facetFilters => ["f:f1"] })
    res['facets']['f']['f1'].should eq(2)
    res['facets']['f']['f2'].should be_nil
    res['facets']['f']['f3'].should be_nil

    res = @index.search("", { :facets => "f", :facetFilters => ["f:f1", "g:g2"] })
    res['facets']['f']['f1'].should eq(1)
    res['facets']['f']['f2'].should be_nil
    res['facets']['f']['f3'].should be_nil

    res = @index.search("", { :facets => "f,g", :facetFilters => [["f:f1", "g:g2"]] })
    res['nbHits'].should eq(4)
    res['facets']['f']['f1'].should eq(2)
    res['facets']['f']['f2'].should eq(1)
    res['facets']['f']['f3'].should eq(1)

    res = @index.search("", { :facets => "f,g", :facetFilters => [["f:f1", "g:g2"], "g:g1"] })
    res['nbHits'].should eq(1)
    res['facets']['f']['f1'].should eq(1)
    res['facets']['f']['f2'].should be_nil
    res['facets']['f']['f3'].should be_nil
    res['facets']['g']['g1'].should eq(1)
    res['facets']['g']['g2'].should be_nil
  end

  it "should handle slash in objectId" do
    @index.clear_index!()
    @index.add_object!({:firstname => "Robert", :objectID => "A/go/?a"})
    res = @index.search('')
    @index.search("")["nbHits"].should eq(1)
    object = @index.get_object(res['hits'][0]['objectID'])
    object['firstname'].should eq('Robert')
    object = @index.get_object(res['hits'][0]['objectID'], 'firstname')
    object['firstname'].should eq('Robert')

    @index.save_object!({:firstname => "George", :objectID => "A/go/?a"})
    res = @index.search('')
    @index.search("")["nbHits"].should eq(1)
    object = @index.get_object(res['hits'][0]['objectID'])
    object['firstname'].should eq('George')

    @index.partial_update_object!({:firstname => "Sylvain", :objectID => "A/go/?a"})
    res = @index.search('')
    @index.search("")["nbHits"].should eq(1)
    object = @index.get_object(res['hits'][0]['objectID'])
    object['firstname'].should eq('Sylvain')

  end

  it "Check attributes list_indexes:" do
    res = Algolia::Index.all
    res.should have_key('items')
    res['items'][0].should have_key('name')
    res['items'][0]['name'].should be_a(String)
    res['items'][0].should have_key('createdAt')
    res['items'][0]['createdAt'].should be_a(String)
    res['items'][0].should have_key('updatedAt')
    res['items'][0]['updatedAt'].should be_a(String)
    res['items'][0].should have_key('entries')
    res['items'][0]['entries'].should be_a(Integer)
    res['items'][0].should have_key('pendingTask')
    [true, false].should include(res['items'][0]['pendingTask'])
  end

  it 'Check attributes search : ' do
    res = @index.search('')
    res.should have_key('hits')
    res['hits'].should be_a(Array)
    res.should have_key('page')
    res['page'].should be_a(Integer)
    res.should have_key('nbHits')
    res['nbHits'].should be_a(Integer)
    res.should have_key('nbPages')
    res['nbPages'].should be_a(Integer)
    res.should have_key('hitsPerPage')
    res['hitsPerPage'].should be_a(Integer)
    res.should have_key('processingTimeMS')
    res['processingTimeMS'].should be_a(Integer)
    res.should have_key('query')
    res['query'].should be_a(String)
    res.should have_key('params')
    res['params'].should be_a(String)
  end

  it 'Check attributes delete_index : ' do
    index = Algolia::Index.new(safe_index_name("àlgol?à2"))
    index.add_object!({ :name => "John Doe", :email => "john@doe.org" }, "1")
    task = index.delete_index()
    task.should have_key('deletedAt')
    task['deletedAt'].should be_a(String)
    task.should have_key('taskID')
    task['taskID'].should be_a(Integer)
  end

  it 'Check attributes clear_index : ' do
    task = @index.clear_index
    task.should have_key('updatedAt')
    task['updatedAt'].should be_a(String)
    task.should have_key('taskID')
    task['taskID'].should be_a(Integer)
  end

  it 'Check attributes add object : ' do
    task = @index.add_object({ :name => "John Doe", :email => "john@doe.org" })
    task.should have_key('createdAt')
    task['createdAt'].should be_a(String)
    task.should have_key('taskID')
    task['taskID'].should be_a(Integer)
    task.should have_key('objectID')
    task['objectID'].should be_a(String)
  end

  it 'Check attributes add object id: ' do
    task = @index.add_object({ :name => "John Doe", :email => "john@doe.org" }, "1")
    task.should have_key('updatedAt')
    task['updatedAt'].should be_a(String)
    task.should have_key('taskID')
    task['taskID'].should be_a(Integer)
    #task.to_s.should eq("")
    task.should have_key('objectID')
    task['objectID'].should be_a(String)
    task['objectID'].should eq("1")
  end

  it 'Check attributes partial update: ' do
    task = @index.partial_update_object({ :name => "John Doe", :email => "john@doe.org" }, "1")
    task.should have_key('updatedAt')
    task['updatedAt'].should be_a(String)
    task.should have_key('taskID')
    task['taskID'].should be_a(Integer)
    task.should have_key('objectID')
    task['objectID'].should be_a(String)
    task['objectID'].should eq("1")
  end

  it 'Check attributes delete object: ' do
    @index.add_object({ :name => "John Doe", :email => "john@doe.org" }, "1")
    task = @index.delete_object("1")
    task.should have_key('deletedAt')
    task['deletedAt'].should be_a(String)
    task.should have_key('taskID')
    task['taskID'].should be_a(Integer)
  end

  it 'Check attributes add objects: ' do
    task = @index.add_objects([{ :name => "John Doe", :email => "john@doe.org", :objectID => "1" }])
    task.should have_key('taskID')
    task['taskID'].should be_a(Integer)
    task.should have_key('objectIDs')
    task['objectIDs'].should be_a(Array)
  end

  it 'Check attributes browse: ' do
    res = @index.browse()
    res.should have_key('hits')
    res['hits'].should be_a(Array)
    res.should have_key('page')
    res['page'].should be_a(Integer)
    res.should have_key('nbHits')
    res['nbHits'].should be_a(Integer)
    res.should have_key('nbPages')
    res['nbPages'].should be_a(Integer)
    res.should have_key('hitsPerPage')
    res['hitsPerPage'].should be_a(Integer)
    res.should have_key('processingTimeMS')
    res['processingTimeMS'].should be_a(Integer)
    res.should have_key('query')
    res['query'].should be_a(String)
    res.should have_key('params')
    res['params'].should be_a(String)
  end

  it 'Check attributes get settings: ' do
    task = @index.set_settings({})
    task.should have_key('taskID')
    task['taskID'].should be_a(Integer)
    task.should have_key('updatedAt')
    task['updatedAt'].should be_a(String)
  end

  it 'Check attributes move_index : ' do
    index = Algolia::Index.new(safe_index_name("àlgol?à"))
    index2 = Algolia::Index.new(safe_index_name("àlgol?à2"))
    index2.add_object!({ :name => "John Doe", :email => "john@doe.org" }, "1")
    task = Algolia.move_index!(safe_index_name("àlgol?à2"), safe_index_name("àlgol?à"))
    task.should have_key('updatedAt')
    task['updatedAt'].should be_a(String)
    task.should have_key('taskID')
    task['taskID'].should be_a(Integer)
    index.delete_index
  end

  it 'Check attributes copy_index : ' do
    index = Algolia::Index.new(safe_index_name("àlgol?à"))
    index2 = Algolia::Index.new(safe_index_name("àlgol?à2"))
    index2.add_object!({ :name => "John Doe", :email => "john@doe.org" }, "1")
    task = Algolia.copy_index!(safe_index_name("àlgol?à2"), safe_index_name("àlgol?à"))
    task.should have_key('updatedAt')
    task['updatedAt'].should be_a(String)
    task.should have_key('taskID')
    task['taskID'].should be_a(Integer)
    index.delete_index
    index2.delete_index
  end

  it 'Check attributes wait_task : ' do
    task = @index.add_object!({ :name => "John Doe", :email => "john@doe.org" }, "1")
    task = Algolia.client.get(Algolia::Protocol.task_uri(safe_index_name("àlgol?a"), task['objectID']))
    task.should have_key('status')
    task['status'].should be_a(String)
    task.should have_key('pendingTask')
    [true, false].should include(task['pendingTask'])
  end

  it 'Check attributes get_task_status' do
    task = @index.add_object!({ :name => "John Doe", :email => "john@doe.org" }, "1")
    status = @index.get_task_status(task["taskID"])
    status.should be_a(String)
  end

  it 'Check attributes log : ' do
    logs = Algolia.get_logs()
    logs.should have_key('logs')
    logs['logs'].should be_a(Array)
    logs['logs'][0].should have_key('timestamp')
    logs['logs'][0]['timestamp'].should be_a(String)
    logs['logs'][0].should have_key('method')
    logs['logs'][0]['method'].should be_a(String)
    logs['logs'][0].should have_key('answer_code')
    logs['logs'][0]['answer_code'].should be_a(String)
    logs['logs'][0].should have_key('query_body')
    logs['logs'][0]['query_body'].should be_a(String)
    logs['logs'][0].should have_key('answer')
    logs['logs'][0]['answer'].should be_a(String)
    logs['logs'][0].should have_key('url')
    logs['logs'][0]['url'].should be_a(String)
    logs['logs'][0].should have_key('ip')
    logs['logs'][0]['ip'].should be_a(String)
    logs['logs'][0].should have_key('query_headers')
    logs['logs'][0]['query_headers'].should be_a(String)
    logs['logs'][0].should have_key('sha1')
    logs['logs'][0]['sha1'].should be_a(String)
  end

  it 'should generate secured api keys (old syntax)' do
    key = Algolia.generate_secured_api_key('my_api_key', '(public,user1)')
    key.should eq(OpenSSL::HMAC.hexdigest(OpenSSL::Digest.new('sha256'), 'my_api_key', '(public,user1)'))
    key = Algolia.generate_secured_api_key('my_api_key', '(public,user1)', 42)
    key.should eq(OpenSSL::HMAC.hexdigest(OpenSSL::Digest.new('sha256'), 'my_api_key', '(public,user1)42'))
    key = Algolia.generate_secured_api_key('my_api_key', ['public'])
    key.should eq(OpenSSL::HMAC.hexdigest(OpenSSL::Digest.new('sha256'), 'my_api_key', 'public'))
    key = Algolia.generate_secured_api_key('my_api_key', ['public', ['premium','vip']])
    key.should eq(OpenSSL::HMAC.hexdigest(OpenSSL::Digest.new('sha256'), 'my_api_key', 'public,(premium,vip)'))
  end

  it 'should generate secured api keys (new syntax)' do
    key = Algolia.generate_secured_api_key('my_api_key', :tagFilters => '(public,user1)')
    key.should eq(Base64.encode64("#{OpenSSL::HMAC.hexdigest(OpenSSL::Digest.new('sha256'), 'my_api_key', 'tagFilters=%28public%2Cuser1%29')}tagFilters=%28public%2Cuser1%29").gsub("\n", ''))
    key = Algolia.generate_secured_api_key('182634d8894831d5dbce3b3185c50881', :tagFilters => '(public,user1)', :userToken => 42)
    # in ruby 1.8.7, the map iteration doesn't have the same ordering,
    # making the hash slightly different
    expected_keys = [
      'ZDU0N2YzZjA3NGZkZGM2OTUxNzY3NzhkZDI3YWFkMjhhNzU5OTBiOGIyYTgyYzFmMjFjZTY4NTA0ODNiN2I1ZnVzZXJUb2tlbj00MiZ0YWdGaWx0ZXJzPSUyOHB1YmxpYyUyQ3VzZXIxJTI5',
      'OGYwN2NlNTdlOGM2ZmM4MjA5NGM0ZmYwNTk3MDBkNzMzZjQ0MDI3MWZjNTNjM2Y3YTAzMWM4NTBkMzRiNTM5YnRhZ0ZpbHRlcnM9JTI4cHVibGljJTJDdXNlcjElMjkmdXNlclRva2VuPTQy'
    ]
    expected_keys.include?(key).should eq(true)
  end

  it 'Check attributes multipleQueries' do
    res = Algolia.multiple_queries([{:index_name => safe_index_name("àlgol?a"), "query" => ""}])
    res.should have_key('results')
    res['results'].should be_a(Array)
    res['results'][0].should have_key('hits')
    res['results'][0]['hits'].should be_a(Array)
    res['results'][0].should have_key('page')
    res['results'][0]['page'].should be_a(Integer)
    res['results'][0].should have_key('nbHits')
    res['results'][0]['nbHits'].should be_a(Integer)
    res['results'][0].should have_key('nbPages')
    res['results'][0]['nbPages'].should be_a(Integer)
    res['results'][0].should have_key('hitsPerPage')
    res['results'][0]['hitsPerPage'].should be_a(Integer)
    res['results'][0].should have_key('processingTimeMS')
    res['results'][0]['processingTimeMS'].should be_a(Integer)
    res['results'][0].should have_key('query')
    res['results'][0]['query'].should be_a(String)
    res['results'][0].should have_key('params')
    res['results'][0]['params'].should be_a(String)
  end

  it 'should handle facet search' do
    objects = {
      :snoopy => {
        :objectID => '1',
        'name' => 'Snoopy',
        :kind => ['dog', 'animal'],
        :born => 1950,
        :series => 'Peanuts'
      },
      :woodstock => {
        :objectID => '2',
        :name => 'Woodstock',
        :kind => ['bird', 'animal'],
        :born => 1960,
        :series => 'Peanuts'
      },
      :charlie => {
        :objectID => '3',
        :name => 'Charlie Brown',
        :kind => ['human'],
        :born => 1950,
        :series => 'Peanuts'
      },
      :hobbes => {
        :objectID => '4',
        :name => 'Hobbes',
        :kind => ['tiger', 'animal', 'teddy'],
        :born => 1985,
        :series => 'Calvin & Hobbes'
      },
      :calvin => {
        :objectID => '5',
        :name => 'Calvin',
        :kind => ['human'],
        :born => 1985,
        :series => 'Calvin & Hobbes'
      }
    }

    index = Algolia::Index.new(safe_index_name('test_facet_search'))
    index.set_settings({
      :attributesForFaceting => [
        'searchable(series)',
        'kind'
      ]
    })
    index.add_objects! objects.values

    query = {
      :facetFilters => ['kind:animal'],
      :numericFilters => ['born >= 1955']
    }
    answer = index.search_for_facet_values 'series', 'Peanutz', query
    expect(answer['facetHits'].size).to eq(1)
    expect(answer['facetHits'].first['value']).to eq('Peanuts')
    expect(answer['facetHits'].first['count']).to eq(1)
  end

  it 'should handle disjunctive faceting' do
    index = Algolia::Index.new(safe_index_name("test_hotels"))
    index.set_settings :attributesForFacetting => ['city', 'stars', 'facilities']
    index.clear_index rescue nil
    index.add_objects! [
      { :name => 'Hotel A', :stars => '*', :facilities => ['wifi', 'bath', 'spa'], :city => 'Paris' },
      { :name => 'Hotel B', :stars => '*', :facilities => ['wifi'], :city => 'Paris' },
      { :name => 'Hotel C', :stars => '**', :facilities => ['bath'], :city => 'San Francisco' },
      { :name => 'Hotel D', :stars => '****', :facilities => ['spa'], :city => 'Paris' },
      { :name => 'Hotel E', :stars => '****', :facilities => ['spa'], :city => 'New York' },
    ]

    answer = index.search_disjunctive_faceting('h', ['stars', 'facilities'], { :facets => 'city' })
    answer['nbHits'].should eq(5)
    answer['facets'].size.should eq(1)
    answer['disjunctiveFacets'].size.should eq(2)

    answer = index.search_disjunctive_faceting('h', ['stars', 'facilities'], { :facets => 'city' }, { :stars => ['*'] })
    answer['nbHits'].should eq(2)
    answer['facets'].size.should eq(1)
    answer['disjunctiveFacets'].size.should eq(2)
    answer['disjunctiveFacets']['stars']['*'].should eq(2)
    answer['disjunctiveFacets']['stars']['**'].should eq(1)
    answer['disjunctiveFacets']['stars']['****'].should eq(2)

    answer = index.search_disjunctive_faceting('h', ['stars', 'facilities'], { :facets => 'city' }, { :stars => ['*'], :city => ['Paris'] })
    answer['nbHits'].should eq(2)
    answer['facets'].size.should eq(1)
    answer['disjunctiveFacets'].size.should eq(2)
    answer['disjunctiveFacets']['stars']['*'].should eq(2)
    answer['disjunctiveFacets']['stars']['****'].should eq(1)

    answer = index.search_disjunctive_faceting('h', ['stars', 'facilities'], { :facets => 'city' }, { :stars => ['*', '****'], :city => ['Paris'] })
    answer['nbHits'].should eq(3)
    answer['facets'].size.should eq(1)
    answer['disjunctiveFacets'].size.should eq(2)
    answer['disjunctiveFacets']['stars']['*'].should eq(2)
    answer['disjunctiveFacets']['stars']['****'].should eq(1)
  end

  it 'should apply jobs one after another if synchronous' do
    index = Algolia::Index.new(safe_index_name("sync"))
    begin
      index.add_object! :objectID => 1
      answer = index.search('')
      answer['nbHits'].should eq(1)
      answer['hits'][0]['objectID'].to_i.should eq(1)
      index.clear_index!
      index.add_object! :objectID => 2
      index.add_object! :objectID => 3
      answer = index.search('')
      answer['nbHits'].should eq(2)
      answer['hits'][0]['objectID'].to_i.should_not eq(1)
    ensure
      index.delete_index
    end
  end

  it "should send a custom batch" do
    batch = [
      {:action => "addObject", :indexName => @index.name, :body => { :objectID => "11", :email => "john@be.org" }},
      {:action => "addObject", :indexName => @index.name, :body => { :objectID => "22", :email => "robert@be.org" }}
    ]
    Algolia.batch!(batch)
    res = @index.search("@be.org")
    res["hits"].length.should eq(2)
  end

  def test_browse(expected, *args)
    @index.clear
    @index.add_objects!(1.upto(1500).map { |i| { :objectID => i, :i => i } })
    hits = {}
    @index.browse(*args) do |hit|
      hits[hit['objectID']] = true
    end
    hits.size.should eq(expected)
  end

  it "should browse the index using cursors" do
    test_browse(1500)
    test_browse(500, 1, 1000)
    test_browse(0, 2, 1000)
  end

  it "should browse the index using cursors specifying hitsPerPage" do
    test_browse(1500, { :hitsPerPage => 500 })
  end

  it "should browse the index using cursors specifying params" do
    test_browse(1, { :hitsPerPage => 500, :numericFilters => 'i=42' })
    test_browse(42, { :numericFilters => 'i<=42' })
  end

  it "should browse the index using cursors from a cursor" do
    @index.clear
    @index.add_objects!(1.upto(1500).map { |i| { :objectID => i, :i => i } })
    answer = @index.browse(0, 1000)

    hits = {}
    @index.browse(:cursor => answer['cursor']) do |hit, cursor|
      hits[hit['objectID']] = true
      cursor.should eq(answer['cursor'])
    end
    hits.size.should eq(500)

    @index.browse_from(answer['cursor'])['hits'].size.should eq(500)
  end

  it "should test synonyms" do
    @index.add_object! :name => '589 Howard St., San Francisco'
    @index.search('Howard St San Francisco')['nbHits'].should eq(1)
    @index.batch_synonyms! [
      { :objectID => 'city', :type => 'synonym', :synonyms => ['San Francisco', 'SF'] },
      { :objectID => 'street', :type => 'altCorrection1', :word => 'street', :corrections => ['st'] }
    ]
    synonyms_search = @index.search_synonyms('')['hits']
    synonyms_search.size.should eq(2)
    @index.search('Howard St SF')['nbHits'].should eq(1)

    synonym = @index.get_synonym('city')
    synonym['objectID'].should eq('city')
    synonym['type'].should eq('synonym')

    @index.search('Howard Street')['nbHits'].should eq(1)

    synonyms_block = []
    synonyms_ret = @index.export_synonyms(1) do |s|
      synonyms_block << s
    end

    s0 = synonyms_search.map { |s| s['objectID'] }.sort
    s1 = synonyms_block.map { |s| s['objectID'] }.sort
    s2 = synonyms_ret.map { |s| s['objectID'] }.sort

    s0.should eq(s1)
    s1.should eq(s2)

    @index.delete_synonym! 'city'
    @index.search('Howard Street SF')['nbHits'].should eq(0)

    @index.clear_synonyms!
    @index.search_synonyms('')['nbHits'].should eq(0)
  end

  it "should replace all synonyms" do
    @index.batch_synonyms! ([
        {:objectID => '1', :type => 'synonym', :synonyms => ['San Francisco', 'SF']},
        {:objectID => '2', :type => 'altCorrection1', :word => 'foo', :corrections => ['st']}
    ])

    @index.replace_all_synonyms! ([
        {:objectID => '3', :type => 'synonym', :synonyms => ['San Francisco', 'SF']},
        {:objectID => '4', :type => 'altCorrection1', :word => 'bar', :corrections => ['st']}
    ])

    synonym = @index.get_synonym('4')['objectID'].should eq('4')
    synonyms_search = @index.search_synonyms('')['hits']
    synonyms_search.size.should eq(2)
  end

  it 'should test synonyms Export Query' do
    @index.batch_synonyms! [
      { :objectID => 'city', :type => 'synonym', :synonyms => ['San Francisco', 'SF'] },
      { :objectID => 'us', :type => 'synonym', :synonyms => ['US', 'USA', 'Untied States of America'] },
      { :objectID => 'ie', :type => 'synonym', :synonyms => ['IE', 'IRL', 'Ireland'] },
      { :objectID => 'street', :type => 'altCorrection1', :word => 'street', :corrections => ['st'] }
    ]

    expect(@index).to receive(:search_synonyms).and_call_original.at_least(4)
    @index.export_synonyms(1)

    @index.clear_synonyms!
  end

  it 'should test Query Rules' do
    rule_1 = {
      :objectID => '42',
      :condition => { :pattern => 'test', :anchoring => 'contains' },
      :consequence => { :params => { :query => 'this is better' } }
    }
    rule_2 = {
      :objectID => '2',
      :condition => { :pattern => 'Pura', :anchoring => 'contains' },
      :consequence => { :params => { :query => 'Pura Vida' } }
    }

    result = @index.save_rule!(rule_1[:objectID], rule_1)
    result.should have_key('taskID')
    result.should have_key('updatedAt')

    @index.get_rule(rule_1[:objectID])['objectID'].should eq(rule_1[:objectID])

    @index.search_rules('better')['nbHits'].should eq(1)
    @index.search_rules('', { :anchoring => 'contains' })['nbHits'].should eq(1)

    @index.delete_rule!(rule_1[:objectID])
    @index.search_rules('')['nbHits'].should eq(0)

    @index.batch_rules!([rule_1, rule_2])
    rules_search = @index.search_rules('')['hits']
    rules_search.size.should eq(2)

    rules_block = []
    rules_ret = @index.export_rules(1) do |r|
      rules_block << r
    end

    r0 = rules_search.map { |r| r['objectID'] }.sort
    r1 = rules_block.map { |r| r['objectID'] }.sort
    r2 = rules_ret.map { |r| r['objectID'] }.sort

    r0.should eq(r1)
    r1.should eq(r2)

    @index.clear_rules!
    @index.search_rules('')['nbHits'].should eq(0)
  end

  it "should replace all rules" do
    rule_1 = {
        :objectID => '1',
        :condition => {:pattern => 'test', :anchoring => 'contains'},
        :consequence => {:params => {:query => 'this is better'}}
    }
    rule_2 = {
        :objectID => '2',
        :condition => {:pattern => 'Pura', :anchoring => 'contains'},
        :consequence => {:params => {:query => 'Pura Vida'}}
    }

    @index.batch_rules! [rule_1, rule_2]

    rule_1[:objectID] = '3'
    rule_2[:objectID] = '4'
    @index.replace_all_rules!([rule_1, rule_2])

    @index.get_rule('4')['objectID'].should eq('4')
    rules_search = @index.search_rules('')['hits']
    rules_search.size.should eq(2)
  end

  it 'should not save a query rule with an empty objectID' do
    rule = {
      :objectID => '',
      :condition => { :pattern => 'test', :anchoring => 'contains' },
      :consequence => { :params => { :query => 'this is better' } }
    }

    expect { @index.save_rule!(nil, rule) }.to raise_error(ArgumentError)
    expect { @index.save_rule!(rule[:objectID], rule) }.to raise_error(ArgumentError)
  end

  it "should use request options" do
    expect{Algolia.list_indexes}.to_not raise_error

    expect{Algolia.list_indexes('headers' => { 'X-Algolia-API-Key' => 'NotExistentAPIKey' })}.to raise_error(Algolia::AlgoliaProtocolError)
  end

  it 'should retrieve the remaining validity time in seconds' do
    now = Time.now.to_i

    key = Algolia.generate_secured_api_key('foo', :validUntil => now - (10 * 60))
    expect(Algolia.get_secured_api_key_remaining_validity(key)).to be < 0

    key = Algolia.generate_secured_api_key('foo', :validUntil => now + (10 * 60))
    expect(Algolia.get_secured_api_key_remaining_validity(key)).to be > 0

    key = Algolia.generate_secured_api_key('foo', [])
    expect { Algolia.get_secured_api_key_remaining_validity(key) }.to raise_error(Algolia::ValidUntilNotFoundError)
  end

  context 'DNS timeout' do
    before(:each) do
      @client = Algolia::Client.new :application_id => ENV['ALGOLIA_APPLICATION_ID'], :api_key => ENV['ALGOLIA_API_KEY'],
        :hosts => [
          "10.0.0.1", # this will timeout
          "#{ENV['ALGOLIA_APPLICATION_ID']}.algolia.net",
          "#{ENV['ALGOLIA_APPLICATION_ID']}-1.algolianet.com",
          "#{ENV['ALGOLIA_APPLICATION_ID']}-2.algolianet.com",
          "#{ENV['ALGOLIA_APPLICATION_ID']}-3.algolianet.com"
        ],
        :connect_timeout => 5
      @client.destroy # make sure the thread-local vars are reseted
    end

    it "should fallback to the 2nd host after a few seconds" do
      start_time = Time.now
      @client.list_indexes # fallback on the second host after 5 sec (connection timeout)
      expect(start_time.to_i + 5).to be <= Time.now.to_i + 1
    end

    it "should re-use the working (2nd) host after the 1st one failed" do
      start_time = Time.now
      @client.list_indexes # fallback on the second host after 5 sec (connection timeout)
      expect(start_time.to_i + 5).to be <= Time.now.to_i + 1
      start_time = Time.now
      @client.list_indexes # re-use the 2nd one
      expect(start_time.to_i).to be <= Time.now.to_i + 1
    end
  end

  context 'Custom User Agent' do
    before(:all) do
      WebMock.enable!
    end

    before(:each) do
      @client = Algolia::Client.new(
        :application_id => ENV['ALGOLIA_APPLICATION_ID'],
        :api_key => ENV['ALGOLIA_API_KEY'],
        :user_agent => 'test agent'
      )
      @client.destroy # make sure the thread-local vars are reseted
    end

    it "should use a custom user-agent" do
      WebMock.stub_request(:get, /.*\.algolia(net\.com|\.net)\/1\/indexes/).
        to_return(:status => 200, :body => '{}')
      @client.list_indexes
      expect(WebMock).to have_requested(:get, /https:\/\/.+-dsn.algolia(net\.com|\.net)\/1\/indexes/).
        with(:headers => { 'User-Agent' => "Algolia for Ruby (#{::Algolia::VERSION}); Ruby (#{RUBY_VERSION}); test agent" })
    end

    after(:all) do
      WebMock.disable!
    end
  end
end
