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

function stringInterner(){// eslint-disable-line no-unused-vars
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

function stackData(stackIdMap,maxDepth){// eslint-disable-line no-unused-vars
return{
maxDepth:maxDepth,
get:function getStack(id){
return stackIdMap[id];
}};

}

function stackRegistry(interner){// eslint-disable-line no-unused-vars
return{
root:{id:0},
nodeCount:1,
insert:function insertNode(parent,label){
var labelId=interner.intern(label);
var node=parent[labelId];
if(node===undefined){
node={id:this.nodeCount};
this.nodeCount++;
parent[labelId]=node;
}
return node;
},
flatten:function flattenStacks(){
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

return new stackData(stackIdMap,maxStackDepth);
}};

}

function aggrow(strings,stacks,numRows){// eslint-disable-line no-unused-vars
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

function calleeFrameGetter(stack,depth){
return stack[depth];
}

function callerFrameGetter(stack,depth){
return stack[stack.length-depth-1];
}

function createStackComparers(stackGetter,frameGetter){
var comparers=new Array(stacks.maxDepth);var _loop=function _loop(
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
return frameGetter(a,captureDepth)-frameGetter(b,captureDepth);
};};for(var depth=0;depth<stacks.maxDepth;depth++){_loop(depth);
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
for(var _i=0;_i<children.length;_i++){
evaluateAggregate(children[_i]);
}
row.state|=NODE_REORDER_BIT;
}
row.state^=NODE_REAGGREGATE_BIT;
}

function evaluateOrder(row){
if((row.state&NODE_EXPANDED_BIT)!==0){
var children=row.children;
for(var _i2=0;_i2<children.length;_i2++){
var child=children[_i2];
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
for(var _i3=0;_i3<children.length;_i3++){
var child=children[_i3];
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
for(var _i4=0;_i4<children.length;_i4++){
var child=children[_i4];
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
if(frameGetter(beginStack,depth)!==frameGetter(endStack,depth)){
row.children.push(createTreeNode(
row,
columnName+strings.get(frameGetter(beginStack,depth)),
rowIndices.subarray(begin,end),
expandNextFrame));
begin=end;
beginStack=endStack;
}
end++;
}
row.children.push(createTreeNode(
row,
columnName+strings.get(frameGetter(beginStack,depth)),
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
for(var _i5=0;_i5<children.length;_i5++){
var child=children[_i5];
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
addCalleeStackExpander:function addCalleeStackExpander(name,stackGetter){
if(STACK_EXPANDER_ID_MIN+state.fieldExpanders.length>=STACK_EXPANDER_ID_MAX){
throw'too many stack expanders!';
}
state.stackExpanders.push({
name:name,// name for column
stackGetter:stackGetter,// row index -> stack array
comparers:createStackComparers(stackGetter,calleeFrameGetter),// depth -> comparer
frameGetter:calleeFrameGetter});

return STACK_EXPANDER_ID_MIN+state.stackExpanders.length-1;
},
addCallerStackExpander:function addCallerStackExpander(name,stackGetter){
if(STACK_EXPANDER_ID_MIN+state.fieldExpanders.length>=STACK_EXPANDER_ID_MAX){
throw'too many stack expanders!';
}
state.stackExpanders.push({
name:name,
stackGetter:stackGetter,
comparers:createStackComparers(stackGetter,callerFrameGetter),
frameGetter:callerFrameGetter});

return STACK_EXPANDER_ID_MIN+state.stackExpanders.length-1;
},
getExpanders:function getExpanders(){
var expanders=[];
for(var _i6=0;_i6<state.fieldExpanders.length;_i6++){
expanders.push(FIELD_EXPANDER_ID_MIN+_i6);
}
for(var _i7=0;_i7<state.stackExpanders.length;_i7++){
expanders.push(STACK_EXPANDER_ID_MIN+_i7);
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
for(var _i8=0;_i8<ids.length;_i8++){
var id=ids[_i8];
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
for(var _i9=0;_i9<ids.length;_i9++){
if(state.activeExpanders.length<=_i9){
pruneExpanders(state.root,INVALID_ACTIVE_EXPANDER,_i9);
break;
}else if(ids[_i9]!==state.activeExpanders[_i9]){
pruneExpanders(state.root,_i9,_i9);
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
for(var _i10=0;_i10<state.aggregators.length;_i10++){
aggregators.push(_i10);
}
return aggregators;
},
getAggregatorName:function getAggregatorName(id){
return state.aggregators[id&ACTIVE_AGGREGATOR_MASK].name;
},
setActiveAggregators:function setActiveAggregators(ids){
for(var _i11=0;_i11<ids.length;_i11++){
var id=ids[_i11]&ACTIVE_AGGREGATOR_MASK;
if(id<0||id>state.aggregators.length){
throw'aggregator id '+id.toString()+' not valid';
}
}
state.activeAggregators=ids.slice();
// NB: evaluate root here because dirty bit is for children
// so someone has to start with root, and it might as well be right away
evaluateAggregate(state.root);
var sorter=noSortOrder;var _loop2=function _loop2(
_i12){
var ascending=(ids[_i12]&ACTIVE_AGGREGATOR_ASC_BIT)!==0;
var id=ids[_i12]&ACTIVE_AGGREGATOR_MASK;
var comparer=state.aggregators[id].sorter;
var captureSorter=sorter;
var captureIndex=_i12;
sorter=function sorter(a,b){
var c=comparer(a.aggregates[captureIndex],b.aggregates[captureIndex]);
if(c===0){
return captureSorter(a,b);
}
return ascending?-c:c;
};};for(var _i12=ids.length-1;_i12>=0;_i12--){_loop2(_i12);
}
state.sorter=sorter;
state.root.state|=NODE_REORDER_BIT;
},
getActiveAggregators:function getActiveAggregators(){
return state.activeAggregators.slice();
},
getRows:function getRows(top,height){
var result=new Array(height);
for(var _i13=0;_i13<height;_i13++){
result[_i13]=null;
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
for(var _i14=0;_i14<row.children.length;_i14++){
heightChange+=row.children[_i14].height;
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

}// @generated
