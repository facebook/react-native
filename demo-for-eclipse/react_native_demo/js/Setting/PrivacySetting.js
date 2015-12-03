/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 */
'use strict';

var React = require('React');
	
var SwitchAndroid = require('SwitchAndroid');
var Text = require('Text');
var StyleSheet = require('StyleSheet');
var PageBlock = require('PageBlock');
var PageView = require('PageView');
var View = require('View');
var TouchableHighlight = require('TouchableHighlight');
var SwitchItem = require('SwitchItem');
var WeiboPrivacyAndroid = require('./WeiboPrivacyAndroid');

var PrivacySettingPage = React.createClass({
	
	 propTypes: { 
		 comment: React.PropTypes.number, 
		 mobile:React.PropTypes.number, 
		 bindstatus: React.PropTypes.number, 
		 mention:React.PropTypes.number, 
		 contact_list: React.PropTypes.number, 
		 pic_cmt_in:React.PropTypes.number, 
	 },	 
	
	getDefaultProps: function() {
	    console.log('getDefaultProps');
	 },

  getInitialState : function() {
	  console.log('getInitialState');
    return {
      trueSwitchIsOn: true,
      falseSwitchIsOn: false,
      colorTrueSwitchIsOn: true,
      /*comment:this.props.comment,
      mobile:this.props.mobile,
      bindstatus:this.props.bindstatus,
      mention:this.props.mention,
      contact_list:this.props.contact_list,
      pic_cmt_in:this.props.pic_cmt_in,*/
    };
  },
  
  componentWillMount:function(){
	  console.log('componentWillMount');
  },

  render: function() {
	console.log('render');
	console.log(this.props.comment,this.props.mobile,this.props.bindstatus,this.props.mention,this.props.contact_list,this.props.pic_cmt_in);
    return (
      <PageView title="隐私设置">
        <PageBlock title="通讯录">
        	<SwitchItem title="允许给我推荐通讯录好友">
	          <SwitchAndroid
	            onValueChange={(value) => this.setState({trueSwitchIsOn: value})}
	            value={this.state.trueSwitchIsOn} />
	        </SwitchItem>
	        
	        <SwitchItem title="允许通过此手机号搜到我">
	          <SwitchAndroid
	            onValueChange={(value) => this.setState({falseSwitchIsOn: value})}
	            value={this.state.falseSwitchIsOn} />
	        </SwitchItem>
          </PageBlock>
        <PageBlock title="哪些人可以评论我的微博" description='关闭后，你的通讯录好友将不能通过通讯录找到你'>
	        <TouchableHighlight>
		        <View>
			        <SwitchItem title="所有人"/>
		        </View>
		    </TouchableHighlight>
		    <TouchableHighlight>
		    	<View>
		    		<SwitchItem title="我关注的人"/>
		    	</View>
		    </TouchableHighlight>
		    <TouchableHighlight>
		    	<View>
		    		<SwitchItem title="我的粉丝"/>
		    	</View>
		    </TouchableHighlight>
        </PageBlock>
        <PageBlock title="">
	        <SwitchItem title="允许评论带图">
		        <SwitchAndroid
		          onValueChange={(value) => this.setState({colorTrueSwitchIsOn: value})}
		          value={this.state.colorTrueSwitchIsOn} />
	        </SwitchItem>
        </PageBlock>
        
        <PageBlock title="我可以收到哪些人的@提醒" description='关闭后，其他人将不能在你的微博下发布带图片的评论'>
	        <TouchableHighlight onPress={this.handleUpdateState}>
		        <View>
			        <SwitchItem title="所有人"/>
		        </View>
	        </TouchableHighlight>
	        <TouchableHighlight>
	        	<View>
		    		<SwitchItem title="我关注的人"/>
		    	</View>
	        </TouchableHighlight>
        </PageBlock>
        
      </PageView>
    );
  },
  handleUpdateState:function(){
	  console.log('handle update');
	  WeiboPrivacyAndroid.updateState('http://api.weibo.cn/2/setting/setprivacy','comment',3);
  },
  componentWillUpdate:function(){
	    console.log('componentWillUpdate');
  },
  componentWillUnmount:function(){
	  console.log('componentWillUnmount');
  },
});

module.exports = PrivacySettingPage;
