/**
 * Copyright (c) 2016-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';
/*eslint no-bitwise: "off"*/
/*eslint no-console-disallow: "off"*/

// TODO: future features
// put in a module.exports
// filtering / search
// pivot around frames in the middle of a stack by callers / callees
// graphing?

function StringInterner(){// eslint-disable-line no-unused-vars
var strings=[];
var ids={};
return{
intern:function internString(s){
var find=ids[s];
if(find===undefined){
var id=strings.length;
ids[s]=id;
strings.push(s);
return id;
}else{
return find;
}
},
get:function getString(id){
return strings[id];
}};

}

function StackRegistry(){// eslint-disable-line no-unused-vars
return{
root:{id:0},
nodeCount:1,
maxDepth:-1,
stackIdMap:null,
insert:function insertNode(parent,frameId){
if(this.stackIdMap!==null){
throw'stacks already flattened';
}
var node=parent[frameId];
if(node===undefined){
node={id:this.nodeCount};
this.nodeCount++;
parent[frameId]=node;
}
return node;
},
get:function getStackArray(id){
return this.stackIdMap[id];
},
flatten:function flattenStacks(){
if(this.stackIdMap!==null){
return;
}
var stackFrameCount=0;
function countStacks(tree,depth){
var leaf=true;
for(var frameId in tree){
if(frameId!=='id'){
leaf=countStacks(tree[frameId],depth+1);
}
}
if(leaf){
stackFrameCount+=depth;
}
return false;
}
countStacks(this.root,0);
console.log('size needed to store stacks: '+(stackFrameCount*4).toString()+'B');
var stackIdMap=new Array(this.nodeCount);
var stackArray=new Int32Array(stackFrameCount);
var maxStackDepth=0;
stackFrameCount=0;
function flattenStacksImpl(tree,stack){
var childStack=void 0;
maxStackDepth=Math.max(maxStackDepth,stack.length);
for(var frameId in tree){
if(frameId!=='id'){
stack.push(Number(frameId));
childStack=flattenStacksImpl(tree[frameId],stack);
stack.pop();
}
}

var id=tree.id;
if(id<0||id>=stackIdMap.length||stackIdMap[id]!==undefined){
throw'invalid stack id!';
}

if(childStack!==undefined){
// each child must have our stack as a prefix, so just use that
stackIdMap[id]=childStack.subarray(0,stack.length);
}else{
var newStack=stackArray.subarray(stackFrameCount,stackFrameCount+stack.length);
stackFrameCount+=stack.length;
for(var i=0;i<stack.length;i++){
newStack[i]=stack[i];
}
stackIdMap[id]=newStack;
}
return stackIdMap[id];
}
flattenStacksImpl(this.root,[]);
this.root=null;
this.stackIdMap=stackIdMap;
this.maxDepth=maxStackDepth;
}};

}

function AggrowData(columns){// eslint-disable-line no-unused-vars
var columnCount=columns.length;
var columnConverter=columns.map(function(c){
switch(c.type){
case'int':// stores raw value
return function(i){return i;};
case'string':// stores interned id of string
return function(s){return c.strings.intern(s);};
case'stack':// stores id of stack node
return function(s){return s.id;};
default:
throw'unknown AggrowData column type';}

});
return{
data:new Int32Array(0),
columns:columns,
rowCount:0,
rowInserter:function rowInserter(numRows){
console.log(
'increasing row data from '+(this.data.length*4).toLocaleString()+' B to '+
(this.data.length*4+numRows*columnCount*4).toLocaleString()+' B');

var newData=new Int32Array(this.data.length+numRows*columnCount);
newData.set(this.data);
var currOffset=this.data.length;
var endOffset=newData.length;
this.data=newData;
this.rowCount=newData.length/columnCount;
return{
insertRow:function insertRow(){
if(currOffset>=endOffset){
throw'tried to insert data off end of added range';
}
if(arguments.length!==columnCount){
throw'expected data for '+columnCount.toString()+' columns, got'+
arguments.length.toString()+' columns';
}
for(var i=0;i<arguments.length;i++){
newData[currOffset+i]=columnConverter[i](arguments[i]);
}
currOffset+=columnCount;
},
done:function done(){
if(currOffset!==endOffset){
throw'unfilled rows';
}
}};

}};

}

function Aggrow(aggrowData){
var columns=aggrowData.columns;
var columnCount=columns.length;
var data=aggrowData.data;
function columnIndex(columnName,columnType){
var index=columns.findIndex(function(c){return c.name===columnName&&c.type===columnType;});
if(index<0){
throw'did not find data column '+columnName+' with type '+columnType;
}
return index;
}
for(var i=0;i<columns.length;i++){
if(columns[i].type==='stack'){
columns[i].stacks.flatten();
}
}
return{
expander:new AggrowExpander(aggrowData.rowCount),
addSumAggregator:function addSumAggregator(aggregatorName,columnName){
var index=columnIndex(columnName,'int');
return this.expander.addAggregator(
aggregatorName,
function aggregateSize(indices){
var size=0;
for(var _i=0;_i<indices.length;_i++){
var row=indices[_i];
size+=data[row*columnCount+index];
}
return size;
},
function(value){return value.toLocaleString();},
function(a,b){return b-a;});

},
addCountAggregator:function addCountAggregator(aggregatorName){
return this.expander.addAggregator(
aggregatorName,
function aggregateCount(indices){
return indices.length;
},
function(value){return value.toLocaleString();},
function(a,b){return b-a;});

},
addStringExpander:function addStringExpander(expanderName,columnName){
var index=columnIndex(columnName,'string');
var strings=columns[index].strings;
return this.expander.addFieldExpander(
expanderName,
function(row){return strings.get(data[row*columnCount+index]);},
function(rowA,rowB){return data[rowA*columnCount+index]-data[rowB*columnCount+index];});

},
addNumberExpander:function addNumberExpander(expanderName,columnName){
var index=columnIndex(columnName,'int');
return this.expander.addFieldExpander(
expanderName,
function(row){return data[row*columnCount+index].toLocaleString();},
function(rowA,rowB){return data[rowA*columnCount+index]-data[rowB*columnCount+index];});

},
addPointerExpander:function addPointerExpander(expanderName,columnName){
var index=columnIndex(columnName,'int');
return this.expander.addFieldExpander(
expanderName,
function(row){return'0x'+(data[row*columnCount+index]>>>0).toString();},
function(rowA,rowB){return data[rowA*columnCount+index]-data[rowB*columnCount+index];});

},
addStackExpander:function addStackExpander(expanderName,columnName,formatter){
// TODO: options for caller/callee, pivoting
var index=columnIndex(columnName,'stack');
var stacks=columns[index].stacks;
return this.expander.addCalleeStackExpander(
expanderName,
stacks.maxDepth,
function(row){return stacks.get(data[row*columnCount+index]);},
formatter);

}};

}

function AggrowExpander(numRows){// eslint-disable-line no-unused-vars
// expander ID definitions
var FIELD_EXPANDER_ID_MIN=0x0000;
var FIELD_EXPANDER_ID_MAX=0x7fff;
var STACK_EXPANDER_ID_MIN=0x8000;
var STACK_EXPANDER_ID_MAX=0xffff;

// used for row.expander which reference state.activeExpanders (with frame index masked in)
var INVALID_ACTIVE_EXPANDER=-1;
var ACTIVE_EXPANDER_MASK=0xffff;
var ACTIVE_EXPANDER_FRAME_SHIFT=16;

// aggregator ID definitions
var AGGREGATOR_ID_MAX=0xffff;

// active aggragators can have sort order changed in the reference
var ACTIVE_AGGREGATOR_MASK=0xffff;
var ACTIVE_AGGREGATOR_ASC_BIT=0x10000;

// tree node state definitions
var NODE_EXPANDED_BIT=0x0001;// this row is expanded
var NODE_REAGGREGATE_BIT=0x0002;// children need aggregates
var NODE_REORDER_BIT=0x0004;// children need to be sorted
var NODE_REPOSITION_BIT=0x0008;// children need position
var NODE_INDENT_SHIFT=16;

function calleeFrameIdGetter(stack,depth){
return stack[depth];
}

function callerFrameIdGetter(stack,depth){
return stack[stack.length-depth-1];
}

function createStackComparers(stackGetter,frameIdGetter,maxStackDepth){
var comparers=new Array(maxStackDepth);var _loop=function _loop(
depth){
var captureDepth=depth;// NB: to capture depth per loop iteration
comparers[depth]=function calleeStackComparer(rowA,rowB){
var a=stackGetter(rowA);
var b=stackGetter(rowB);
// NB: we put the stacks that are too short at the top,
// so they can be grouped into the '<exclusive>' bucket
if(a.length<=captureDepth&&b.length<=captureDepth){
return 0;
}else if(a.length<=captureDepth){
return-1;
}else if(b.length<=captureDepth){
return 1;
}
return frameIdGetter(a,captureDepth)-frameIdGetter(b,captureDepth);
};};for(var depth=0;depth<maxStackDepth;depth++){_loop(depth);
}
return comparers;
}

function createTreeNode(parent,label,indices,expander){
var indent=parent===null?0:(parent.state>>>NODE_INDENT_SHIFT)+1;
var state=NODE_REPOSITION_BIT|
NODE_REAGGREGATE_BIT|
NODE_REORDER_BIT|
indent<<NODE_INDENT_SHIFT;
return{
parent:parent,// null if root
children:null,// array of children nodes
label:label,// string to show in UI
indices:indices,// row indices under this node
aggregates:null,// result of aggregate on indices
expander:expander,// index into state.activeExpanders
top:0,// y position of top row (in rows)
height:1,// number of rows including children
state:state};

}

function noSortOrder(a,b){
return 0;
}

var indices=new Int32Array(numRows);
for(var i=0;i<numRows;i++){
indices[i]=i;
}

var state={
fieldExpanders:[],// tree expanders that expand on simple values
stackExpanders:[],// tree expanders that expand stacks
activeExpanders:[],// index into field or stack expanders, hierarchy of tree
aggregators:[],// all available aggregators, might not be used
activeAggregators:[],// index into aggregators, to actually compute
sorter:noSortOrder,// compare function that uses sortOrder to sort row.children
root:createTreeNode(null,'<root>',indices,INVALID_ACTIVE_EXPANDER)};


function evaluateAggregate(row){
var activeAggregators=state.activeAggregators;
var aggregates=new Array(activeAggregators.length);
for(var j=0;j<activeAggregators.length;j++){
var aggregator=state.aggregators[activeAggregators[j]];
aggregates[j]=aggregator.aggregator(row.indices);
}
row.aggregates=aggregates;
row.state|=NODE_REAGGREGATE_BIT;
}

function evaluateAggregates(row){
if((row.state&NODE_EXPANDED_BIT)!==0){
var children=row.children;
for(var _i2=0;_i2<children.length;_i2++){
evaluateAggregate(children[_i2]);
}
row.state|=NODE_REORDER_BIT;
}
row.state^=NODE_REAGGREGATE_BIT;
}

function evaluateOrder(row){
if((row.state&NODE_EXPANDED_BIT)!==0){
var children=row.children;
for(var _i3=0;_i3<children.length;_i3++){
var child=children[_i3];
child.state|=NODE_REORDER_BIT;
}
children.sort(state.sorter);
row.state|=NODE_REPOSITION_BIT;
}
row.state^=NODE_REORDER_BIT;
}

function evaluatePosition(row){
if((row.state&NODE_EXPANDED_BIT)!==0){
var children=row.children;
var childTop=row.top+1;
for(var _i4=0;_i4<children.length;_i4++){
var child=children[_i4];
if(child.top!==childTop){
child.top=childTop;
child.state|=NODE_REPOSITION_BIT;
}
childTop+=child.height;
}
}
row.state^=NODE_REPOSITION_BIT;
}

function getRowsImpl(row,top,height,result){
if((row.state&NODE_REAGGREGATE_BIT)!==0){
evaluateAggregates(row);
}
if((row.state&NODE_REORDER_BIT)!==0){
evaluateOrder(row);
}
if((row.state&NODE_REPOSITION_BIT)!==0){
evaluatePosition(row);
}

if(row.top>=top&&row.top<top+height){
if(result[row.top-top]!=null){
throw'getRows put more than one row at position '+row.top+' into result';
}
result[row.top-top]=row;
}
if((row.state&NODE_EXPANDED_BIT)!==0){
var children=row.children;
for(var _i5=0;_i5<children.length;_i5++){
var child=children[_i5];
if(child.top<top+height&&top<child.top+child.height){
getRowsImpl(child,top,height,result);
}
}
}
}

function updateHeight(row,heightChange){
while(row!==null){
row.height+=heightChange;
row.state|=NODE_REPOSITION_BIT;
row=row.parent;
}
}

function addChildrenWithFieldExpander(row,expander,nextActiveIndex){
var rowIndices=row.indices;
var comparer=expander.comparer;
rowIndices.sort(comparer);
var begin=0;
var end=1;
row.children=[];
while(end<rowIndices.length){
if(comparer(rowIndices[begin],rowIndices[end])!==0){
row.children.push(createTreeNode(
row,
expander.name+': '+expander.formatter(rowIndices[begin]),
rowIndices.subarray(begin,end),
nextActiveIndex));
begin=end;
}
end++;
}
row.children.push(createTreeNode(
row,
expander.name+': '+expander.formatter(rowIndices[begin]),
rowIndices.subarray(begin,end),
nextActiveIndex));
}

function addChildrenWithStackExpander(row,expander,activeIndex,depth,nextActiveIndex){
var rowIndices=row.indices;
var stackGetter=expander.stackGetter;
var frameIdGetter=expander.frameIdGetter;
var frameGetter=expander.frameGetter;
var comparer=expander.comparers[depth];
var expandNextFrame=activeIndex|depth+1<<ACTIVE_EXPANDER_FRAME_SHIFT;
rowIndices.sort(comparer);
var columnName='';
if(depth===0){
columnName=expander.name+': ';
}

// put all the too-short stacks under <exclusive>
var begin=0;
var beginStack=null;
row.children=[];
while(begin<rowIndices.length){
beginStack=stackGetter(rowIndices[begin]);
if(beginStack.length>depth){
break;
}
begin++;
}
if(begin>0){
row.children.push(createTreeNode(
row,
columnName+'<exclusive>',
rowIndices.subarray(0,begin),
nextActiveIndex));
}
// aggregate the rest under frames
if(begin<rowIndices.length){
var end=begin+1;
while(end<rowIndices.length){
var endStack=stackGetter(rowIndices[end]);
if(frameIdGetter(beginStack,depth)!==frameIdGetter(endStack,depth)){
row.children.push(createTreeNode(
row,
columnName+frameGetter(frameIdGetter(beginStack,depth)),
rowIndices.subarray(begin,end),
expandNextFrame));
begin=end;
beginStack=endStack;
}
end++;
}
row.children.push(createTreeNode(
row,
columnName+frameGetter(frameIdGetter(beginStack,depth)),
rowIndices.subarray(begin,end),
expandNextFrame));
}
}

function contractRow(row){
if((row.state&NODE_EXPANDED_BIT)===0){
throw'can not contract row, already contracted';
}
row.state^=NODE_EXPANDED_BIT;
var heightChange=1-row.height;
updateHeight(row,heightChange);
}

function pruneExpanders(row,oldExpander,newExpander){
row.state|=NODE_REPOSITION_BIT;
if(row.expander===oldExpander){
row.state|=NODE_REAGGREGATE_BIT|NODE_REORDER_BIT|NODE_REPOSITION_BIT;
if((row.state&NODE_EXPANDED_BIT)!==0){
contractRow(row);
}
row.children=null;
row.expander=newExpander;
}else{
row.state|=NODE_REPOSITION_BIT;
var children=row.children;
if(children!=null){
for(var _i6=0;_i6<children.length;_i6++){
var child=children[_i6];
pruneExpanders(child,oldExpander,newExpander);
}
}
}
}

return{
addFieldExpander:function addFieldExpander(name,formatter,comparer){
if(FIELD_EXPANDER_ID_MIN+state.fieldExpanders.length>=FIELD_EXPANDER_ID_MAX){
throw'too many field expanders!';
}
state.fieldExpanders.push({
name:name,// name for column
formatter:formatter,// row index -> display string
comparer:comparer});

return FIELD_EXPANDER_ID_MIN+state.fieldExpanders.length-1;
},
addCalleeStackExpander:function addCalleeStackExpander(name,maxStackDepth,stackGetter,frameGetter){
if(STACK_EXPANDER_ID_MIN+state.fieldExpanders.length>=STACK_EXPANDER_ID_MAX){
throw'too many stack expanders!';
}
state.stackExpanders.push({
name:name,// name for column
stackGetter:stackGetter,// row index -> stack array
comparers:createStackComparers(stackGetter,calleeFrameIdGetter,maxStackDepth),// depth -> comparer
frameIdGetter:calleeFrameIdGetter,// (stack, depth) -> string id
frameGetter:frameGetter});

return STACK_EXPANDER_ID_MIN+state.stackExpanders.length-1;
},
addCallerStackExpander:function addCallerStackExpander(name,maxStackDepth,stackGetter,frameGetter){
if(STACK_EXPANDER_ID_MIN+state.fieldExpanders.length>=STACK_EXPANDER_ID_MAX){
throw'too many stack expanders!';
}
state.stackExpanders.push({
name:name,
stackGetter:stackGetter,
comparers:createStackComparers(stackGetter,callerFrameIdGetter,maxStackDepth),
frameIdGetter:callerFrameIdGetter,
frameGetter:frameGetter});

return STACK_EXPANDER_ID_MIN+state.stackExpanders.length-1;
},
getExpanders:function getExpanders(){
var expanders=[];
for(var _i7=0;_i7<state.fieldExpanders.length;_i7++){
expanders.push(FIELD_EXPANDER_ID_MIN+_i7);
}
for(var _i8=0;_i8<state.stackExpanders.length;_i8++){
expanders.push(STACK_EXPANDER_ID_MIN+_i8);
}
return expanders;
},
getExpanderName:function getExpanderName(id){
if(id>=FIELD_EXPANDER_ID_MIN&&id<=FIELD_EXPANDER_ID_MAX){
return state.fieldExpanders[id-FIELD_EXPANDER_ID_MIN].name;
}else if(id>=STACK_EXPANDER_ID_MIN&&id<=STACK_EXPANDER_ID_MAX){
return state.stackExpanders[id-STACK_EXPANDER_ID_MIN].name;
}
throw'Unknown expander ID '+id.toString();
},
setActiveExpanders:function setActiveExpanders(ids){
for(var _i9=0;_i9<ids.length;_i9++){
var id=ids[_i9];
if(id>=FIELD_EXPANDER_ID_MIN&&id<=FIELD_EXPANDER_ID_MAX){
if(id-FIELD_EXPANDER_ID_MIN>=state.fieldExpanders.length){
throw'field expander for id '+id.toString()+' does not exist!';
}
}else if(id>=STACK_EXPANDER_ID_MIN&&id<=STACK_EXPANDER_ID_MAX){
if(id-STACK_EXPANDER_ID_MIN>=state.stackExpanders.length){
throw'stack expander for id '+id.toString()+' does not exist!';
}
}
}
for(var _i10=0;_i10<ids.length;_i10++){
if(state.activeExpanders.length<=_i10){
pruneExpanders(state.root,INVALID_ACTIVE_EXPANDER,_i10);
break;
}else if(ids[_i10]!==state.activeExpanders[_i10]){
pruneExpanders(state.root,_i10,_i10);
break;
}
}
// TODO: if ids is prefix of activeExpanders, we need to make an expander invalid
state.activeExpanders=ids.slice();
},
getActiveExpanders:function getActiveExpanders(){
return state.activeExpanders.slice();
},
addAggregator:function addAggregator(name,aggregator,formatter,sorter){
if(state.aggregators.length>=AGGREGATOR_ID_MAX){
throw'too many aggregators!';
}
state.aggregators.push({
name:name,// name for column
aggregator:aggregator,// index array -> aggregate value
formatter:formatter,// aggregate value -> display string
sorter:sorter});

return state.aggregators.length-1;
},
getAggregators:function getAggregators(){
var aggregators=[];
for(var _i11=0;_i11<state.aggregators.length;_i11++){
aggregators.push(_i11);
}
return aggregators;
},
getAggregatorName:function getAggregatorName(id){
return state.aggregators[id&ACTIVE_AGGREGATOR_MASK].name;
},
setActiveAggregators:function setActiveAggregators(ids){
for(var _i12=0;_i12<ids.length;_i12++){
var id=ids[_i12]&ACTIVE_AGGREGATOR_MASK;
if(id<0||id>state.aggregators.length){
throw'aggregator id '+id.toString()+' not valid';
}
}
state.activeAggregators=ids.slice();
// NB: evaluate root here because dirty bit is for children
// so someone has to start with root, and it might as well be right away
evaluateAggregate(state.root);
var sorter=noSortOrder;var _loop2=function _loop2(
_i13){
var ascending=(ids[_i13]&ACTIVE_AGGREGATOR_ASC_BIT)!==0;
var id=ids[_i13]&ACTIVE_AGGREGATOR_MASK;
var comparer=state.aggregators[id].sorter;
var captureSorter=sorter;
var captureIndex=_i13;
sorter=function sorter(a,b){
var c=comparer(a.aggregates[captureIndex],b.aggregates[captureIndex]);
if(c===0){
return captureSorter(a,b);
}
return ascending?-c:c;
};};for(var _i13=ids.length-1;_i13>=0;_i13--){_loop2(_i13);
}
state.sorter=sorter;
state.root.state|=NODE_REORDER_BIT;
},
getActiveAggregators:function getActiveAggregators(){
return state.activeAggregators.slice();
},
getRows:function getRows(top,height){
var result=new Array(height);
for(var _i14=0;_i14<height;_i14++){
result[_i14]=null;
}
getRowsImpl(state.root,top,height,result);
return result;
},
getRowLabel:function getRowLabel(row){
return row.label;
},
getRowIndent:function getRowIndent(row){
return row.state>>>NODE_INDENT_SHIFT;
},
getRowAggregate:function getRowAggregate(row,index){
var aggregator=state.aggregators[state.activeAggregators[index]];
return aggregator.formatter(row.aggregates[index]);
},
getHeight:function getHeight(){
return state.root.height;
},
canExpand:function canExpand(row){
return(row.state&NODE_EXPANDED_BIT)===0&&row.expander!==INVALID_ACTIVE_EXPANDER;
},
canContract:function canContract(row){
return(row.state&NODE_EXPANDED_BIT)!==0;
},
expand:function expand(row){
if((row.state&NODE_EXPANDED_BIT)!==0){
throw'can not expand row, already expanded';
}
if(row.height!==1){
throw'unexpanded row has height '+row.height.toString()+' != 1';
}
if(row.children===null){// first expand, generate children
var activeIndex=row.expander&ACTIVE_EXPANDER_MASK;
var nextActiveIndex=activeIndex+1;// NB: if next is stack, frame is 0
if(nextActiveIndex>=state.activeExpanders.length){
nextActiveIndex=INVALID_ACTIVE_EXPANDER;
}
if(activeIndex>=state.activeExpanders.length){
throw'invalid active expander index '+activeIndex.toString();
}
var exId=state.activeExpanders[activeIndex];
if(exId>=FIELD_EXPANDER_ID_MIN&&
exId<FIELD_EXPANDER_ID_MIN+state.fieldExpanders.length){
var expander=state.fieldExpanders[exId-FIELD_EXPANDER_ID_MIN];
addChildrenWithFieldExpander(row,expander,nextActiveIndex);
}else if(exId>=STACK_EXPANDER_ID_MIN&&
exId<STACK_EXPANDER_ID_MIN+state.stackExpanders.length){
var depth=row.expander>>>ACTIVE_EXPANDER_FRAME_SHIFT;
var _expander=state.stackExpanders[exId-STACK_EXPANDER_ID_MIN];
addChildrenWithStackExpander(row,_expander,activeIndex,depth,nextActiveIndex);
}else{
throw'state.activeIndex '+activeIndex.toString()+
' has invalid expander'+exId.toString();
}
}
row.state|=NODE_EXPANDED_BIT|
NODE_REAGGREGATE_BIT|NODE_REORDER_BIT|NODE_REPOSITION_BIT;
var heightChange=0;
for(var _i15=0;_i15<row.children.length;_i15++){
heightChange+=row.children[_i15].height;
}
updateHeight(row,heightChange);
// if children only contains one node, then expand it as well
if(row.children.length===1&&this.canExpand(row.children[0])){
this.expand(row.children[0]);
}
},
contract:function contract(row){
contractRow(row);
}};

}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9hZ2dyb3cuanMiXSwibmFtZXMiOlsiU3RyaW5nSW50ZXJuZXIiLCJzdHJpbmdzIiwiaWRzIiwiaW50ZXJuIiwiaW50ZXJuU3RyaW5nIiwicyIsImZpbmQiLCJ1bmRlZmluZWQiLCJpZCIsImxlbmd0aCIsInB1c2giLCJnZXQiLCJnZXRTdHJpbmciLCJTdGFja1JlZ2lzdHJ5Iiwicm9vdCIsIm5vZGVDb3VudCIsIm1heERlcHRoIiwic3RhY2tJZE1hcCIsImluc2VydCIsImluc2VydE5vZGUiLCJwYXJlbnQiLCJmcmFtZUlkIiwibm9kZSIsImdldFN0YWNrQXJyYXkiLCJmbGF0dGVuIiwiZmxhdHRlblN0YWNrcyIsInN0YWNrRnJhbWVDb3VudCIsImNvdW50U3RhY2tzIiwidHJlZSIsImRlcHRoIiwibGVhZiIsImNvbnNvbGUiLCJsb2ciLCJ0b1N0cmluZyIsIkFycmF5Iiwic3RhY2tBcnJheSIsIkludDMyQXJyYXkiLCJtYXhTdGFja0RlcHRoIiwiZmxhdHRlblN0YWNrc0ltcGwiLCJzdGFjayIsImNoaWxkU3RhY2siLCJNYXRoIiwibWF4IiwiTnVtYmVyIiwicG9wIiwic3ViYXJyYXkiLCJuZXdTdGFjayIsImkiLCJBZ2dyb3dEYXRhIiwiY29sdW1ucyIsImNvbHVtbkNvdW50IiwiY29sdW1uQ29udmVydGVyIiwibWFwIiwiYyIsInR5cGUiLCJkYXRhIiwicm93Q291bnQiLCJyb3dJbnNlcnRlciIsIm51bVJvd3MiLCJ0b0xvY2FsZVN0cmluZyIsIm5ld0RhdGEiLCJzZXQiLCJjdXJyT2Zmc2V0IiwiZW5kT2Zmc2V0IiwiaW5zZXJ0Um93IiwiYXJndW1lbnRzIiwiZG9uZSIsIkFnZ3JvdyIsImFnZ3Jvd0RhdGEiLCJjb2x1bW5JbmRleCIsImNvbHVtbk5hbWUiLCJjb2x1bW5UeXBlIiwiaW5kZXgiLCJmaW5kSW5kZXgiLCJuYW1lIiwic3RhY2tzIiwiZXhwYW5kZXIiLCJBZ2dyb3dFeHBhbmRlciIsImFkZFN1bUFnZ3JlZ2F0b3IiLCJhZ2dyZWdhdG9yTmFtZSIsImFkZEFnZ3JlZ2F0b3IiLCJhZ2dyZWdhdGVTaXplIiwiaW5kaWNlcyIsInNpemUiLCJyb3ciLCJ2YWx1ZSIsImEiLCJiIiwiYWRkQ291bnRBZ2dyZWdhdG9yIiwiYWdncmVnYXRlQ291bnQiLCJhZGRTdHJpbmdFeHBhbmRlciIsImV4cGFuZGVyTmFtZSIsImFkZEZpZWxkRXhwYW5kZXIiLCJyb3dBIiwicm93QiIsImFkZE51bWJlckV4cGFuZGVyIiwiYWRkUG9pbnRlckV4cGFuZGVyIiwiYWRkU3RhY2tFeHBhbmRlciIsImZvcm1hdHRlciIsImFkZENhbGxlZVN0YWNrRXhwYW5kZXIiLCJGSUVMRF9FWFBBTkRFUl9JRF9NSU4iLCJGSUVMRF9FWFBBTkRFUl9JRF9NQVgiLCJTVEFDS19FWFBBTkRFUl9JRF9NSU4iLCJTVEFDS19FWFBBTkRFUl9JRF9NQVgiLCJJTlZBTElEX0FDVElWRV9FWFBBTkRFUiIsIkFDVElWRV9FWFBBTkRFUl9NQVNLIiwiQUNUSVZFX0VYUEFOREVSX0ZSQU1FX1NISUZUIiwiQUdHUkVHQVRPUl9JRF9NQVgiLCJBQ1RJVkVfQUdHUkVHQVRPUl9NQVNLIiwiQUNUSVZFX0FHR1JFR0FUT1JfQVNDX0JJVCIsIk5PREVfRVhQQU5ERURfQklUIiwiTk9ERV9SRUFHR1JFR0FURV9CSVQiLCJOT0RFX1JFT1JERVJfQklUIiwiTk9ERV9SRVBPU0lUSU9OX0JJVCIsIk5PREVfSU5ERU5UX1NISUZUIiwiY2FsbGVlRnJhbWVJZEdldHRlciIsImNhbGxlckZyYW1lSWRHZXR0ZXIiLCJjcmVhdGVTdGFja0NvbXBhcmVycyIsInN0YWNrR2V0dGVyIiwiZnJhbWVJZEdldHRlciIsImNvbXBhcmVycyIsImNhcHR1cmVEZXB0aCIsImNhbGxlZVN0YWNrQ29tcGFyZXIiLCJjcmVhdGVUcmVlTm9kZSIsImxhYmVsIiwiaW5kZW50Iiwic3RhdGUiLCJjaGlsZHJlbiIsImFnZ3JlZ2F0ZXMiLCJ0b3AiLCJoZWlnaHQiLCJub1NvcnRPcmRlciIsImZpZWxkRXhwYW5kZXJzIiwic3RhY2tFeHBhbmRlcnMiLCJhY3RpdmVFeHBhbmRlcnMiLCJhZ2dyZWdhdG9ycyIsImFjdGl2ZUFnZ3JlZ2F0b3JzIiwic29ydGVyIiwiZXZhbHVhdGVBZ2dyZWdhdGUiLCJqIiwiYWdncmVnYXRvciIsImV2YWx1YXRlQWdncmVnYXRlcyIsImV2YWx1YXRlT3JkZXIiLCJjaGlsZCIsInNvcnQiLCJldmFsdWF0ZVBvc2l0aW9uIiwiY2hpbGRUb3AiLCJnZXRSb3dzSW1wbCIsInJlc3VsdCIsInVwZGF0ZUhlaWdodCIsImhlaWdodENoYW5nZSIsImFkZENoaWxkcmVuV2l0aEZpZWxkRXhwYW5kZXIiLCJuZXh0QWN0aXZlSW5kZXgiLCJyb3dJbmRpY2VzIiwiY29tcGFyZXIiLCJiZWdpbiIsImVuZCIsImFkZENoaWxkcmVuV2l0aFN0YWNrRXhwYW5kZXIiLCJhY3RpdmVJbmRleCIsImZyYW1lR2V0dGVyIiwiZXhwYW5kTmV4dEZyYW1lIiwiYmVnaW5TdGFjayIsImVuZFN0YWNrIiwiY29udHJhY3RSb3ciLCJwcnVuZUV4cGFuZGVycyIsIm9sZEV4cGFuZGVyIiwibmV3RXhwYW5kZXIiLCJhZGRDYWxsZXJTdGFja0V4cGFuZGVyIiwiZ2V0RXhwYW5kZXJzIiwiZXhwYW5kZXJzIiwiZ2V0RXhwYW5kZXJOYW1lIiwic2V0QWN0aXZlRXhwYW5kZXJzIiwic2xpY2UiLCJnZXRBY3RpdmVFeHBhbmRlcnMiLCJnZXRBZ2dyZWdhdG9ycyIsImdldEFnZ3JlZ2F0b3JOYW1lIiwic2V0QWN0aXZlQWdncmVnYXRvcnMiLCJhc2NlbmRpbmciLCJjYXB0dXJlU29ydGVyIiwiY2FwdHVyZUluZGV4IiwiZ2V0QWN0aXZlQWdncmVnYXRvcnMiLCJnZXRSb3dzIiwiZ2V0Um93TGFiZWwiLCJnZXRSb3dJbmRlbnQiLCJnZXRSb3dBZ2dyZWdhdGUiLCJnZXRIZWlnaHQiLCJjYW5FeHBhbmQiLCJjYW5Db250cmFjdCIsImV4cGFuZCIsImV4SWQiLCJjb250cmFjdCJdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7O0FBUUE7QUFDQTtBQUNB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SWxFLElBQUkyQyxRQUFKLENBQWF0SCxNQUFiLEdBQXdCLENBQXhCLEVBQTZCLEtBQUtpTCxTQUFMLENBQWV0RyxJQUFJMkMsUUFBSixDQUFhLENBQWIsQ0FBZixDQUFqQyxDQUFrRTtBQUNoRSxLQUFLNkQsTUFBTCxDQUFZeEcsSUFBSTJDLFFBQUosQ0FBYSxDQUFiLENBQVo7QUFDRDtBQUNGLENBL01JO0FBZ05MK0QsU0FBVSxRQUFTQSxTQUFULENBQWtCMUcsR0FBbEIsQ0FBdUI7QUFDL0IrRSxZQUFZL0UsR0FBWjtBQUNELENBbE5JLENBQVA7O0FBb05EIiwiZmlsZSI6ImFnZ3Jvdy5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQ29weXJpZ2h0IChjKSAyMDE2LXByZXNlbnQsIEZhY2Vib29rLCBJbmMuXG4gKiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICpcbiAqIFRoaXMgc291cmNlIGNvZGUgaXMgbGljZW5zZWQgdW5kZXIgdGhlIEJTRC1zdHlsZSBsaWNlbnNlIGZvdW5kIGluIHRoZVxuICogTElDRU5TRSBmaWxlIGluIHRoZSByb290IGRpcmVjdG9yeSBvZiB0aGlzIHNvdXJjZSB0cmVlLiBBbiBhZGRpdGlvbmFsIGdyYW50XG4gKiBvZiBwYXRlbnQgcmlnaHRzIGNhbiBiZSBmb3VuZCBpbiB0aGUgUEFURU5UUyBmaWxlIGluIHRoZSBzYW1lIGRpcmVjdG9yeS5cbiAqL1xuJ3VzZSBzdHJpY3QnO1xuLyplc2xpbnQgbm8tYml0d2lzZTogXCJvZmZcIiovXG4vKmVzbGludCBuby1jb25zb2xlLWRpc2FsbG93OiBcIm9mZlwiKi9cblxuLy8gVE9ETzogZnV0dXJlIGZlYXR1cmVzXG4vLyBwdXQgaW4gYSBtb2R1bGUuZXhwb3J0c1xuLy8gZmlsdGVyaW5nIC8gc2VhcmNoXG4vLyBwaXZvdCBhcm91bmQgZnJhbWVzIGluIHRoZSBtaWRkbGUgb2YgYSBzdGFjayBieSBjYWxsZXJzIC8gY2FsbGVlc1xuLy8gZ3JhcGhpbmc/XG5cbmZ1bmN0aW9uIFN0cmluZ0ludGVybmVyKCkgeyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLXVudXNlZC12YXJzXG4gIGNvbnN0IHN0cmluZ3MgPSBbXTtcbiAgY29uc3QgaWRzID0ge307XG4gIHJldHVybiB7XG4gICAgaW50ZXJuOiBmdW5jdGlvbiBpbnRlcm5TdHJpbmcocykge1xuICAgICAgY29uc3QgZmluZCA9IGlkc1tzXTtcbiAgICAgIGlmIChmaW5kID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgY29uc3QgaWQgPSBzdHJpbmdzLmxlbmd0aDtcbiAgICAgICAgaWRzW3NdID0gaWQ7XG4gICAgICAgIHN0cmluZ3MucHVzaChzKTtcbiAgICAgICAgcmV0dXJuIGlkO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIGZpbmQ7XG4gICAgICB9XG4gICAgfSxcbiAgICBnZXQ6IGZ1bmN0aW9uIGdldFN0cmluZyhpZCkge1xuICAgICAgcmV0dXJuIHN0cmluZ3NbaWRdO1xuICAgIH0sXG4gIH07XG59XG5cbmZ1bmN0aW9uIFN0YWNrUmVnaXN0cnkoKSB7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tdW51c2VkLXZhcnNcbiAgcmV0dXJuIHtcbiAgICByb290OiB7IGlkOiAwIH0sXG4gICAgbm9kZUNvdW50OiAxLFxuICAgIG1heERlcHRoOiAtMSxcbiAgICBzdGFja0lkTWFwOiBudWxsLFxuICAgIGluc2VydDogZnVuY3Rpb24gaW5zZXJ0Tm9kZShwYXJlbnQsIGZyYW1lSWQpIHtcbiAgICAgIGlmICh0aGlzLnN0YWNrSWRNYXAgIT09IG51bGwpIHtcbiAgICAgICAgdGhyb3cgJ3N0YWNrcyBhbHJlYWR5IGZsYXR0ZW5lZCc7XG4gICAgICB9XG4gICAgICBsZXQgbm9kZSA9IHBhcmVudFtmcmFtZUlkXTtcbiAgICAgIGlmIChub2RlID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgbm9kZSA9IHsgaWQ6IHRoaXMubm9kZUNvdW50IH07XG4gICAgICAgIHRoaXMubm9kZUNvdW50Kys7XG4gICAgICAgIHBhcmVudFtmcmFtZUlkXSA9IG5vZGU7XG4gICAgICB9XG4gICAgICByZXR1cm4gbm9kZTtcbiAgICB9LFxuICAgIGdldDogZnVuY3Rpb24gZ2V0U3RhY2tBcnJheShpZCkge1xuICAgICAgcmV0dXJuIHRoaXMuc3RhY2tJZE1hcFtpZF07XG4gICAgfSxcbiAgICBmbGF0dGVuOiBmdW5jdGlvbiBmbGF0dGVuU3RhY2tzKCkge1xuICAgICAgaWYgKHRoaXMuc3RhY2tJZE1hcCAhPT0gbnVsbCkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBsZXQgc3RhY2tGcmFtZUNvdW50ID0gMDtcbiAgICAgIGZ1bmN0aW9uIGNvdW50U3RhY2tzKHRyZWUsIGRlcHRoKSB7XG4gICAgICAgIGxldCBsZWFmID0gdHJ1ZTtcbiAgICAgICAgZm9yIChjb25zdCBmcmFtZUlkIGluIHRyZWUpIHtcbiAgICAgICAgICBpZiAoZnJhbWVJZCAhPT0gJ2lkJykge1xuICAgICAgICAgICAgbGVhZiA9IGNvdW50U3RhY2tzKHRyZWVbZnJhbWVJZF0sIGRlcHRoICsgMSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChsZWFmKSB7XG4gICAgICAgICAgc3RhY2tGcmFtZUNvdW50ICs9IGRlcHRoO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICAgIGNvdW50U3RhY2tzKHRoaXMucm9vdCwgMCk7XG4gICAgICBjb25zb2xlLmxvZygnc2l6ZSBuZWVkZWQgdG8gc3RvcmUgc3RhY2tzOiAnICsgKHN0YWNrRnJhbWVDb3VudCAqIDQpLnRvU3RyaW5nKCkgKyAnQicpO1xuICAgICAgY29uc3Qgc3RhY2tJZE1hcCA9IG5ldyBBcnJheSh0aGlzLm5vZGVDb3VudCk7XG4gICAgICBjb25zdCBzdGFja0FycmF5ID0gbmV3IEludDMyQXJyYXkoc3RhY2tGcmFtZUNvdW50KTtcbiAgICAgIGxldCBtYXhTdGFja0RlcHRoID0gMDtcbiAgICAgIHN0YWNrRnJhbWVDb3VudCA9IDA7XG4gICAgICBmdW5jdGlvbiBmbGF0dGVuU3RhY2tzSW1wbCh0cmVlLCBzdGFjaykge1xuICAgICAgICBsZXQgY2hpbGRTdGFjaztcbiAgICAgICAgbWF4U3RhY2tEZXB0aCA9IE1hdGgubWF4KG1heFN0YWNrRGVwdGgsIHN0YWNrLmxlbmd0aCk7XG4gICAgICAgIGZvciAoY29uc3QgZnJhbWVJZCBpbiB0cmVlKSB7XG4gICAgICAgICAgaWYgKGZyYW1lSWQgIT09ICdpZCcpIHtcbiAgICAgICAgICAgIHN0YWNrLnB1c2goTnVtYmVyKGZyYW1lSWQpKTtcbiAgICAgICAgICAgIGNoaWxkU3RhY2sgPSBmbGF0dGVuU3RhY2tzSW1wbCh0cmVlW2ZyYW1lSWRdLCBzdGFjayk7XG4gICAgICAgICAgICBzdGFjay5wb3AoKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBpZCA9IHRyZWUuaWQ7XG4gICAgICAgIGlmIChpZCA8IDAgfHwgaWQgPj0gc3RhY2tJZE1hcC5sZW5ndGggfHwgc3RhY2tJZE1hcFtpZF0gIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgIHRocm93ICdpbnZhbGlkIHN0YWNrIGlkISc7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoY2hpbGRTdGFjayAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgLy8gZWFjaCBjaGlsZCBtdXN0IGhhdmUgb3VyIHN0YWNrIGFzIGEgcHJlZml4LCBzbyBqdXN0IHVzZSB0aGF0XG4gICAgICAgICAgc3RhY2tJZE1hcFtpZF0gPSBjaGlsZFN0YWNrLnN1YmFycmF5KDAsIHN0YWNrLmxlbmd0aCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgY29uc3QgbmV3U3RhY2sgPSBzdGFja0FycmF5LnN1YmFycmF5KHN0YWNrRnJhbWVDb3VudCwgc3RhY2tGcmFtZUNvdW50ICsgc3RhY2subGVuZ3RoKTtcbiAgICAgICAgICBzdGFja0ZyYW1lQ291bnQgKz0gc3RhY2subGVuZ3RoO1xuICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgc3RhY2subGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIG5ld1N0YWNrW2ldID0gc3RhY2tbaV07XG4gICAgICAgICAgfVxuICAgICAgICAgIHN0YWNrSWRNYXBbaWRdID0gbmV3U3RhY2s7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHN0YWNrSWRNYXBbaWRdO1xuICAgICAgfVxuICAgICAgZmxhdHRlblN0YWNrc0ltcGwodGhpcy5yb290LCBbXSk7XG4gICAgICB0aGlzLnJvb3QgPSBudWxsO1xuICAgICAgdGhpcy5zdGFja0lkTWFwID0gc3RhY2tJZE1hcDtcbiAgICAgIHRoaXMubWF4RGVwdGggPSBtYXhTdGFja0RlcHRoO1xuICAgIH0sXG4gIH07XG59XG5cbmZ1bmN0aW9uIEFnZ3Jvd0RhdGEoY29sdW1ucykgeyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLXVudXNlZC12YXJzXG4gIGNvbnN0IGNvbHVtbkNvdW50ID0gY29sdW1ucy5sZW5ndGg7XG4gIGNvbnN0IGNvbHVtbkNvbnZlcnRlciA9IGNvbHVtbnMubWFwKGMgPT4ge1xuICAgIHN3aXRjaCAoYy50eXBlKSB7XG4gICAgICBjYXNlICdpbnQnOiAgICAgLy8gc3RvcmVzIHJhdyB2YWx1ZVxuICAgICAgICByZXR1cm4gKGkpID0+IGk7XG4gICAgICBjYXNlICdzdHJpbmcnOiAgLy8gc3RvcmVzIGludGVybmVkIGlkIG9mIHN0cmluZ1xuICAgICAgICByZXR1cm4gKHMpID0+IGMuc3RyaW5ncy5pbnRlcm4ocyk7XG4gICAgICBjYXNlICdzdGFjayc6ICAgLy8gc3RvcmVzIGlkIG9mIHN0YWNrIG5vZGVcbiAgICAgICAgcmV0dXJuIChzKSA9PiBzLmlkO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgdGhyb3cgJ3Vua25vd24gQWdncm93RGF0YSBjb2x1bW4gdHlwZSc7XG4gICAgfVxuICB9KTtcbiAgcmV0dXJuIHtcbiAgICBkYXRhOiBuZXcgSW50MzJBcnJheSgwKSxcbiAgICBjb2x1bW5zOiBjb2x1bW5zLFxuICAgIHJvd0NvdW50OiAwLFxuICAgIHJvd0luc2VydGVyOiBmdW5jdGlvbiByb3dJbnNlcnRlcihudW1Sb3dzKSB7XG4gICAgICBjb25zb2xlLmxvZyhcbiAgICAgICAgJ2luY3JlYXNpbmcgcm93IGRhdGEgZnJvbSAnICsgKHRoaXMuZGF0YS5sZW5ndGggKiA0KS50b0xvY2FsZVN0cmluZygpICsgJyBCIHRvICcgK1xuICAgICAgICAodGhpcy5kYXRhLmxlbmd0aCAqIDQgKyBudW1Sb3dzICogY29sdW1uQ291bnQgKiA0KS50b0xvY2FsZVN0cmluZygpICsgJyBCJ1xuICAgICAgKTtcbiAgICAgIGNvbnN0IG5ld0RhdGEgPSBuZXcgSW50MzJBcnJheSh0aGlzLmRhdGEubGVuZ3RoICsgbnVtUm93cyAqIGNvbHVtbkNvdW50KTtcbiAgICAgIG5ld0RhdGEuc2V0KHRoaXMuZGF0YSk7XG4gICAgICBsZXQgY3Vyck9mZnNldCA9IHRoaXMuZGF0YS5sZW5ndGg7XG4gICAgICBjb25zdCBlbmRPZmZzZXQgPSBuZXdEYXRhLmxlbmd0aDtcbiAgICAgIHRoaXMuZGF0YSA9IG5ld0RhdGE7XG4gICAgICB0aGlzLnJvd0NvdW50ID0gbmV3RGF0YS5sZW5ndGggLyBjb2x1bW5Db3VudDtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGluc2VydFJvdzogZnVuY3Rpb24gaW5zZXJ0Um93KCkge1xuICAgICAgICAgIGlmIChjdXJyT2Zmc2V0ID49IGVuZE9mZnNldCkge1xuICAgICAgICAgICAgdGhyb3cgJ3RyaWVkIHRvIGluc2VydCBkYXRhIG9mZiBlbmQgb2YgYWRkZWQgcmFuZ2UnO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCAhPT0gY29sdW1uQ291bnQpIHtcbiAgICAgICAgICAgIHRocm93ICdleHBlY3RlZCBkYXRhIGZvciAnICsgY29sdW1uQ291bnQudG9TdHJpbmcoKSArICcgY29sdW1ucywgZ290JyArXG4gICAgICAgICAgICAgIGFyZ3VtZW50cy5sZW5ndGgudG9TdHJpbmcoKSArICcgY29sdW1ucyc7XG4gICAgICAgICAgfVxuICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBuZXdEYXRhW2N1cnJPZmZzZXQgKyBpXSA9IGNvbHVtbkNvbnZlcnRlcltpXShhcmd1bWVudHNbaV0pO1xuICAgICAgICAgIH1cbiAgICAgICAgICBjdXJyT2Zmc2V0ICs9IGNvbHVtbkNvdW50O1xuICAgICAgICB9LFxuICAgICAgICBkb25lOiBmdW5jdGlvbiBkb25lKCkge1xuICAgICAgICAgIGlmIChjdXJyT2Zmc2V0ICE9PSBlbmRPZmZzZXQpIHtcbiAgICAgICAgICAgIHRocm93ICd1bmZpbGxlZCByb3dzJztcbiAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICB9O1xuICAgIH0sXG4gIH07XG59XG5cbmZ1bmN0aW9uIEFnZ3JvdyhhZ2dyb3dEYXRhKSB7XG4gIGNvbnN0IGNvbHVtbnMgPSBhZ2dyb3dEYXRhLmNvbHVtbnM7XG4gIGNvbnN0IGNvbHVtbkNvdW50ID0gY29sdW1ucy5sZW5ndGg7XG4gIGNvbnN0IGRhdGEgPSBhZ2dyb3dEYXRhLmRhdGE7XG4gIGZ1bmN0aW9uIGNvbHVtbkluZGV4KGNvbHVtbk5hbWUsIGNvbHVtblR5cGUpIHtcbiAgICBjb25zdCBpbmRleCA9IGNvbHVtbnMuZmluZEluZGV4KGMgPT4gYy5uYW1lID09PSBjb2x1bW5OYW1lICYmIGMudHlwZSA9PT0gY29sdW1uVHlwZSk7XG4gICAgaWYgKGluZGV4IDwgMCkge1xuICAgICAgdGhyb3cgJ2RpZCBub3QgZmluZCBkYXRhIGNvbHVtbiAnICsgY29sdW1uTmFtZSArICcgd2l0aCB0eXBlICcgKyBjb2x1bW5UeXBlO1xuICAgIH1cbiAgICByZXR1cm4gaW5kZXg7XG4gIH1cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBjb2x1bW5zLmxlbmd0aDsgaSsrKSB7XG4gICAgaWYgKGNvbHVtbnNbaV0udHlwZSA9PT0gJ3N0YWNrJykge1xuICAgICAgY29sdW1uc1tpXS5zdGFja3MuZmxhdHRlbigpO1xuICAgIH1cbiAgfVxuICByZXR1cm4ge1xuICAgIGV4cGFuZGVyOiBuZXcgQWdncm93RXhwYW5kZXIoYWdncm93RGF0YS5yb3dDb3VudCksXG4gICAgYWRkU3VtQWdncmVnYXRvcjogZnVuY3Rpb24gYWRkU3VtQWdncmVnYXRvcihhZ2dyZWdhdG9yTmFtZSwgY29sdW1uTmFtZSkge1xuICAgICAgY29uc3QgaW5kZXggPSBjb2x1bW5JbmRleChjb2x1bW5OYW1lLCAnaW50Jyk7XG4gICAgICByZXR1cm4gdGhpcy5leHBhbmRlci5hZGRBZ2dyZWdhdG9yKFxuICAgICAgICBhZ2dyZWdhdG9yTmFtZSxcbiAgICAgICAgZnVuY3Rpb24gYWdncmVnYXRlU2l6ZShpbmRpY2VzKSB7XG4gICAgICAgICAgbGV0IHNpemUgPSAwO1xuICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgaW5kaWNlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgY29uc3Qgcm93ID0gaW5kaWNlc1tpXTtcbiAgICAgICAgICAgIHNpemUgKz0gZGF0YVtyb3cgKiBjb2x1bW5Db3VudCArIGluZGV4XTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIHNpemU7XG4gICAgICAgIH0sXG4gICAgICAgICh2YWx1ZSkgPT4gdmFsdWUudG9Mb2NhbGVTdHJpbmcoKSxcbiAgICAgICAgKGEsIGIpID0+IGIgLSBhLFxuICAgICAgKTtcbiAgICB9LFxuICAgIGFkZENvdW50QWdncmVnYXRvcjogZnVuY3Rpb24gYWRkQ291bnRBZ2dyZWdhdG9yKGFnZ3JlZ2F0b3JOYW1lKSB7XG4gICAgICByZXR1cm4gdGhpcy5leHBhbmRlci5hZGRBZ2dyZWdhdG9yKFxuICAgICAgICBhZ2dyZWdhdG9yTmFtZSxcbiAgICAgICAgZnVuY3Rpb24gYWdncmVnYXRlQ291bnQoaW5kaWNlcykge1xuICAgICAgICAgIHJldHVybiBpbmRpY2VzLmxlbmd0aDtcbiAgICAgICAgfSxcbiAgICAgICAgKHZhbHVlKSA9PiB2YWx1ZS50b0xvY2FsZVN0cmluZygpLFxuICAgICAgICAoYSwgYikgPT4gYiAtIGEsXG4gICAgICApO1xuICAgIH0sXG4gICAgYWRkU3RyaW5nRXhwYW5kZXI6IGZ1bmN0aW9uIGFkZFN0cmluZ0V4cGFuZGVyKGV4cGFuZGVyTmFtZSwgY29sdW1uTmFtZSkge1xuICAgICAgY29uc3QgaW5kZXggPSBjb2x1bW5JbmRleChjb2x1bW5OYW1lLCAnc3RyaW5nJyk7XG4gICAgICBjb25zdCBzdHJpbmdzID0gY29sdW1uc1tpbmRleF0uc3RyaW5ncztcbiAgICAgIHJldHVybiB0aGlzLmV4cGFuZGVyLmFkZEZpZWxkRXhwYW5kZXIoXG4gICAgICAgIGV4cGFuZGVyTmFtZSxcbiAgICAgICAgKHJvdykgPT4gc3RyaW5ncy5nZXQoZGF0YVtyb3cgKiBjb2x1bW5Db3VudCArIGluZGV4XSksXG4gICAgICAgIChyb3dBLCByb3dCKSA9PiBkYXRhW3Jvd0EgKiBjb2x1bW5Db3VudCArIGluZGV4XSAtIGRhdGFbcm93QiAqIGNvbHVtbkNvdW50ICsgaW5kZXhdLFxuICAgICAgKTtcbiAgICB9LFxuICAgIGFkZE51bWJlckV4cGFuZGVyOiBmdW5jdGlvbiBhZGROdW1iZXJFeHBhbmRlcihleHBhbmRlck5hbWUsIGNvbHVtbk5hbWUpIHtcbiAgICAgIGNvbnN0IGluZGV4ID0gY29sdW1uSW5kZXgoY29sdW1uTmFtZSwgJ2ludCcpO1xuICAgICAgcmV0dXJuIHRoaXMuZXhwYW5kZXIuYWRkRmllbGRFeHBhbmRlcihcbiAgICAgICAgZXhwYW5kZXJOYW1lLFxuICAgICAgICAocm93KSA9PiBkYXRhW3JvdyAqIGNvbHVtbkNvdW50ICsgaW5kZXhdLnRvTG9jYWxlU3RyaW5nKCksXG4gICAgICAgIChyb3dBLCByb3dCKSA9PiBkYXRhW3Jvd0EgKiBjb2x1bW5Db3VudCArIGluZGV4XSAtIGRhdGFbcm93QiAqIGNvbHVtbkNvdW50ICsgaW5kZXhdLFxuICAgICAgKTtcbiAgICB9LFxuICAgIGFkZFBvaW50ZXJFeHBhbmRlcjogZnVuY3Rpb24gYWRkUG9pbnRlckV4cGFuZGVyKGV4cGFuZGVyTmFtZSwgY29sdW1uTmFtZSkge1xuICAgICAgY29uc3QgaW5kZXggPSBjb2x1bW5JbmRleChjb2x1bW5OYW1lLCAnaW50Jyk7XG4gICAgICByZXR1cm4gdGhpcy5leHBhbmRlci5hZGRGaWVsZEV4cGFuZGVyKFxuICAgICAgICBleHBhbmRlck5hbWUsXG4gICAgICAgIChyb3cpID0+ICcweCcgKyAoZGF0YVtyb3cgKiBjb2x1bW5Db3VudCArIGluZGV4XSA+Pj4gMCkudG9TdHJpbmcoKSxcbiAgICAgICAgKHJvd0EsIHJvd0IpID0+IGRhdGFbcm93QSAqIGNvbHVtbkNvdW50ICsgaW5kZXhdIC0gZGF0YVtyb3dCICogY29sdW1uQ291bnQgKyBpbmRleF0sXG4gICAgICApO1xuICAgIH0sXG4gICAgYWRkU3RhY2tFeHBhbmRlcjogZnVuY3Rpb24gYWRkU3RhY2tFeHBhbmRlcihleHBhbmRlck5hbWUsIGNvbHVtbk5hbWUsIGZvcm1hdHRlcikge1xuICAgICAgLy8gVE9ETzogb3B0aW9ucyBmb3IgY2FsbGVyL2NhbGxlZSwgcGl2b3RpbmdcbiAgICAgIGNvbnN0IGluZGV4ID0gY29sdW1uSW5kZXgoY29sdW1uTmFtZSwgJ3N0YWNrJyk7XG4gICAgICBjb25zdCBzdGFja3MgPSBjb2x1bW5zW2luZGV4XS5zdGFja3M7XG4gICAgICByZXR1cm4gdGhpcy5leHBhbmRlci5hZGRDYWxsZWVTdGFja0V4cGFuZGVyKFxuICAgICAgICBleHBhbmRlck5hbWUsXG4gICAgICAgIHN0YWNrcy5tYXhEZXB0aCxcbiAgICAgICAgKHJvdykgPT4gc3RhY2tzLmdldChkYXRhW3JvdyAqIGNvbHVtbkNvdW50ICsgaW5kZXhdKSxcbiAgICAgICAgZm9ybWF0dGVyLFxuICAgICAgKTtcbiAgICB9LFxuICB9O1xufVxuXG5mdW5jdGlvbiBBZ2dyb3dFeHBhbmRlcihudW1Sb3dzKSB7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tdW51c2VkLXZhcnNcbiAgLy8gZXhwYW5kZXIgSUQgZGVmaW5pdGlvbnNcbiAgY29uc3QgRklFTERfRVhQQU5ERVJfSURfTUlOICAgICAgID0gMHgwMDAwO1xuICBjb25zdCBGSUVMRF9FWFBBTkRFUl9JRF9NQVggICAgICAgPSAweDdmZmY7XG4gIGNvbnN0IFNUQUNLX0VYUEFOREVSX0lEX01JTiAgICAgICA9IDB4ODAwMDtcbiAgY29uc3QgU1RBQ0tfRVhQQU5ERVJfSURfTUFYICAgICAgID0gMHhmZmZmO1xuXG4gIC8vIHVzZWQgZm9yIHJvdy5leHBhbmRlciB3aGljaCByZWZlcmVuY2Ugc3RhdGUuYWN0aXZlRXhwYW5kZXJzICh3aXRoIGZyYW1lIGluZGV4IG1hc2tlZCBpbilcbiAgY29uc3QgSU5WQUxJRF9BQ1RJVkVfRVhQQU5ERVIgICAgID0gLTE7XG4gIGNvbnN0IEFDVElWRV9FWFBBTkRFUl9NQVNLICAgICAgICA9IDB4ZmZmZjtcbiAgY29uc3QgQUNUSVZFX0VYUEFOREVSX0ZSQU1FX1NISUZUID0gMTY7XG5cbiAgLy8gYWdncmVnYXRvciBJRCBkZWZpbml0aW9uc1xuICBjb25zdCBBR0dSRUdBVE9SX0lEX01BWCAgICAgICAgICAgPSAweGZmZmY7XG5cbiAgLy8gYWN0aXZlIGFnZ3JhZ2F0b3JzIGNhbiBoYXZlIHNvcnQgb3JkZXIgY2hhbmdlZCBpbiB0aGUgcmVmZXJlbmNlXG4gIGNvbnN0IEFDVElWRV9BR0dSRUdBVE9SX01BU0sgICAgICA9IDB4ZmZmZjtcbiAgY29uc3QgQUNUSVZFX0FHR1JFR0FUT1JfQVNDX0JJVCAgID0gMHgxMDAwMDtcblxuICAvLyB0cmVlIG5vZGUgc3RhdGUgZGVmaW5pdGlvbnNcbiAgY29uc3QgTk9ERV9FWFBBTkRFRF9CSVQgICAgICAgICAgID0gMHgwMDAxOyAvLyB0aGlzIHJvdyBpcyBleHBhbmRlZFxuICBjb25zdCBOT0RFX1JFQUdHUkVHQVRFX0JJVCAgICAgICAgPSAweDAwMDI7IC8vIGNoaWxkcmVuIG5lZWQgYWdncmVnYXRlc1xuICBjb25zdCBOT0RFX1JFT1JERVJfQklUICAgICAgICAgICAgPSAweDAwMDQ7IC8vIGNoaWxkcmVuIG5lZWQgdG8gYmUgc29ydGVkXG4gIGNvbnN0IE5PREVfUkVQT1NJVElPTl9CSVQgICAgICAgICA9IDB4MDAwODsgLy8gY2hpbGRyZW4gbmVlZCBwb3NpdGlvblxuICBjb25zdCBOT0RFX0lOREVOVF9TSElGVCAgICAgICAgICAgPSAxNjtcblxuICBmdW5jdGlvbiBjYWxsZWVGcmFtZUlkR2V0dGVyKHN0YWNrLCBkZXB0aCkge1xuICAgIHJldHVybiBzdGFja1tkZXB0aF07XG4gIH1cblxuICBmdW5jdGlvbiBjYWxsZXJGcmFtZUlkR2V0dGVyKHN0YWNrLCBkZXB0aCkge1xuICAgIHJldHVybiBzdGFja1tzdGFjay5sZW5ndGggLSBkZXB0aCAtIDFdO1xuICB9XG5cbiAgZnVuY3Rpb24gY3JlYXRlU3RhY2tDb21wYXJlcnMoc3RhY2tHZXR0ZXIsIGZyYW1lSWRHZXR0ZXIsIG1heFN0YWNrRGVwdGgpIHtcbiAgICBjb25zdCBjb21wYXJlcnMgPSBuZXcgQXJyYXkobWF4U3RhY2tEZXB0aCk7XG4gICAgZm9yIChsZXQgZGVwdGggPSAwOyBkZXB0aCA8IG1heFN0YWNrRGVwdGg7IGRlcHRoKyspIHtcbiAgICAgIGNvbnN0IGNhcHR1cmVEZXB0aCA9IGRlcHRoOyAvLyBOQjogdG8gY2FwdHVyZSBkZXB0aCBwZXIgbG9vcCBpdGVyYXRpb25cbiAgICAgIGNvbXBhcmVyc1tkZXB0aF0gPSBmdW5jdGlvbiBjYWxsZWVTdGFja0NvbXBhcmVyKHJvd0EsIHJvd0IpIHtcbiAgICAgICAgY29uc3QgYSA9IHN0YWNrR2V0dGVyKHJvd0EpO1xuICAgICAgICBjb25zdCBiID0gc3RhY2tHZXR0ZXIocm93Qik7XG4gICAgICAgIC8vIE5COiB3ZSBwdXQgdGhlIHN0YWNrcyB0aGF0IGFyZSB0b28gc2hvcnQgYXQgdGhlIHRvcCxcbiAgICAgICAgLy8gc28gdGhleSBjYW4gYmUgZ3JvdXBlZCBpbnRvIHRoZSAnPGV4Y2x1c2l2ZT4nIGJ1Y2tldFxuICAgICAgICBpZiAoYS5sZW5ndGggPD0gY2FwdHVyZURlcHRoICYmIGIubGVuZ3RoIDw9IGNhcHR1cmVEZXB0aCkge1xuICAgICAgICAgICAgcmV0dXJuIDA7XG4gICAgICAgIH0gZWxzZSBpZiAoYS5sZW5ndGggPD0gY2FwdHVyZURlcHRoKSB7XG4gICAgICAgICAgICByZXR1cm4gLTE7XG4gICAgICAgIH0gZWxzZSBpZiAoYi5sZW5ndGggPD0gY2FwdHVyZURlcHRoKSB7XG4gICAgICAgICAgICByZXR1cm4gMTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZnJhbWVJZEdldHRlcihhLCBjYXB0dXJlRGVwdGgpIC0gZnJhbWVJZEdldHRlcihiLCBjYXB0dXJlRGVwdGgpO1xuICAgICAgfTtcbiAgICB9XG4gICAgcmV0dXJuIGNvbXBhcmVycztcbiAgfVxuXG4gIGZ1bmN0aW9uIGNyZWF0ZVRyZWVOb2RlKHBhcmVudCwgbGFiZWwsIGluZGljZXMsIGV4cGFuZGVyKSB7XG4gICAgY29uc3QgaW5kZW50ID0gcGFyZW50ID09PSBudWxsID8gMCA6IChwYXJlbnQuc3RhdGUgPj4+IE5PREVfSU5ERU5UX1NISUZUKSArIDE7XG4gICAgY29uc3Qgc3RhdGUgPSBOT0RFX1JFUE9TSVRJT05fQklUIHxcbiAgICAgIE5PREVfUkVBR0dSRUdBVEVfQklUIHxcbiAgICAgIE5PREVfUkVPUkRFUl9CSVQgfFxuICAgICAgKGluZGVudCA8PCBOT0RFX0lOREVOVF9TSElGVCk7XG4gICAgcmV0dXJuIHtcbiAgICAgIHBhcmVudDogcGFyZW50LCAgICAgLy8gbnVsbCBpZiByb290XG4gICAgICBjaGlsZHJlbjogbnVsbCwgICAgIC8vIGFycmF5IG9mIGNoaWxkcmVuIG5vZGVzXG4gICAgICBsYWJlbDogbGFiZWwsICAgICAgIC8vIHN0cmluZyB0byBzaG93IGluIFVJXG4gICAgICBpbmRpY2VzOiBpbmRpY2VzLCAgIC8vIHJvdyBpbmRpY2VzIHVuZGVyIHRoaXMgbm9kZVxuICAgICAgYWdncmVnYXRlczogbnVsbCwgICAvLyByZXN1bHQgb2YgYWdncmVnYXRlIG9uIGluZGljZXNcbiAgICAgIGV4cGFuZGVyOiBleHBhbmRlciwgLy8gaW5kZXggaW50byBzdGF0ZS5hY3RpdmVFeHBhbmRlcnNcbiAgICAgIHRvcDogMCwgICAgICAgICAgICAgLy8geSBwb3NpdGlvbiBvZiB0b3Agcm93IChpbiByb3dzKVxuICAgICAgaGVpZ2h0OiAxLCAgICAgICAgICAvLyBudW1iZXIgb2Ygcm93cyBpbmNsdWRpbmcgY2hpbGRyZW5cbiAgICAgIHN0YXRlOiBzdGF0ZSwgICAgICAgLy8gc2VlIE5PREVfKiBkZWZpbml0aW9ucyBhYm92ZVxuICAgIH07XG4gIH1cblxuICBmdW5jdGlvbiBub1NvcnRPcmRlcihhLCBiKSB7XG4gICAgcmV0dXJuIDA7XG4gIH1cblxuICBjb25zdCBpbmRpY2VzID0gbmV3IEludDMyQXJyYXkobnVtUm93cyk7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgbnVtUm93czsgaSsrKSB7XG4gICAgaW5kaWNlc1tpXSA9IGk7XG4gIH1cblxuICBjb25zdCBzdGF0ZSA9IHtcbiAgICBmaWVsZEV4cGFuZGVyczogW10sICAgICAvLyB0cmVlIGV4cGFuZGVycyB0aGF0IGV4cGFuZCBvbiBzaW1wbGUgdmFsdWVzXG4gICAgc3RhY2tFeHBhbmRlcnM6IFtdLCAgICAgLy8gdHJlZSBleHBhbmRlcnMgdGhhdCBleHBhbmQgc3RhY2tzXG4gICAgYWN0aXZlRXhwYW5kZXJzOiBbXSwgICAgLy8gaW5kZXggaW50byBmaWVsZCBvciBzdGFjayBleHBhbmRlcnMsIGhpZXJhcmNoeSBvZiB0cmVlXG4gICAgYWdncmVnYXRvcnM6IFtdLCAgICAgICAgLy8gYWxsIGF2YWlsYWJsZSBhZ2dyZWdhdG9ycywgbWlnaHQgbm90IGJlIHVzZWRcbiAgICBhY3RpdmVBZ2dyZWdhdG9yczogW10sICAvLyBpbmRleCBpbnRvIGFnZ3JlZ2F0b3JzLCB0byBhY3R1YWxseSBjb21wdXRlXG4gICAgc29ydGVyOiBub1NvcnRPcmRlciwgICAgLy8gY29tcGFyZSBmdW5jdGlvbiB0aGF0IHVzZXMgc29ydE9yZGVyIHRvIHNvcnQgcm93LmNoaWxkcmVuXG4gICAgcm9vdDogY3JlYXRlVHJlZU5vZGUobnVsbCwgJzxyb290PicsIGluZGljZXMsIElOVkFMSURfQUNUSVZFX0VYUEFOREVSKSxcbiAgfTtcblxuICBmdW5jdGlvbiBldmFsdWF0ZUFnZ3JlZ2F0ZShyb3cpIHtcbiAgICBjb25zdCBhY3RpdmVBZ2dyZWdhdG9ycyA9IHN0YXRlLmFjdGl2ZUFnZ3JlZ2F0b3JzO1xuICAgIGNvbnN0IGFnZ3JlZ2F0ZXMgPSBuZXcgQXJyYXkoYWN0aXZlQWdncmVnYXRvcnMubGVuZ3RoKTtcbiAgICBmb3IgKGxldCBqID0gMDsgaiA8IGFjdGl2ZUFnZ3JlZ2F0b3JzLmxlbmd0aDsgaisrKSB7XG4gICAgICBjb25zdCBhZ2dyZWdhdG9yID0gc3RhdGUuYWdncmVnYXRvcnNbYWN0aXZlQWdncmVnYXRvcnNbal1dO1xuICAgICAgYWdncmVnYXRlc1tqXSA9IGFnZ3JlZ2F0b3IuYWdncmVnYXRvcihyb3cuaW5kaWNlcyk7XG4gICAgfVxuICAgIHJvdy5hZ2dyZWdhdGVzID0gYWdncmVnYXRlcztcbiAgICByb3cuc3RhdGUgfD0gTk9ERV9SRUFHR1JFR0FURV9CSVQ7XG4gIH1cblxuICBmdW5jdGlvbiBldmFsdWF0ZUFnZ3JlZ2F0ZXMocm93KSB7XG4gICAgaWYgKChyb3cuc3RhdGUgJiBOT0RFX0VYUEFOREVEX0JJVCkgIT09IDApIHtcbiAgICAgIGNvbnN0IGNoaWxkcmVuID0gcm93LmNoaWxkcmVuO1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuICAgICAgICBldmFsdWF0ZUFnZ3JlZ2F0ZShjaGlsZHJlbltpXSk7XG4gICAgICB9XG4gICAgICByb3cuc3RhdGUgfD0gTk9ERV9SRU9SREVSX0JJVDtcbiAgICB9XG4gICAgcm93LnN0YXRlIF49IE5PREVfUkVBR0dSRUdBVEVfQklUO1xuICB9XG5cbiAgZnVuY3Rpb24gZXZhbHVhdGVPcmRlcihyb3cpIHtcbiAgICBpZiAoKHJvdy5zdGF0ZSAmIE5PREVfRVhQQU5ERURfQklUKSAhPT0gMCkge1xuICAgICAgY29uc3QgY2hpbGRyZW4gPSByb3cuY2hpbGRyZW47XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGNvbnN0IGNoaWxkID0gY2hpbGRyZW5baV07XG4gICAgICAgIGNoaWxkLnN0YXRlIHw9IE5PREVfUkVPUkRFUl9CSVQ7XG4gICAgICB9XG4gICAgICBjaGlsZHJlbi5zb3J0KHN0YXRlLnNvcnRlcik7XG4gICAgICByb3cuc3RhdGUgfD0gTk9ERV9SRVBPU0lUSU9OX0JJVDtcbiAgICB9XG4gICAgcm93LnN0YXRlIF49IE5PREVfUkVPUkRFUl9CSVQ7XG4gIH1cblxuICBmdW5jdGlvbiBldmFsdWF0ZVBvc2l0aW9uKHJvdykge1xuICAgIGlmICgocm93LnN0YXRlICYgTk9ERV9FWFBBTkRFRF9CSVQpICE9PSAwKSB7XG4gICAgICBjb25zdCBjaGlsZHJlbiA9IHJvdy5jaGlsZHJlbjtcbiAgICAgIGxldCBjaGlsZFRvcCA9IHJvdy50b3AgKyAxO1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuICAgICAgICBjb25zdCBjaGlsZCA9IGNoaWxkcmVuW2ldO1xuICAgICAgICBpZiAoY2hpbGQudG9wICE9PSBjaGlsZFRvcCkge1xuICAgICAgICAgIGNoaWxkLnRvcCA9IGNoaWxkVG9wO1xuICAgICAgICAgIGNoaWxkLnN0YXRlIHw9IE5PREVfUkVQT1NJVElPTl9CSVQ7XG4gICAgICAgIH1cbiAgICAgICAgY2hpbGRUb3AgKz0gY2hpbGQuaGVpZ2h0O1xuICAgICAgfVxuICAgIH1cbiAgICByb3cuc3RhdGUgXj0gTk9ERV9SRVBPU0lUSU9OX0JJVDtcbiAgfVxuXG4gIGZ1bmN0aW9uIGdldFJvd3NJbXBsKHJvdywgdG9wLCBoZWlnaHQsIHJlc3VsdCkge1xuICAgIGlmICgocm93LnN0YXRlICYgTk9ERV9SRUFHR1JFR0FURV9CSVQpICE9PSAwKSB7XG4gICAgICBldmFsdWF0ZUFnZ3JlZ2F0ZXMocm93KTtcbiAgICB9XG4gICAgaWYgKChyb3cuc3RhdGUgJiBOT0RFX1JFT1JERVJfQklUKSAhPT0gMCkge1xuICAgICAgZXZhbHVhdGVPcmRlcihyb3cpO1xuICAgIH1cbiAgICBpZiAoKHJvdy5zdGF0ZSAmIE5PREVfUkVQT1NJVElPTl9CSVQpICE9PSAwKSB7XG4gICAgICBldmFsdWF0ZVBvc2l0aW9uKHJvdyk7XG4gICAgfVxuXG4gICAgaWYgKHJvdy50b3AgPj0gdG9wICYmIHJvdy50b3AgPCB0b3AgKyBoZWlnaHQpIHtcbiAgICAgIGlmIChyZXN1bHRbcm93LnRvcCAtIHRvcF0gIT0gbnVsbCkge1xuICAgICAgICB0aHJvdyAnZ2V0Um93cyBwdXQgbW9yZSB0aGFuIG9uZSByb3cgYXQgcG9zaXRpb24gJyArIHJvdy50b3AgKyAnIGludG8gcmVzdWx0JztcbiAgICAgIH1cbiAgICAgIHJlc3VsdFtyb3cudG9wIC0gdG9wXSA9IHJvdztcbiAgICB9XG4gICAgaWYgKChyb3cuc3RhdGUgJiBOT0RFX0VYUEFOREVEX0JJVCkgIT09IDApIHtcbiAgICAgIGNvbnN0IGNoaWxkcmVuID0gcm93LmNoaWxkcmVuO1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuICAgICAgICBjb25zdCBjaGlsZCA9IGNoaWxkcmVuW2ldO1xuICAgICAgICBpZiAoY2hpbGQudG9wIDwgdG9wICsgaGVpZ2h0ICYmIHRvcCA8IGNoaWxkLnRvcCArIGNoaWxkLmhlaWdodCkge1xuICAgICAgICAgIGdldFJvd3NJbXBsKGNoaWxkLCB0b3AsIGhlaWdodCwgcmVzdWx0KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIHVwZGF0ZUhlaWdodChyb3csIGhlaWdodENoYW5nZSkge1xuICAgIHdoaWxlIChyb3cgIT09IG51bGwpIHtcbiAgICAgIHJvdy5oZWlnaHQgKz0gaGVpZ2h0Q2hhbmdlO1xuICAgICAgcm93LnN0YXRlIHw9IE5PREVfUkVQT1NJVElPTl9CSVQ7XG4gICAgICByb3cgPSByb3cucGFyZW50O1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGFkZENoaWxkcmVuV2l0aEZpZWxkRXhwYW5kZXIocm93LCBleHBhbmRlciwgbmV4dEFjdGl2ZUluZGV4KSB7XG4gICAgY29uc3Qgcm93SW5kaWNlcyA9IHJvdy5pbmRpY2VzO1xuICAgIGNvbnN0IGNvbXBhcmVyID0gZXhwYW5kZXIuY29tcGFyZXI7XG4gICAgcm93SW5kaWNlcy5zb3J0KGNvbXBhcmVyKTtcbiAgICBsZXQgYmVnaW4gPSAwO1xuICAgIGxldCBlbmQgPSAxO1xuICAgIHJvdy5jaGlsZHJlbiA9IFtdO1xuICAgIHdoaWxlIChlbmQgPCByb3dJbmRpY2VzLmxlbmd0aCkge1xuICAgICAgaWYgKGNvbXBhcmVyKHJvd0luZGljZXNbYmVnaW5dLCByb3dJbmRpY2VzW2VuZF0pICE9PSAwKSB7XG4gICAgICAgIHJvdy5jaGlsZHJlbi5wdXNoKGNyZWF0ZVRyZWVOb2RlKFxuICAgICAgICAgIHJvdyxcbiAgICAgICAgICBleHBhbmRlci5uYW1lICsgJzogJyArIGV4cGFuZGVyLmZvcm1hdHRlcihyb3dJbmRpY2VzW2JlZ2luXSksXG4gICAgICAgICAgcm93SW5kaWNlcy5zdWJhcnJheShiZWdpbiwgZW5kKSxcbiAgICAgICAgICBuZXh0QWN0aXZlSW5kZXgpKTtcbiAgICAgICAgYmVnaW4gPSBlbmQ7XG4gICAgICB9XG4gICAgICBlbmQrKztcbiAgICB9XG4gICAgcm93LmNoaWxkcmVuLnB1c2goY3JlYXRlVHJlZU5vZGUoXG4gICAgICByb3csXG4gICAgICBleHBhbmRlci5uYW1lICsgJzogJyArIGV4cGFuZGVyLmZvcm1hdHRlcihyb3dJbmRpY2VzW2JlZ2luXSksXG4gICAgICByb3dJbmRpY2VzLnN1YmFycmF5KGJlZ2luLCBlbmQpLFxuICAgICAgbmV4dEFjdGl2ZUluZGV4KSk7XG4gIH1cblxuICBmdW5jdGlvbiBhZGRDaGlsZHJlbldpdGhTdGFja0V4cGFuZGVyKHJvdywgZXhwYW5kZXIsIGFjdGl2ZUluZGV4LCBkZXB0aCwgbmV4dEFjdGl2ZUluZGV4KSB7XG4gICAgY29uc3Qgcm93SW5kaWNlcyA9IHJvdy5pbmRpY2VzO1xuICAgIGNvbnN0IHN0YWNrR2V0dGVyID0gZXhwYW5kZXIuc3RhY2tHZXR0ZXI7XG4gICAgY29uc3QgZnJhbWVJZEdldHRlciA9IGV4cGFuZGVyLmZyYW1lSWRHZXR0ZXI7XG4gICAgY29uc3QgZnJhbWVHZXR0ZXIgPSBleHBhbmRlci5mcmFtZUdldHRlcjtcbiAgICBjb25zdCBjb21wYXJlciA9IGV4cGFuZGVyLmNvbXBhcmVyc1tkZXB0aF07XG4gICAgY29uc3QgZXhwYW5kTmV4dEZyYW1lID0gYWN0aXZlSW5kZXggfCAoKGRlcHRoICsgMSkgPDwgQUNUSVZFX0VYUEFOREVSX0ZSQU1FX1NISUZUKTtcbiAgICByb3dJbmRpY2VzLnNvcnQoY29tcGFyZXIpO1xuICAgIGxldCBjb2x1bW5OYW1lID0gJyc7XG4gICAgaWYgKGRlcHRoID09PSAwKSB7XG4gICAgICBjb2x1bW5OYW1lID0gZXhwYW5kZXIubmFtZSArICc6ICc7XG4gICAgfVxuXG4gICAgLy8gcHV0IGFsbCB0aGUgdG9vLXNob3J0IHN0YWNrcyB1bmRlciA8ZXhjbHVzaXZlPlxuICAgIGxldCBiZWdpbiA9IDA7XG4gICAgbGV0IGJlZ2luU3RhY2sgPSBudWxsO1xuICAgIHJvdy5jaGlsZHJlbiA9IFtdO1xuICAgIHdoaWxlIChiZWdpbiA8IHJvd0luZGljZXMubGVuZ3RoKSB7XG4gICAgICBiZWdpblN0YWNrID0gc3RhY2tHZXR0ZXIocm93SW5kaWNlc1tiZWdpbl0pO1xuICAgICAgaWYgKGJlZ2luU3RhY2subGVuZ3RoID4gZGVwdGgpIHtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBiZWdpbisrO1xuICAgIH1cbiAgICBpZiAoYmVnaW4gPiAwKSB7XG4gICAgICByb3cuY2hpbGRyZW4ucHVzaChjcmVhdGVUcmVlTm9kZShcbiAgICAgICAgcm93LFxuICAgICAgICBjb2x1bW5OYW1lICsgJzxleGNsdXNpdmU+JyxcbiAgICAgICAgcm93SW5kaWNlcy5zdWJhcnJheSgwLCBiZWdpbiksXG4gICAgICAgIG5leHRBY3RpdmVJbmRleCkpO1xuICAgIH1cbiAgICAvLyBhZ2dyZWdhdGUgdGhlIHJlc3QgdW5kZXIgZnJhbWVzXG4gICAgaWYgKGJlZ2luIDwgcm93SW5kaWNlcy5sZW5ndGgpIHtcbiAgICAgIGxldCBlbmQgPSBiZWdpbiArIDE7XG4gICAgICB3aGlsZSAoZW5kIDwgcm93SW5kaWNlcy5sZW5ndGgpIHtcbiAgICAgICAgY29uc3QgZW5kU3RhY2sgPSBzdGFja0dldHRlcihyb3dJbmRpY2VzW2VuZF0pO1xuICAgICAgICBpZiAoZnJhbWVJZEdldHRlcihiZWdpblN0YWNrLCBkZXB0aCkgIT09IGZyYW1lSWRHZXR0ZXIoZW5kU3RhY2ssIGRlcHRoKSkge1xuICAgICAgICAgIHJvdy5jaGlsZHJlbi5wdXNoKGNyZWF0ZVRyZWVOb2RlKFxuICAgICAgICAgICAgcm93LFxuICAgICAgICAgICAgY29sdW1uTmFtZSArIGZyYW1lR2V0dGVyKGZyYW1lSWRHZXR0ZXIoYmVnaW5TdGFjaywgZGVwdGgpKSxcbiAgICAgICAgICAgIHJvd0luZGljZXMuc3ViYXJyYXkoYmVnaW4sIGVuZCksXG4gICAgICAgICAgICBleHBhbmROZXh0RnJhbWUpKTtcbiAgICAgICAgICBiZWdpbiA9IGVuZDtcbiAgICAgICAgICBiZWdpblN0YWNrID0gZW5kU3RhY2s7XG4gICAgICAgIH1cbiAgICAgICAgZW5kKys7XG4gICAgICB9XG4gICAgICByb3cuY2hpbGRyZW4ucHVzaChjcmVhdGVUcmVlTm9kZShcbiAgICAgICAgcm93LFxuICAgICAgICBjb2x1bW5OYW1lICsgZnJhbWVHZXR0ZXIoZnJhbWVJZEdldHRlcihiZWdpblN0YWNrLCBkZXB0aCkpLFxuICAgICAgICByb3dJbmRpY2VzLnN1YmFycmF5KGJlZ2luLCBlbmQpLFxuICAgICAgICBleHBhbmROZXh0RnJhbWUpKTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBjb250cmFjdFJvdyhyb3cpIHtcbiAgICAgIGlmICgocm93LnN0YXRlICYgTk9ERV9FWFBBTkRFRF9CSVQpID09PSAwKSB7XG4gICAgICAgIHRocm93ICdjYW4gbm90IGNvbnRyYWN0IHJvdywgYWxyZWFkeSBjb250cmFjdGVkJztcbiAgICAgIH1cbiAgICAgIHJvdy5zdGF0ZSBePSBOT0RFX0VYUEFOREVEX0JJVDtcbiAgICAgIGNvbnN0IGhlaWdodENoYW5nZSA9IDEgLSByb3cuaGVpZ2h0O1xuICAgICAgdXBkYXRlSGVpZ2h0KHJvdywgaGVpZ2h0Q2hhbmdlKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHBydW5lRXhwYW5kZXJzKHJvdywgb2xkRXhwYW5kZXIsIG5ld0V4cGFuZGVyKSB7XG4gICAgcm93LnN0YXRlIHw9IE5PREVfUkVQT1NJVElPTl9CSVQ7XG4gICAgaWYgKHJvdy5leHBhbmRlciA9PT0gb2xkRXhwYW5kZXIpIHtcbiAgICAgIHJvdy5zdGF0ZSB8PSBOT0RFX1JFQUdHUkVHQVRFX0JJVCB8IE5PREVfUkVPUkRFUl9CSVQgfCBOT0RFX1JFUE9TSVRJT05fQklUO1xuICAgICAgaWYgKChyb3cuc3RhdGUgJiBOT0RFX0VYUEFOREVEX0JJVCkgIT09IDApIHtcbiAgICAgICAgY29udHJhY3RSb3cocm93KTtcbiAgICAgIH1cbiAgICAgIHJvdy5jaGlsZHJlbiA9IG51bGw7XG4gICAgICByb3cuZXhwYW5kZXIgPSBuZXdFeHBhbmRlcjtcbiAgICB9IGVsc2Uge1xuICAgICAgcm93LnN0YXRlIHw9IE5PREVfUkVQT1NJVElPTl9CSVQ7XG4gICAgICBjb25zdCBjaGlsZHJlbiA9IHJvdy5jaGlsZHJlbjtcbiAgICAgIGlmIChjaGlsZHJlbiAhPSBudWxsKSB7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICBjb25zdCBjaGlsZCA9IGNoaWxkcmVuW2ldO1xuICAgICAgICAgIHBydW5lRXhwYW5kZXJzKGNoaWxkLCBvbGRFeHBhbmRlciwgbmV3RXhwYW5kZXIpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBhZGRGaWVsZEV4cGFuZGVyOiBmdW5jdGlvbiBhZGRGaWVsZEV4cGFuZGVyKG5hbWUsIGZvcm1hdHRlciwgY29tcGFyZXIpIHtcbiAgICAgIGlmIChGSUVMRF9FWFBBTkRFUl9JRF9NSU4gKyBzdGF0ZS5maWVsZEV4cGFuZGVycy5sZW5ndGggPj0gRklFTERfRVhQQU5ERVJfSURfTUFYKSB7XG4gICAgICAgIHRocm93ICd0b28gbWFueSBmaWVsZCBleHBhbmRlcnMhJztcbiAgICAgIH1cbiAgICAgIHN0YXRlLmZpZWxkRXhwYW5kZXJzLnB1c2goe1xuICAgICAgICBuYW1lOiBuYW1lLCAvLyBuYW1lIGZvciBjb2x1bW5cbiAgICAgICAgZm9ybWF0dGVyOiBmb3JtYXR0ZXIsIC8vIHJvdyBpbmRleCAtPiBkaXNwbGF5IHN0cmluZ1xuICAgICAgICBjb21wYXJlcjogY29tcGFyZXIsIC8vIGNvbXBhcmVzIGJ5IHR3byByb3cgaW5kaWNlc1xuICAgICAgfSk7XG4gICAgICByZXR1cm4gRklFTERfRVhQQU5ERVJfSURfTUlOICsgc3RhdGUuZmllbGRFeHBhbmRlcnMubGVuZ3RoIC0gMTtcbiAgICB9LFxuICAgIGFkZENhbGxlZVN0YWNrRXhwYW5kZXI6IGZ1bmN0aW9uIGFkZENhbGxlZVN0YWNrRXhwYW5kZXIobmFtZSwgbWF4U3RhY2tEZXB0aCwgc3RhY2tHZXR0ZXIsIGZyYW1lR2V0dGVyKSB7XG4gICAgICBpZiAoU1RBQ0tfRVhQQU5ERVJfSURfTUlOICsgc3RhdGUuZmllbGRFeHBhbmRlcnMubGVuZ3RoID49IFNUQUNLX0VYUEFOREVSX0lEX01BWCkge1xuICAgICAgICB0aHJvdyAndG9vIG1hbnkgc3RhY2sgZXhwYW5kZXJzISc7XG4gICAgICB9XG4gICAgICBzdGF0ZS5zdGFja0V4cGFuZGVycy5wdXNoKHtcbiAgICAgICAgbmFtZTogbmFtZSwgLy8gbmFtZSBmb3IgY29sdW1uXG4gICAgICAgIHN0YWNrR2V0dGVyOiBzdGFja0dldHRlciwgLy8gcm93IGluZGV4IC0+IHN0YWNrIGFycmF5XG4gICAgICAgIGNvbXBhcmVyczogY3JlYXRlU3RhY2tDb21wYXJlcnMoc3RhY2tHZXR0ZXIsIGNhbGxlZUZyYW1lSWRHZXR0ZXIsIG1heFN0YWNrRGVwdGgpLCAgLy8gZGVwdGggLT4gY29tcGFyZXJcbiAgICAgICAgZnJhbWVJZEdldHRlcjogY2FsbGVlRnJhbWVJZEdldHRlciwgLy8gKHN0YWNrLCBkZXB0aCkgLT4gc3RyaW5nIGlkXG4gICAgICAgIGZyYW1lR2V0dGVyOiBmcmFtZUdldHRlcixcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIFNUQUNLX0VYUEFOREVSX0lEX01JTiArIHN0YXRlLnN0YWNrRXhwYW5kZXJzLmxlbmd0aCAtIDE7XG4gICAgfSxcbiAgICBhZGRDYWxsZXJTdGFja0V4cGFuZGVyOiBmdW5jdGlvbiBhZGRDYWxsZXJTdGFja0V4cGFuZGVyKG5hbWUsIG1heFN0YWNrRGVwdGgsIHN0YWNrR2V0dGVyLCBmcmFtZUdldHRlcikge1xuICAgICAgaWYgKFNUQUNLX0VYUEFOREVSX0lEX01JTiArIHN0YXRlLmZpZWxkRXhwYW5kZXJzLmxlbmd0aCA+PSBTVEFDS19FWFBBTkRFUl9JRF9NQVgpIHtcbiAgICAgICAgdGhyb3cgJ3RvbyBtYW55IHN0YWNrIGV4cGFuZGVycyEnO1xuICAgICAgfVxuICAgICAgc3RhdGUuc3RhY2tFeHBhbmRlcnMucHVzaCh7XG4gICAgICAgIG5hbWU6IG5hbWUsXG4gICAgICAgIHN0YWNrR2V0dGVyOiBzdGFja0dldHRlcixcbiAgICAgICAgY29tcGFyZXJzOiBjcmVhdGVTdGFja0NvbXBhcmVycyhzdGFja0dldHRlciwgY2FsbGVyRnJhbWVJZEdldHRlciwgbWF4U3RhY2tEZXB0aCksXG4gICAgICAgIGZyYW1lSWRHZXR0ZXI6IGNhbGxlckZyYW1lSWRHZXR0ZXIsXG4gICAgICAgIGZyYW1lR2V0dGVyOiBmcmFtZUdldHRlcixcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIFNUQUNLX0VYUEFOREVSX0lEX01JTiArIHN0YXRlLnN0YWNrRXhwYW5kZXJzLmxlbmd0aCAtIDE7XG4gICAgfSxcbiAgICBnZXRFeHBhbmRlcnM6IGZ1bmN0aW9uIGdldEV4cGFuZGVycygpIHtcbiAgICAgIGNvbnN0IGV4cGFuZGVycyA9IFtdO1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzdGF0ZS5maWVsZEV4cGFuZGVycy5sZW5ndGg7IGkrKykge1xuICAgICAgICBleHBhbmRlcnMucHVzaChGSUVMRF9FWFBBTkRFUl9JRF9NSU4gKyBpKTtcbiAgICAgIH1cbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgc3RhdGUuc3RhY2tFeHBhbmRlcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgZXhwYW5kZXJzLnB1c2goU1RBQ0tfRVhQQU5ERVJfSURfTUlOICsgaSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gZXhwYW5kZXJzO1xuICAgIH0sXG4gICAgZ2V0RXhwYW5kZXJOYW1lOiBmdW5jdGlvbiBnZXRFeHBhbmRlck5hbWUoaWQpIHtcbiAgICAgIGlmIChpZCA+PSBGSUVMRF9FWFBBTkRFUl9JRF9NSU4gJiYgaWQgPD0gRklFTERfRVhQQU5ERVJfSURfTUFYKSB7XG4gICAgICAgIHJldHVybiBzdGF0ZS5maWVsZEV4cGFuZGVyc1tpZCAtIEZJRUxEX0VYUEFOREVSX0lEX01JTl0ubmFtZTtcbiAgICAgIH0gZWxzZSBpZiAoaWQgPj0gU1RBQ0tfRVhQQU5ERVJfSURfTUlOICYmIGlkIDw9IFNUQUNLX0VYUEFOREVSX0lEX01BWCkge1xuICAgICAgICByZXR1cm4gc3RhdGUuc3RhY2tFeHBhbmRlcnNbaWQgLSBTVEFDS19FWFBBTkRFUl9JRF9NSU5dLm5hbWU7XG4gICAgICB9XG4gICAgICB0aHJvdyAnVW5rbm93biBleHBhbmRlciBJRCAnICsgaWQudG9TdHJpbmcoKTtcbiAgICB9LFxuICAgIHNldEFjdGl2ZUV4cGFuZGVyczogZnVuY3Rpb24gc2V0QWN0aXZlRXhwYW5kZXJzKGlkcykge1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBpZHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgY29uc3QgaWQgPSBpZHNbaV07XG4gICAgICAgIGlmIChpZCA+PSBGSUVMRF9FWFBBTkRFUl9JRF9NSU4gJiYgaWQgPD0gRklFTERfRVhQQU5ERVJfSURfTUFYKSB7XG4gICAgICAgICAgaWYgKGlkIC0gRklFTERfRVhQQU5ERVJfSURfTUlOID49IHN0YXRlLmZpZWxkRXhwYW5kZXJzLmxlbmd0aCkge1xuICAgICAgICAgICAgdGhyb3cgJ2ZpZWxkIGV4cGFuZGVyIGZvciBpZCAnICsgaWQudG9TdHJpbmcoKSArICcgZG9lcyBub3QgZXhpc3QhJztcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAoaWQgPj0gU1RBQ0tfRVhQQU5ERVJfSURfTUlOICYmIGlkIDw9IFNUQUNLX0VYUEFOREVSX0lEX01BWCkge1xuICAgICAgICAgIGlmIChpZCAtIFNUQUNLX0VYUEFOREVSX0lEX01JTiA+PSBzdGF0ZS5zdGFja0V4cGFuZGVycy5sZW5ndGgpIHtcbiAgICAgICAgICAgIHRocm93ICdzdGFjayBleHBhbmRlciBmb3IgaWQgJyArIGlkLnRvU3RyaW5nKCkgKyAnIGRvZXMgbm90IGV4aXN0ISc7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGlkcy5sZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAoc3RhdGUuYWN0aXZlRXhwYW5kZXJzLmxlbmd0aCA8PSBpKSB7XG4gICAgICAgICAgcHJ1bmVFeHBhbmRlcnMoc3RhdGUucm9vdCwgSU5WQUxJRF9BQ1RJVkVfRVhQQU5ERVIsIGkpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9IGVsc2UgaWYgKGlkc1tpXSAhPT0gc3RhdGUuYWN0aXZlRXhwYW5kZXJzW2ldKSB7XG4gICAgICAgICAgcHJ1bmVFeHBhbmRlcnMoc3RhdGUucm9vdCwgaSwgaSk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIC8vIFRPRE86IGlmIGlkcyBpcyBwcmVmaXggb2YgYWN0aXZlRXhwYW5kZXJzLCB3ZSBuZWVkIHRvIG1ha2UgYW4gZXhwYW5kZXIgaW52YWxpZFxuICAgICAgc3RhdGUuYWN0aXZlRXhwYW5kZXJzID0gaWRzLnNsaWNlKCk7XG4gICAgfSxcbiAgICBnZXRBY3RpdmVFeHBhbmRlcnM6IGZ1bmN0aW9uIGdldEFjdGl2ZUV4cGFuZGVycygpIHtcbiAgICAgIHJldHVybiBzdGF0ZS5hY3RpdmVFeHBhbmRlcnMuc2xpY2UoKTtcbiAgICB9LFxuICAgIGFkZEFnZ3JlZ2F0b3I6IGZ1bmN0aW9uIGFkZEFnZ3JlZ2F0b3IobmFtZSwgYWdncmVnYXRvciwgZm9ybWF0dGVyLCBzb3J0ZXIpIHtcbiAgICAgIGlmIChzdGF0ZS5hZ2dyZWdhdG9ycy5sZW5ndGggPj0gQUdHUkVHQVRPUl9JRF9NQVgpIHtcbiAgICAgICAgdGhyb3cgJ3RvbyBtYW55IGFnZ3JlZ2F0b3JzISc7XG4gICAgICB9XG4gICAgICBzdGF0ZS5hZ2dyZWdhdG9ycy5wdXNoKHtcbiAgICAgICAgbmFtZTogbmFtZSwgICAgICAgICAgICAgLy8gbmFtZSBmb3IgY29sdW1uXG4gICAgICAgIGFnZ3JlZ2F0b3I6IGFnZ3JlZ2F0b3IsIC8vIGluZGV4IGFycmF5IC0+IGFnZ3JlZ2F0ZSB2YWx1ZVxuICAgICAgICBmb3JtYXR0ZXI6IGZvcm1hdHRlciwgICAvLyBhZ2dyZWdhdGUgdmFsdWUgLT4gZGlzcGxheSBzdHJpbmdcbiAgICAgICAgc29ydGVyOiBzb3J0ZXIsICAgICAgICAgLy8gY29tcGFyZSB0d28gYWdncmVnYXRlIHZhbHVlc1xuICAgICAgfSk7XG4gICAgICByZXR1cm4gc3RhdGUuYWdncmVnYXRvcnMubGVuZ3RoIC0gMTtcbiAgICB9LFxuICAgIGdldEFnZ3JlZ2F0b3JzOiBmdW5jdGlvbiBnZXRBZ2dyZWdhdG9ycygpIHtcbiAgICAgIGNvbnN0IGFnZ3JlZ2F0b3JzID0gW107XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHN0YXRlLmFnZ3JlZ2F0b3JzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGFnZ3JlZ2F0b3JzLnB1c2goaSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gYWdncmVnYXRvcnM7XG4gICAgfSxcbiAgICBnZXRBZ2dyZWdhdG9yTmFtZTogZnVuY3Rpb24gZ2V0QWdncmVnYXRvck5hbWUoaWQpIHtcbiAgICAgIHJldHVybiBzdGF0ZS5hZ2dyZWdhdG9yc1tpZCAmIEFDVElWRV9BR0dSRUdBVE9SX01BU0tdLm5hbWU7XG4gICAgfSxcbiAgICBzZXRBY3RpdmVBZ2dyZWdhdG9yczogZnVuY3Rpb24gc2V0QWN0aXZlQWdncmVnYXRvcnMoaWRzKSB7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGlkcy5sZW5ndGg7IGkrKykge1xuICAgICAgICBjb25zdCBpZCA9IGlkc1tpXSAmIEFDVElWRV9BR0dSRUdBVE9SX01BU0s7XG4gICAgICAgIGlmIChpZCA8IDAgfHwgaWQgPiBzdGF0ZS5hZ2dyZWdhdG9ycy5sZW5ndGgpIHtcbiAgICAgICAgICB0aHJvdyAnYWdncmVnYXRvciBpZCAnICsgaWQudG9TdHJpbmcoKSArICcgbm90IHZhbGlkJztcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgc3RhdGUuYWN0aXZlQWdncmVnYXRvcnMgPSBpZHMuc2xpY2UoKTtcbiAgICAgIC8vIE5COiBldmFsdWF0ZSByb290IGhlcmUgYmVjYXVzZSBkaXJ0eSBiaXQgaXMgZm9yIGNoaWxkcmVuXG4gICAgICAvLyBzbyBzb21lb25lIGhhcyB0byBzdGFydCB3aXRoIHJvb3QsIGFuZCBpdCBtaWdodCBhcyB3ZWxsIGJlIHJpZ2h0IGF3YXlcbiAgICAgIGV2YWx1YXRlQWdncmVnYXRlKHN0YXRlLnJvb3QpO1xuICAgICAgbGV0IHNvcnRlciA9IG5vU29ydE9yZGVyO1xuICAgICAgZm9yIChsZXQgaSA9IGlkcy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgICAgICBjb25zdCBhc2NlbmRpbmcgPSAoaWRzW2ldICYgQUNUSVZFX0FHR1JFR0FUT1JfQVNDX0JJVCkgIT09IDA7XG4gICAgICAgIGNvbnN0IGlkID0gaWRzW2ldICYgQUNUSVZFX0FHR1JFR0FUT1JfTUFTSztcbiAgICAgICAgY29uc3QgY29tcGFyZXIgPSBzdGF0ZS5hZ2dyZWdhdG9yc1tpZF0uc29ydGVyO1xuICAgICAgICBjb25zdCBjYXB0dXJlU29ydGVyID0gc29ydGVyO1xuICAgICAgICBjb25zdCBjYXB0dXJlSW5kZXggPSBpO1xuICAgICAgICBzb3J0ZXIgPSBmdW5jdGlvbiAoYSwgYikge1xuICAgICAgICAgIGNvbnN0IGMgPSBjb21wYXJlcihhLmFnZ3JlZ2F0ZXNbY2FwdHVyZUluZGV4XSwgYi5hZ2dyZWdhdGVzW2NhcHR1cmVJbmRleF0pO1xuICAgICAgICAgIGlmIChjID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm4gY2FwdHVyZVNvcnRlcihhLCBiKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIGFzY2VuZGluZyA/IC1jIDogYztcbiAgICAgICAgfTtcbiAgICAgIH1cbiAgICAgIHN0YXRlLnNvcnRlciA9IHNvcnRlcjtcbiAgICAgIHN0YXRlLnJvb3Quc3RhdGUgfD0gTk9ERV9SRU9SREVSX0JJVDtcbiAgICB9LFxuICAgIGdldEFjdGl2ZUFnZ3JlZ2F0b3JzOiBmdW5jdGlvbiBnZXRBY3RpdmVBZ2dyZWdhdG9ycygpIHtcbiAgICAgIHJldHVybiBzdGF0ZS5hY3RpdmVBZ2dyZWdhdG9ycy5zbGljZSgpO1xuICAgIH0sXG4gICAgZ2V0Um93czogZnVuY3Rpb24gZ2V0Um93cyh0b3AsIGhlaWdodCkge1xuICAgICAgY29uc3QgcmVzdWx0ID0gbmV3IEFycmF5KGhlaWdodCk7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGhlaWdodDsgaSsrKSB7XG4gICAgICAgIHJlc3VsdFtpXSA9IG51bGw7XG4gICAgICB9XG4gICAgICBnZXRSb3dzSW1wbChzdGF0ZS5yb290LCB0b3AsIGhlaWdodCwgcmVzdWx0KTtcbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfSxcbiAgICBnZXRSb3dMYWJlbDogZnVuY3Rpb24gZ2V0Um93TGFiZWwocm93KSB7XG4gICAgICByZXR1cm4gcm93LmxhYmVsO1xuICAgIH0sXG4gICAgZ2V0Um93SW5kZW50OiBmdW5jdGlvbiBnZXRSb3dJbmRlbnQocm93KSB7XG4gICAgICByZXR1cm4gcm93LnN0YXRlID4+PiBOT0RFX0lOREVOVF9TSElGVDtcbiAgICB9LFxuICAgIGdldFJvd0FnZ3JlZ2F0ZTogZnVuY3Rpb24gZ2V0Um93QWdncmVnYXRlKHJvdywgaW5kZXgpIHtcbiAgICAgIGNvbnN0IGFnZ3JlZ2F0b3IgPSBzdGF0ZS5hZ2dyZWdhdG9yc1tzdGF0ZS5hY3RpdmVBZ2dyZWdhdG9yc1tpbmRleF1dO1xuICAgICAgcmV0dXJuIGFnZ3JlZ2F0b3IuZm9ybWF0dGVyKHJvdy5hZ2dyZWdhdGVzW2luZGV4XSk7XG4gICAgfSxcbiAgICBnZXRIZWlnaHQ6IGZ1bmN0aW9uIGdldEhlaWdodCgpIHtcbiAgICAgIHJldHVybiBzdGF0ZS5yb290LmhlaWdodDtcbiAgICB9LFxuICAgIGNhbkV4cGFuZDogZnVuY3Rpb24gY2FuRXhwYW5kKHJvdykge1xuICAgICAgcmV0dXJuIChyb3cuc3RhdGUgJiBOT0RFX0VYUEFOREVEX0JJVCkgPT09IDAgJiYgKHJvdy5leHBhbmRlciAhPT0gSU5WQUxJRF9BQ1RJVkVfRVhQQU5ERVIpO1xuICAgIH0sXG4gICAgY2FuQ29udHJhY3Q6IGZ1bmN0aW9uIGNhbkNvbnRyYWN0KHJvdykge1xuICAgICAgcmV0dXJuIChyb3cuc3RhdGUgJiBOT0RFX0VYUEFOREVEX0JJVCkgIT09IDA7XG4gICAgfSxcbiAgICBleHBhbmQ6IGZ1bmN0aW9uIGV4cGFuZChyb3cpIHtcbiAgICAgIGlmICgocm93LnN0YXRlICYgTk9ERV9FWFBBTkRFRF9CSVQpICE9PSAwKSB7XG4gICAgICAgIHRocm93ICdjYW4gbm90IGV4cGFuZCByb3csIGFscmVhZHkgZXhwYW5kZWQnO1xuICAgICAgfVxuICAgICAgaWYgKHJvdy5oZWlnaHQgIT09IDEpIHtcbiAgICAgICAgdGhyb3cgJ3VuZXhwYW5kZWQgcm93IGhhcyBoZWlnaHQgJyArIHJvdy5oZWlnaHQudG9TdHJpbmcoKSArICcgIT0gMSc7XG4gICAgICB9XG4gICAgICBpZiAocm93LmNoaWxkcmVuID09PSBudWxsKSB7ICAvLyBmaXJzdCBleHBhbmQsIGdlbmVyYXRlIGNoaWxkcmVuXG4gICAgICAgIGNvbnN0IGFjdGl2ZUluZGV4ID0gcm93LmV4cGFuZGVyICYgQUNUSVZFX0VYUEFOREVSX01BU0s7XG4gICAgICAgIGxldCBuZXh0QWN0aXZlSW5kZXggPSBhY3RpdmVJbmRleCArIDE7ICAvLyBOQjogaWYgbmV4dCBpcyBzdGFjaywgZnJhbWUgaXMgMFxuICAgICAgICBpZiAobmV4dEFjdGl2ZUluZGV4ID49IHN0YXRlLmFjdGl2ZUV4cGFuZGVycy5sZW5ndGgpIHtcbiAgICAgICAgICBuZXh0QWN0aXZlSW5kZXggPSBJTlZBTElEX0FDVElWRV9FWFBBTkRFUjtcbiAgICAgICAgfVxuICAgICAgICBpZiAoYWN0aXZlSW5kZXggPj0gc3RhdGUuYWN0aXZlRXhwYW5kZXJzLmxlbmd0aCkge1xuICAgICAgICAgIHRocm93ICdpbnZhbGlkIGFjdGl2ZSBleHBhbmRlciBpbmRleCAnICsgYWN0aXZlSW5kZXgudG9TdHJpbmcoKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBleElkID0gc3RhdGUuYWN0aXZlRXhwYW5kZXJzW2FjdGl2ZUluZGV4XTtcbiAgICAgICAgaWYgKGV4SWQgPj0gRklFTERfRVhQQU5ERVJfSURfTUlOICYmXG4gICAgICAgICAgICBleElkIDwgRklFTERfRVhQQU5ERVJfSURfTUlOICsgc3RhdGUuZmllbGRFeHBhbmRlcnMubGVuZ3RoKSB7XG4gICAgICAgICAgY29uc3QgZXhwYW5kZXIgPSBzdGF0ZS5maWVsZEV4cGFuZGVyc1tleElkIC0gRklFTERfRVhQQU5ERVJfSURfTUlOXTtcbiAgICAgICAgICBhZGRDaGlsZHJlbldpdGhGaWVsZEV4cGFuZGVyKHJvdywgZXhwYW5kZXIsIG5leHRBY3RpdmVJbmRleCk7XG4gICAgICAgIH0gZWxzZSBpZiAoZXhJZCA+PSBTVEFDS19FWFBBTkRFUl9JRF9NSU4gJiZcbiAgICAgICAgICAgIGV4SWQgPCBTVEFDS19FWFBBTkRFUl9JRF9NSU4gKyBzdGF0ZS5zdGFja0V4cGFuZGVycy5sZW5ndGgpIHtcbiAgICAgICAgICBjb25zdCBkZXB0aCA9IHJvdy5leHBhbmRlciA+Pj4gQUNUSVZFX0VYUEFOREVSX0ZSQU1FX1NISUZUO1xuICAgICAgICAgIGNvbnN0IGV4cGFuZGVyID0gc3RhdGUuc3RhY2tFeHBhbmRlcnNbZXhJZCAtIFNUQUNLX0VYUEFOREVSX0lEX01JTl07XG4gICAgICAgICAgYWRkQ2hpbGRyZW5XaXRoU3RhY2tFeHBhbmRlcihyb3csIGV4cGFuZGVyLCBhY3RpdmVJbmRleCwgZGVwdGgsIG5leHRBY3RpdmVJbmRleCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhyb3cgJ3N0YXRlLmFjdGl2ZUluZGV4ICcgKyBhY3RpdmVJbmRleC50b1N0cmluZygpXG4gICAgICAgICAgICArICcgaGFzIGludmFsaWQgZXhwYW5kZXInICsgZXhJZC50b1N0cmluZygpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByb3cuc3RhdGUgfD0gTk9ERV9FWFBBTkRFRF9CSVRcbiAgICAgICAgfCBOT0RFX1JFQUdHUkVHQVRFX0JJVCB8IE5PREVfUkVPUkRFUl9CSVQgfCBOT0RFX1JFUE9TSVRJT05fQklUO1xuICAgICAgbGV0IGhlaWdodENoYW5nZSA9IDA7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHJvdy5jaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuICAgICAgICBoZWlnaHRDaGFuZ2UgKz0gcm93LmNoaWxkcmVuW2ldLmhlaWdodDtcbiAgICAgIH1cbiAgICAgIHVwZGF0ZUhlaWdodChyb3csIGhlaWdodENoYW5nZSk7XG4gICAgICAvLyBpZiBjaGlsZHJlbiBvbmx5IGNvbnRhaW5zIG9uZSBub2RlLCB0aGVuIGV4cGFuZCBpdCBhcyB3ZWxsXG4gICAgICBpZiAocm93LmNoaWxkcmVuLmxlbmd0aCA9PT0gMSAmJiB0aGlzLmNhbkV4cGFuZChyb3cuY2hpbGRyZW5bMF0pKSB7XG4gICAgICAgIHRoaXMuZXhwYW5kKHJvdy5jaGlsZHJlblswXSk7XG4gICAgICB9XG4gICAgfSxcbiAgICBjb250cmFjdDogZnVuY3Rpb24gY29udHJhY3Qocm93KSB7XG4gICAgICBjb250cmFjdFJvdyhyb3cpO1xuICAgIH0sXG4gIH07XG59XG4iXX0=
// @generated
