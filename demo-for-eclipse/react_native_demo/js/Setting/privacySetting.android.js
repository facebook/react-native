'use strict';
var React = require('react-native');
var {
	AppRegistry,
	StyleSheet,
	Text,
	Image,
	View,
} = React;

var PrivacySettingPage = require('./PrivacySetting');
var WeiboPrivacyAndroid = require('./WeiboPrivacyAndroid');

var PrivacySetting = React.createClass({
	getInitialState : function() {
		  console.log("index",'getInitialState');
	    return {
	      comment:0,
	      mobile:0,
	      bindstatus:0,
	      mention:0,
	      contact_list:0,
	      pic_cmt_in:0,
	    };
	  },
	  
	componentWillMount:function(){
		console.log("index",'componentWillMount');
		  WeiboPrivacyAndroid.getStates("http://api.weibo.cn/2/setting/getprivacy",
				  (comment_n,mobile_n,bindstatus_n,mention_n,contact_list_n,pic_cmt_in_n) => this.setState({
					  comment:comment_n,
					  mobile: mobile_n,
				      bindstatus: bindstatus_n,
				      mention: mention_n,
				      contact_list: contact_list_n,
				      pic_cmt_in: pic_cmt_in_n,
				  }));
		  
	},
  render: function() {
	console.log("index",this.state.comment,this.state.mobile,this.state.bindstatus,this.state.mention,this.state.contact_list,this.state.pic_cmt_in);
    return (
    	<PrivacySettingPage 
	    	comment={this.state.comment} 
	    	mobile={this.state.mobile} 
	    	bindstatus={this.state.bindstatus} 
	    	mention={this.state.mention}
	    	contact_list={this.state.contact_list}
	    	pic_cmt_in={this.state.pic_cmt_in}/>
   );
 }
});

AppRegistry.registerComponent('PrivacySetting', () => PrivacySetting);
module.exports = PrivacySetting;