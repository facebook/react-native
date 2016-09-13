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
/*global React ReactDOM Table stringInterner stackRegistry aggrow preLoadedCapture:true*/

function RefVisitor(refs,id){
this.refs=refs;
this.id=id;
}

RefVisitor.prototype={
moveToEdge:function moveToEdge(name){
var ref=this.refs[this.id];
if(ref&&ref.edges){
var edges=ref.edges;
for(var edgeId in edges){
if(edges[edgeId]===name){
this.id=edgeId;
return this;
}
}
}
this.id=undefined;
return this;
},
moveToFirst:function moveToFirst(callback){
var ref=this.refs[this.id];
if(ref&&ref.edges){
var edges=ref.edges;
for(var edgeId in edges){
this.id=edgeId;
if(callback(edges[edgeId],this)){
return this;
}
}
}
this.id=undefined;
return this;
},
forEachEdge:function forEachEdge(callback){
var ref=this.refs[this.id];
if(ref&&ref.edges){
var edges=ref.edges;
var visitor=new RefVisitor(this.refs,undefined);
for(var edgeId in edges){
visitor.id=edgeId;
callback(edges[edgeId],visitor);
}
}
},
getType:function getType(){
var ref=this.refs[this.id];
if(ref){
return ref.type;
}
return undefined;
},
getRef:function getRef(){
return this.refs[this.id];
},
clone:function clone(){
return new RefVisitor(this.refs,this.id);
},
isDefined:function isDefined(){
return!!this.id;
},
getValue:function getValue(){var _this=this;
var ref=this.refs[this.id];
if(ref){
if(ref.type==='string'){
if(ref.value){
return ref.value;
}else{var _ret=function(){
var rope=[];
_this.forEachEdge(function(name,visitor){
if(name&&name.startsWith('[')&&name.endsWith(']')){
var index=parseInt(name.substring(1,name.length-1),10);
rope[index]=visitor.getValue();
}
});
return{v:rope.join('')};}();if(typeof _ret==="object")return _ret.v;
}
}else if(ref.type==='ScriptExecutable'||
ref.type==='EvalExecutable'||
ref.type==='ProgramExecutable'){
return ref.value.url+':'+ref.value.line+':'+ref.value.col;
}else if(ref.type==='FunctionExecutable'){
return ref.value.name+'@'+ref.value.url+':'+ref.value.line+':'+ref.value.col;
}else if(ref.type==='NativeExecutable'){
return ref.value.function+' '+ref.value.constructor+' '+ref.value.name;
}else if(ref.type==='Function'){
var executable=this.clone().moveToEdge('@Executable');
if(executable.id){
return executable.getRef().type+' '+executable.getValue();
}
}
}
return'#none';
}};


function forEachRef(refs,callback){
var visitor=new RefVisitor(refs,undefined);
for(var id in refs){
visitor.id=id;
callback(visitor);
}
}

function firstRef(refs,callback){
for(var id in refs){
var ref=refs[id];
if(callback(id,ref)){
return new RefVisitor(refs,id);
}
}
return new RefVisitor(refs,undefined);
}

function getInternalInstanceName(visitor){
var type=visitor.clone().moveToEdge('_currentElement').moveToEdge('type');
if(type.getType()==='string'){// element.type is string
return type.getValue();
}else if(type.getType()==='Function'){// element.type is function
var displayName=type.clone().moveToEdge('displayName');
if(displayName.isDefined()){
return displayName.getValue();// element.type.displayName
}
var name=type.clone().moveToEdge('name');
if(name.isDefined()){
return name.getValue();// element.type.name
}
type.moveToEdge('@Executable');
if(type.getType()==='FunctionExecutable'){
return type.getRef().value.name;// element.type symbolicated name
}
}
return'#unknown';
}

function buildReactComponentTree(visitor,registry){
var ref=visitor.getRef();
if(ref.reactTree||ref.reactParent===undefined){
return;// has one or doesn't need one
}
var parentVisitor=ref.reactParent;
if(parentVisitor===null){
ref.reactTree=registry.insert(registry.root,getInternalInstanceName(visitor));
}else if(parentVisitor){
var parentRef=parentVisitor.getRef();
buildReactComponentTree(parentVisitor,registry);
var relativeName=getInternalInstanceName(visitor);
if(ref.reactKey){
relativeName=ref.reactKey+': '+relativeName;
}
ref.reactTree=registry.insert(parentRef.reactTree,relativeName);
}else{
throw'non react instance parent of react instance';
}
}

function markReactComponentTree(refs,registry){
// annotate all refs that are react internal instances with their parent and name
// ref.reactParent = visitor that points to parent instance,
//   null if we know it's an instance, but don't have a parent yet
// ref.reactKey = if a key is used to distinguish siblings
forEachRef(refs,function(visitor){
var visitorClone=visitor.clone();// visitor will get stomped on next iteration
var ref=visitor.getRef();
visitor.forEachEdge(function(edgeName,edgeVisitor){
var edgeRef=edgeVisitor.getRef();
if(edgeRef){
if(edgeName==='_renderedChildren'){
if(ref.reactParent===undefined){
// ref is react component, even if we don't have a parent yet
ref.reactParent=null;
}
edgeVisitor.forEachEdge(function(childName,childVisitor){
var childRef=childVisitor.getRef();
if(childRef&&childName.startsWith('.')){
childRef.reactParent=visitorClone;
childRef.reactKey=childName;
}
});
}else if(edgeName==='_renderedComponent'){
if(ref.reactParent===undefined){
ref.reactParent=null;
}
edgeRef.reactParent=visitorClone;
}
}
});
});
// build tree of react internal instances (since that's what has the structure)
// fill in ref.reactTree = path registry node
forEachRef(refs,function(visitor){
buildReactComponentTree(visitor,registry);
});
// hook in components by looking at their _reactInternalInstance fields
forEachRef(refs,function(visitor){
var ref=visitor.getRef();
var instanceRef=visitor.moveToEdge('_reactInternalInstance').getRef();
if(instanceRef){
ref.reactTree=instanceRef.reactTree;
}
});
}

function functionUrlFileName(visitor){
var executable=visitor.clone().moveToEdge('@Executable');
var ref=executable.getRef();
if(ref&&ref.value&&ref.value.url){
var url=ref.value.url;
var file=url.substring(url.lastIndexOf('/')+1);
if(file.endsWith('.js')){
file=file.substring(0,file.length-3);
}
return file;
}
return undefined;
}

function markModules(refs){
var modules=firstRef(refs,function(id,ref){return ref.type==='CallbackGlobalObject';});
modules.moveToEdge('require');
modules.moveToFirst(function(name,visitor){return visitor.getType()==='JSActivation';});
modules.moveToEdge('modules');
modules.forEachEdge(function(name,visitor){
var ref=visitor.getRef();
visitor.moveToEdge('exports');
if(visitor.getType()==='Object'){
visitor.moveToFirst(function(memberName,member){return member.getType()==='Function';});
if(visitor.isDefined()){
ref.module=functionUrlFileName(visitor);
}
}else if(visitor.getType()==='Function'){
var displayName=visitor.clone().moveToEdge('displayName');
if(displayName.isDefined()){
ref.module=displayName.getValue();
}
ref.module=functionUrlFileName(visitor);
}
if(ref&&!ref.module){
ref.module='#unknown '+name;
}
});
}

function registerPathToRoot(refs,registry){
markReactComponentTree(refs,registry);
markModules(refs);
var breadth=[];
forEachRef(refs,function(visitor){
var ref=visitor.getRef();
if(ref.type==='CallbackGlobalObject'){
ref.rootPath=registry.insert(registry.root,ref.type);
breadth.push(visitor.clone());
}
});var _loop=function _loop(){

var nextBreadth=[];var _loop2=function _loop2(
i){
var visitor=breadth[i];
var ref=visitor.getRef();
visitor.forEachEdge(function(edgeName,edgeVisitor){
var edgeRef=edgeVisitor.getRef();
if(edgeRef&&edgeRef.rootPath===undefined){
var pathName=edgeRef.type;
if(edgeName){
pathName=edgeName+': '+pathName;
}
edgeRef.rootPath=registry.insert(ref.rootPath,pathName);
nextBreadth.push(edgeVisitor.clone());
// copy module and react tree forward
if(edgeRef.module===undefined){
edgeRef.module=ref.module;
}
if(edgeRef.reactTree===undefined){
edgeRef.reactTree=ref.reactTree;
}
}
});};for(var i=0;i<breadth.length;i++){_loop2(i);
}
breadth=nextBreadth;};while(breadth.length>0){_loop();
}
}

function captureRegistry(){
var strings=stringInterner();
var stacks=stackRegistry(strings);
var data=new Int32Array(0);

var idField=0;
var typeField=1;
var sizeField=2;
var traceField=3;
var pathField=4;
var reactField=5;
var valueField=6;
var moduleField=7;
var numFields=8;

return{
strings:strings,
stacks:stacks,
data:data,
register:function registerCapture(captureId,capture){var _this2=this;
// NB: capture.refs is potentially VERY large, so we try to avoid making
// copies, even of iteration is a bit more annoying.
var rowCount=0;
for(var id in capture.refs){// eslint-disable-line no-unused-vars
rowCount++;
}
for(var _id in capture.markedBlocks){// eslint-disable-line no-unused-vars
rowCount++;
}
console.log(
'increasing row data from '+(this.data.length*4).toString()+'B to '+
(this.data.length*4+rowCount*numFields*4).toString()+'B');

var newData=new Int32Array(this.data.length+rowCount*numFields);
newData.set(data);
var dataOffset=this.data.length;
this.data=null;

registerPathToRoot(capture.refs,this.stacks);
var internedCaptureId=this.strings.intern(captureId);
var noneString=this.strings.intern('#none');
var noneStack=this.stacks.insert(this.stacks.root,'#none');
forEachRef(capture.refs,function(visitor){
var ref=visitor.getRef();
var id=visitor.id;
newData[dataOffset+idField]=parseInt(id,16);
newData[dataOffset+typeField]=_this2.strings.intern(ref.type);
newData[dataOffset+sizeField]=ref.size;
newData[dataOffset+traceField]=internedCaptureId;
if(ref.rootPath===undefined){
newData[dataOffset+pathField]=noneStack.id;
}else{
newData[dataOffset+pathField]=ref.rootPath.id;
}
if(ref.reactTree===undefined){
newData[dataOffset+reactField]=noneStack.id;
}else{
newData[dataOffset+reactField]=ref.reactTree.id;
}
newData[dataOffset+valueField]=_this2.strings.intern(visitor.getValue());
if(ref.module){
newData[dataOffset+moduleField]=_this2.strings.intern(ref.module);
}else{
newData[dataOffset+moduleField]=noneString;
}
dataOffset+=numFields;
});
for(var _id2 in capture.markedBlocks){
var block=capture.markedBlocks[_id2];
newData[dataOffset+idField]=parseInt(_id2,16);
newData[dataOffset+typeField]=this.strings.intern('Marked Block Overhead');
newData[dataOffset+sizeField]=block.capacity-block.size;
newData[dataOffset+traceField]=internedCaptureId;
newData[dataOffset+pathField]=noneStack.id;
newData[dataOffset+reactField]=noneStack.id;
newData[dataOffset+valueField]=this.strings.intern(
'capacity: '+block.capacity+
', size: '+block.size+
', granularity: '+block.cellSize);

newData[dataOffset+moduleField]=noneString;
dataOffset+=numFields;
}
this.data=newData;
},
getAggrow:function getAggrow(){
var agStrings=this.strings;
var agStacks=this.stacks.flatten();
var agData=this.data;
var agNumRows=agData.length/numFields;
var ag=new aggrow(agStrings,agStacks,agNumRows);

var idExpander=ag.addFieldExpander('Id',
function getId(row){
var id=agData[row*numFields+idField];
if(id<0){
id+=0x100000000;// data is int32, id is uint32
}
return'0x'+id.toString(16);
},
function compareAddress(rowA,rowB){
return agData[rowA*numFields+idField]-agData[rowB*numFields+idField];
});

var typeExpander=ag.addFieldExpander('Type',
function getType(row){return agStrings.get(agData[row*numFields+typeField]);},
function compareType(rowA,rowB){
return agData[rowA*numFields+typeField]-agData[rowB*numFields+typeField];
});

var sizeExpander=ag.addFieldExpander('Size',
function getSize(row){return agData[row*numFields+sizeField].toString();},
function compareSize(rowA,rowB){
return agData[rowA*numFields+sizeField]-agData[rowB*numFields+sizeField];
});

var traceExpander=ag.addFieldExpander('Trace',
function getSize(row){return agStrings.get(agData[row*numFields+traceField]);},
function compareSize(rowA,rowB){
return agData[rowA*numFields+traceField]-agData[rowB*numFields+traceField];
});

var pathExpander=ag.addCalleeStackExpander('Path',
function getStack(row){return agStacks.get(agData[row*numFields+pathField]);});

var reactExpander=ag.addCalleeStackExpander('React Tree',
function getStack(row){return agStacks.get(agData[row*numFields+reactField]);});

var valueExpander=ag.addFieldExpander('Value',
function getValue(row){return agStrings.get(agData[row*numFields+valueField]);},
function compareValue(rowA,rowB){
return agData[rowA*numFields+valueField]-agData[rowB*numFields+valueField];
});

var moduleExpander=ag.addFieldExpander('Module',
function getModule(row){return agStrings.get(agData[row*numFields+moduleField]);},
function compareModule(rowA,rowB){
return agData[rowA*numFields+moduleField]-agData[rowB*numFields+moduleField];
});

var sizeAggregator=ag.addAggregator('Size',
function aggregateSize(indices){
var size=0;
for(var i=0;i<indices.length;i++){
var row=indices[i];
size+=agData[row*numFields+sizeField];
}
return size;
},
function formatSize(value){return value.toString();},
function sortSize(a,b){return b-a;});

var countAggregator=ag.addAggregator('Count',
function aggregateCount(indices){
return indices.length;
},
function formatCount(value){return value.toString();},
function sortCount(a,b){return b-a;});

ag.setActiveExpanders([
pathExpander,
reactExpander,
moduleExpander,
typeExpander,
idExpander,
traceExpander,
valueExpander,
sizeExpander]);

ag.setActiveAggregators([sizeAggregator,countAggregator]);
return ag;
}};

}

if(preLoadedCapture){
var r=new captureRegistry();
r.register('trace',preLoadedCapture);
preLoadedCapture=undefined;// let GG clean up the capture
ReactDOM.render(React.createElement(Table,{aggrow:r.getAggrow()}),document.body);
}// @generated
