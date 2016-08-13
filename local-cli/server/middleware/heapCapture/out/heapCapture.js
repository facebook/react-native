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
/*global React ReactDOM Table stringInterner stackRegistry aggrow preLoadedCapture:true*/var _jsxFileName='src/heapCapture.js';

function registerReactComponentTreeImpl(refs,registry,parents,inEdgeNames,trees,id){
if(parents[id]===undefined){
// not a component
}else if(parents[id]===null){
trees[id]=registry.insert(registry.root,'<internalInstance>');}else 
{
var parent=parents[id];
var inEdgeName=inEdgeNames[id];
var parentTree=trees[parent];
if(parentTree===undefined){
parentTree=registerReactComponentTreeImpl(
refs,
registry,
parents,
inEdgeNames,
trees,
parent);}

trees[id]=registry.insert(parentTree,inEdgeName);}

return trees[id];}


// TODO: make it easier to query the heap graph, it's super annoying to deal with edges directly
function registerReactComponentTree(refs,registry){
// build list of parents for react interal instances, so we can connect a tree
var parents={};
var inEdgeNames={};
for(var id in refs){
var ref=refs[id];
for(var linkId in ref.edges){
if(linkId!=='0x0'){
var name=ref.edges[linkId];
if(name==='_renderedChildren'){
if(parents[id]===undefined){
// mark that we are a react component, even if we don't have a parent
parents[id]=null;}

var childrenRef=refs[linkId];
for(var childId in childrenRef.edges){
var linkName=childrenRef.edges[childId];
if(linkName.startsWith('.')){
parents[childId]=id;
inEdgeNames[childId]=linkName;}}}else 


if(name==='_renderedComponent'){
if(parents[id]===undefined){
parents[id]=null;}

parents[linkId]=id;
inEdgeNames[linkId]='_renderedComponent';}}}}




// build tree of react internal instances (since that's what has the structure)
var trees={};
for(var _id in refs){
registerReactComponentTreeImpl(refs,registry,parents,inEdgeNames,trees,_id);}

// hook in components by looking at their _reactInternalInstance fields
for(var _id2 in refs){
var _ref=refs[_id2];
for(var _linkId in _ref.edges){
var _name=_ref.edges[_linkId];
if(_name==='_reactInternalInstance'){
if(trees[_linkId]!==undefined){
trees[_id2]=registry.insert(trees[_linkId],'<component>');}}}}




return trees;}


function registerPathToRoot(roots,refs,registry,reactComponentTree){
var visited={};
var breadth=[];
for(var i=0;i<roots.length;i++){
var id=roots[i];
if(visited[id]===undefined){
var ref=refs[id];
visited[id]=registry.insert(registry.root,ref.type);
breadth.push(id);}}



while(breadth.length>0){
var nextBreadth=[];var _loop=function _loop(
_i){
var id=breadth[_i];
var ref=refs[id];
var node=visited[id];
// TODO: make edges map id -> name, (empty for none) seems that would be better

var edges=Object.getOwnPropertyNames(ref.edges);
edges.sort(function putUnknownLast(a,b){
var aName=ref.edges[a];
var bName=ref.edges[b];
if(aName===null&&bName!==null){
return 1;}else 
if(aName!==null&&bName===null){
return -1;}else 
if(aName===null&&bName===null){
return 0;}else 
{
return a.localeCompare(b);}});



for(var j=0;j<edges.length;j++){
var edgeId=edges[j];
var edgeName='';
if(ref.edges[edgeId]){
edgeName=ref.edges[edgeId]+': ';}

if(visited[edgeId]===undefined){
var edgeRef=refs[edgeId];
if(edgeRef===undefined){
// TODO: figure out why we have edges that point to things not JSCell
//console.log('registerPathToRoot unable to follow edge from ' + id + ' to ' + edgeId);
}else {
visited[edgeId]=registry.insert(node,edgeName+edgeRef.type);
nextBreadth.push(edgeId);
if(reactComponentTree[edgeId]===undefined){
reactComponentTree[edgeId]=reactComponentTree[id];}}}}};for(var _i=0;_i<breadth.length;_i++){_loop(_i);}





breadth=nextBreadth;}

return visited;}


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
var numFields=6;

return {
strings:strings,
stacks:stacks,
data:data,
register:function registerCapture(captureId,capture){
var rowCount=0;
for(var id in capture.refs){
rowCount++;}

console.log(
'increasing row data from '+(this.data.length*4).toString()+'B to '+
(this.data.length*4+rowCount*numFields*4).toString()+'B');

var newData=new Int32Array(this.data.length+rowCount*numFields);
newData.set(data);
var dataOffset=this.data.length;
this.data=null;

var reactComponentTreeMap=registerReactComponentTree(capture.refs,this.stacks);
var rootPathMap=registerPathToRoot(
capture.roots,
capture.refs,
this.stacks,
reactComponentTreeMap);

var internedCaptureId=this.strings.intern(captureId);
for(var _id3 in capture.refs){
var ref=capture.refs[_id3];
newData[dataOffset+idField]=parseInt(_id3,16);
newData[dataOffset+typeField]=this.strings.intern(ref.type);
newData[dataOffset+sizeField]=ref.size;
newData[dataOffset+traceField]=internedCaptureId;
var pathNode=rootPathMap[_id3];
if(pathNode===undefined){
throw 'did not find path for ref!';}

newData[dataOffset+pathField]=pathNode.id;
var reactTree=reactComponentTreeMap[_id3];
if(reactTree===undefined){
newData[dataOffset+reactField]=
this.stacks.insert(this.stacks.root,'<not-under-tree>').id;}else 
{
newData[dataOffset+reactField]=reactTree.id;}

dataOffset+=numFields;}

this.data=newData;},

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
id+=0x100000000; // data is int32, id is uint32
}
return '0x'+id.toString(16);},

function compareAddress(rowA,rowB){
return agData[rowA*numFields+idField]-agData[rowB*numFields+idField];});


var typeExpander=ag.addFieldExpander('Type',
function getSize(row){return agStrings.get(agData[row*numFields+typeField]);},
function compareSize(rowA,rowB){
return agData[rowA*numFields+typeField]-agData[rowB*numFields+typeField];});


ag.addFieldExpander('Size',
function getSize(row){return agData[row*numFields+sizeField].toString();},
function compareSize(rowA,rowB){
return agData[rowA*numFields+sizeField]-agData[rowB*numFields+sizeField];});


var traceExpander=ag.addFieldExpander('Trace',
function getSize(row){return agStrings.get(agData[row*numFields+traceField]);},
function compareSize(rowA,rowB){
return agData[rowA*numFields+traceField]-agData[rowB*numFields+traceField];});


var pathExpander=ag.addCalleeStackExpander('Path',
function getStack(row){return agStacks.get(agData[row*numFields+pathField]);});

var reactExpander=ag.addCalleeStackExpander('React Tree',
function getStack(row){return agStacks.get(agData[row*numFields+reactField]);});

var sizeAggregator=ag.addAggregator('Size',
function aggregateSize(indices){
var size=0;
for(var i=0;i<indices.length;i++){
var row=indices[i];
size+=agData[row*numFields+sizeField];}

return size;},

function formatSize(value){return value.toString();},
function sortSize(a,b){return b-a;});

var countAggregator=ag.addAggregator('Count',
function aggregateCount(indices){
return indices.length;},

function formatCount(value){return value.toString();},
function sortCount(a,b){return b-a;});

ag.setActiveExpanders([pathExpander,reactExpander,typeExpander,idExpander,traceExpander]);
ag.setActiveAggregators([sizeAggregator,countAggregator]);
return ag;}};}




if(preLoadedCapture){
var r=new captureRegistry();
r.register('trace',preLoadedCapture);
preLoadedCapture=undefined; // let GG clean up the capture
ReactDOM.render(React.createElement(Table,{aggrow:r.getAggrow(),__source:{fileName:_jsxFileName,lineNumber:284}}),document.body);}