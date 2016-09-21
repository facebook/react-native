/**
 * Copyright (c) 2016-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';
/*eslint no-console-disallow: "off"*/
/*global React:true*/

// TODO:
// selection and arrow keys for navigating
var _createClass=function(){function defineProperties(target,props){for(var i=0;i<props.length;i++){var descriptor=props[i];descriptor.enumerable=descriptor.enumerable||false;descriptor.configurable=true;if("value"in descriptor)descriptor.writable=true;Object.defineProperty(target,descriptor.key,descriptor);}}return function(Constructor,protoProps,staticProps){if(protoProps)defineProperties(Constructor.prototype,protoProps);if(staticProps)defineProperties(Constructor,staticProps);return Constructor;};}();function _classCallCheck(instance,Constructor){if(!(instance instanceof Constructor)){throw new TypeError("Cannot call a class as a function");}}function _possibleConstructorReturn(self,call){if(!self){throw new ReferenceError("this hasn't been initialised - super() hasn't been called");}return call&&(typeof call==="object"||typeof call==="function")?call:self;}function _inherits(subClass,superClass){if(typeof superClass!=="function"&&superClass!==null){throw new TypeError("Super expression must either be null or a function, not "+typeof superClass);}subClass.prototype=Object.create(superClass&&superClass.prototype,{constructor:{value:subClass,enumerable:false,writable:true,configurable:true}});if(superClass)Object.setPrototypeOf?Object.setPrototypeOf(subClass,superClass):subClass.__proto__=superClass;}
var rowHeight=20;
var treeIndent=16;var

Draggable=function(_React$Component){_inherits(Draggable,_React$Component);// eslint-disable-line no-unused-vars
function Draggable(props){_classCallCheck(this,Draggable);return _possibleConstructorReturn(this,Object.getPrototypeOf(Draggable).call(this,
props));
}_createClass(Draggable,[{key:'render',value:function render()

{
var id=this.props.id;
function dragStart(e){
e.dataTransfer.setData('text/plain',id);
}
return React.cloneElement(
this.props.children,
{draggable:'true',onDragStart:dragStart});

}}]);return Draggable;}(React.Component);

Draggable.propTypes={
children:React.PropTypes.element.isRequired,
id:React.PropTypes.string.isRequired};var


DropTarget=function(_React$Component2){_inherits(DropTarget,_React$Component2);// eslint-disable-line no-unused-vars
function DropTarget(props){_classCallCheck(this,DropTarget);return _possibleConstructorReturn(this,Object.getPrototypeOf(DropTarget).call(this,
props));
}_createClass(DropTarget,[{key:'render',value:function render()

{
var thisId=this.props.id;
var dropFilter=this.props.dropFilter;
var dropAction=this.props.dropAction;
return React.cloneElement(
this.props.children,
{
onDragOver:function onDragOver(e){
var sourceId=e.dataTransfer.getData('text/plain');
if(dropFilter(sourceId)){
e.preventDefault();
}
},
onDrop:function onDrop(e){
var sourceId=e.dataTransfer.getData('text/plain');
if(dropFilter(sourceId)){
e.preventDefault();
dropAction(sourceId,thisId);
}
}});


}}]);return DropTarget;}(React.Component);


DropTarget.propTypes={
children:React.PropTypes.element.isRequired,
id:React.PropTypes.string.isRequired,
dropFilter:React.PropTypes.func.isRequired,
dropAction:React.PropTypes.func.isRequired};var


TableHeader=function(_React$Component3){_inherits(TableHeader,_React$Component3);
function TableHeader(props){_classCallCheck(this,TableHeader);return _possibleConstructorReturn(this,Object.getPrototypeOf(TableHeader).call(this,
props));
}_createClass(TableHeader,[{key:'render',value:function render()
{
var aggrow=this.props.aggrow;
var aggregators=aggrow.getActiveAggregators();
var expanders=aggrow.getActiveExpanders();
var headers=[];
for(var i=0;i<aggregators.length;i++){
var name=aggrow.getAggregatorName(aggregators[i]);
headers.push(
React.createElement(DropTarget,{
id:'aggregate:insert:'+i.toString(),
dropFilter:function dropFilter(s){return s.startsWith('aggregate');},
dropAction:this.props.dropAction},

React.createElement('div',{style:{
width:'16px',
height:'inherit',
backgroundColor:'darkGray',
flexShrink:'0'}})));


headers.push(React.createElement(Draggable,{id:'aggregate:active:'+i.toString()},
React.createElement('div',{style:{width:'128px',textAlign:'center',flexShrink:'0'}},name)));

}
headers.push(
React.createElement(DropTarget,{
id:'divider:insert',
dropFilter:function dropFilter(s){return s.startsWith('aggregate')||s.startsWith('expander');},
dropAction:this.props.dropAction},

React.createElement('div',{style:{
width:'16px',
height:'inherit',
backgroundColor:'gold',
flexShrink:'0'}})));


for(var _i=0;_i<expanders.length;_i++){
var _name=aggrow.getExpanderName(expanders[_i]);
var bg=_i%2===0?'white':'lightGray';
headers.push(React.createElement(Draggable,{id:'expander:active:'+_i.toString()},
React.createElement('div',{style:{
width:'128px',
textAlign:'center',
backgroundColor:bg,
flexShrink:'0'}},

_name)));


var sep=_i+1<expanders.length?'->':'...';
headers.push(
React.createElement(DropTarget,{
id:'expander:insert:'+(_i+1).toString(),
dropFilter:function dropFilter(){return true;},
dropAction:this.props.dropAction},

React.createElement('div',{style:{
height:'inherit',
backgroundColor:'darkGray',
flexShrink:'0'}},

sep)));



}
return(
React.createElement('div',{style:{
width:'100%',
height:'26px',
display:'flex',
flexDirection:'row',
alignItems:'center',
borderBottom:'2px solid black'}},

headers));


}}]);return TableHeader;}(React.Component);


TableHeader.propTypes={
aggrow:React.PropTypes.object.isRequired,
dropAction:React.PropTypes.func.isRequired};var


Table=function(_React$Component4){_inherits(Table,_React$Component4);// eslint-disable-line no-unused-vars
function Table(props){_classCallCheck(this,Table);var _this4=_possibleConstructorReturn(this,Object.getPrototypeOf(Table).call(this,
props));
_this4.state={
aggrow:props.aggrow,
viewport:{top:0,height:100},
cursor:0};return _this4;

}_createClass(Table,[{key:'scroll',value:function scroll(

e){
var viewport=e.target;
var top=Math.floor((viewport.scrollTop-viewport.clientHeight*1.0)/rowHeight);
var height=Math.ceil(viewport.clientHeight*3.0/rowHeight);
if(top!==this.state.viewport.top||height!==this.state.viewport.height){
this.setState({viewport:{top:top,height:height}});
}
}},{key:'_contractRow',value:function _contractRow(

row){
var newCursor=this.state.cursor;
if(newCursor>row.top&&newCursor<row.top+row.height){// in contracted section
newCursor=row.top;
}else if(newCursor>=row.top+row.height){// below contracted section
newCursor-=row.height-1;
}
this.state.aggrow.contract(row);
this.setState({cursor:newCursor});
console.log('-'+row.top);
}},{key:'_expandRow',value:function _expandRow(

row){
var newCursor=this.state.cursor;
this.state.aggrow.expand(row);
if(newCursor>row.top){// below expanded section
newCursor+=row.height-1;
}
this.setState({cursor:newCursor});
console.log('+'+row.top);
}},{key:'_keepCursorInViewport',value:function _keepCursorInViewport()



{
if(this._scrollDiv){
var cursor=this.state.cursor;
var scrollDiv=this._scrollDiv;
if(cursor*rowHeight<scrollDiv.scrollTop+scrollDiv.clientHeight*0.1){
scrollDiv.scrollTop=cursor*rowHeight-scrollDiv.clientHeight*0.1;
}else if((cursor+1)*rowHeight>scrollDiv.scrollTop+scrollDiv.clientHeight*0.9){
scrollDiv.scrollTop=(cursor+1)*rowHeight-scrollDiv.clientHeight*0.9;
}
}
}},{key:'keydown',value:function keydown(

e){
var aggrow=this.state.aggrow;
var cursor=this.state.cursor;
var row=aggrow.getRows(cursor,1)[0];
switch(e.keyCode){
case 38:// up
if(cursor>0){
this.setState({cursor:cursor-1});
this._keepCursorInViewport();
}
e.preventDefault();
break;
case 40:// down
if(cursor<aggrow.getHeight()-1){
this.setState({cursor:cursor+1});
this._keepCursorInViewport();
}
e.preventDefault();
break;
case 37:// left
if(aggrow.canContract(row)){
this._contractRow(row);
}else if(aggrow.getRowIndent(row)>0){
var indent=aggrow.getRowIndent(row)-1;
while(aggrow.getRowIndent(row)>indent){
cursor--;
row=aggrow.getRows(cursor,1)[0];
}
this.setState({cursor:cursor});
this._keepCursorInViewport();
}
e.preventDefault();
break;
case 39:// right
if(aggrow.canExpand(row)){
this._expandRow(row);
}else if(cursor<aggrow.getHeight()-1){
this.setState({cursor:cursor+1});
this._keepCursorInViewport();
}
e.preventDefault();
break;}

}},{key:'dropAction',value:function dropAction(

s,d){
var aggrow=this.state.aggrow;
console.log('dropped '+s+' to '+d);
if(s.startsWith('aggregate:active:')){
var sIndex=parseInt(s.substr(17),10);
var dIndex=-1;
var active=aggrow.getActiveAggregators();
var dragged=active[sIndex];
if(d.startsWith('aggregate:insert:')){
dIndex=parseInt(d.substr(17),10);
}else if(d==='divider:insert'){
dIndex=active.length;
}else{
throw'not allowed to drag '+s+' to '+d;
}
if(dIndex>sIndex){
dIndex--;
}
active.splice(sIndex,1);
active.splice(dIndex,0,dragged);
aggrow.setActiveAggregators(active);
this.setState({cursor:0});
}else if(s.startsWith('expander:active:')){
var _sIndex=parseInt(s.substr(16),10);
var _dIndex=-1;
var _active=aggrow.getActiveExpanders();
var _dragged=_active[_sIndex];
if(d.startsWith('expander:insert:')){
_dIndex=parseInt(d.substr(16),10);
}else if(d==='divider:insert'){
_dIndex=0;
}else{
throw'not allowed to drag '+s+' to '+d;
}
if(_dIndex>_sIndex){
_dIndex--;
}
_active.splice(_sIndex,1);
_active.splice(_dIndex,0,_dragged);
aggrow.setActiveExpanders(_active);
this.setState({cursor:0});
}
}},{key:'render',value:function render()

{var _this5=this;
return(
React.createElement('div',{style:{width:'100%',height:'100%',display:'flex',flexDirection:'column'}},
React.createElement(TableHeader,{aggrow:this.state.aggrow,dropAction:function dropAction(s,d){return _this5.dropAction(s,d);}}),
React.createElement('div',{
style:{
width:'100%',
flexGrow:'1',
overflow:'scroll'},

onScroll:function onScroll(e){return _this5.scroll(e);},
ref:function ref(div){_this5._scrollDiv=div;}},
React.createElement('div',{style:{position:'relative'}},
this.renderVirtualizedRows()))));




}},{key:'renderVirtualizedRows',value:function renderVirtualizedRows()

{var _this6=this;
var aggrow=this.state.aggrow;
var viewport=this.state.viewport;
var rows=aggrow.getRows(viewport.top,viewport.height);
return(
React.createElement('div',{style:{
position:'absolute',
width:'100%',
height:(rowHeight*(aggrow.getHeight()+20)).toString()+'px'}},

rows.map(function(child){return _this6.renderRow(child);})));


}},{key:'renderRow',value:function renderRow(

row){var _this7=this;
if(row===null){
return null;
}
var bg='lightGray';
var aggrow=this.state.aggrow;
var columns=[];
var rowText='';
var indent=4+aggrow.getRowIndent(row)*treeIndent;
var aggregates=aggrow.getActiveAggregators();
if(row.parent!==null&&row.parent.expander%2===0){
bg='white';
}
if(row.top===this.state.cursor){
bg='lightblue';
}
for(var i=0;i<aggregates.length;i++){
var aggregate=aggrow.getRowAggregate(row,i);
columns.push(
React.createElement('div',{style:{
width:'16px',
height:'inherit',
backgroundColor:'darkGray',
flexShrink:'0'}}));


columns.push(
React.createElement('div',{style:{
width:'128px',
textAlign:'right',
flexShrink:'0'}},

aggregate));


}
columns.push(
React.createElement('div',{style:{
width:'16px',
height:'inherit',
backgroundColor:'gold',
flexShrink:'0'}}));


if(aggrow.canExpand(row)){
columns.push(
React.createElement('div',{
style:{
marginLeft:indent.toString()+'px',
flexShrink:'0',
width:'12px',
textAlign:'center',
border:'1px solid gray'},

onClick:function onClick(){return _this7._expandRow(row);}},'+'));


}else if(aggrow.canContract(row)){
columns.push(
React.createElement('div',{
style:{
marginLeft:indent.toString()+'px',
flexShrink:'0',
width:'12px',
textAlign:'center',
border:'1px solid gray'},

onClick:function onClick(){return _this7._contractRow(row);}},'-'));


}else{
columns.push(
React.createElement('div',{
style:{
marginLeft:indent.toString()+'px'}}));



}
rowText+=aggrow.getRowLabel(row);
columns.push(
React.createElement('div',{style:{
flexShrink:'0',
whiteSpace:'nowrap',
marginRight:'20px'}},

rowText));


return(
React.createElement('div',{
key:row.top,
style:{
position:'absolute',
height:(rowHeight-1).toString()+'px',
top:(rowHeight*row.top).toString()+'px',
display:'flex',
flexDirection:'row',
alignItems:'center',
backgroundColor:bg,
borderBottom:'1px solid gray'},

onClick:function onClick(){
_this7.setState({cursor:row.top});
}},
columns));


}},{key:'componentDidMount',value:function componentDidMount()

{
this.keydown=this.keydown.bind(this);
document.body.addEventListener('keydown',this.keydown);
}},{key:'componentWillUnmount',value:function componentWillUnmount()

{
document.body.removeEventListener('keydown',this.keydown);
}}]);return Table;}(React.Component);// @generated
