import test from 'node:test';
import assert from 'node:assert/strict';
import {tokenReachFeet} from '../scripts/geometry.mjs';
const size=100,cell=5;
const token=(x,y,width=1,height=1)=>({document:{x:x*size,y:y*size,width,height},w:width*size,h:height*size});
const square={isSquare:true,getOffsetRange:({x,y,width,height})=>[Math.floor(x/size),Math.floor(y/size),Math.ceil((x+width)/size),Math.ceil((y+height)/size)],getCenterPoint:({i,j})=>({x:(i+.5)*size,y:(j+.5)*size}),measurePath:([a,b])=>({distance:Math.hypot(a.x-b.x,a.y-b.y)/size*cell})};
test('diagonal melee is 5ft (old center measurement incorrectly returned 7.07ft)',()=>{
 assert.equal(tokenReachFeet(token(0,0),token(1,1),square,size,cell),5);
 assert.equal(tokenReachFeet(token(0,0),token(1,0),square,size,cell),5);
 assert.equal(tokenReachFeet(token(0,0),token(0,1),square,size,cell),5);
});
test('both heroes diagonally and horizontally adjacent to the same target can reach it',()=>{
 const target=token(1,1),a=token(0,0),b=token(2,1);
 assert.equal(tokenReachFeet(a,target,square,size,cell),5);
 assert.equal(tokenReachFeet(b,target,square,size,cell),5);
});
test('5-foot reach is still enforced when not adjacent',()=>{
 assert.equal(tokenReachFeet(token(0,0),token(2,0),square,size,cell),10);
 assert.equal(tokenReachFeet(token(0,0),token(2,2),square,size,cell),Math.hypot(200,200)/100*5);
});
test('larger targets calculate nearest occupied cells instead of distant centers',()=>{
 assert.equal(tokenReachFeet(token(0,0,2,2),token(2,1),square,size,cell),5);
 assert.equal(tokenReachFeet(token(0,0),token(1,0,3,3),square,size,cell),5);
 assert.equal(tokenReachFeet(token(0,0,2,2),token(3,1),square,size,cell),10);
});
test('scene units and 10-foot grids are respected',()=>{
 assert.equal(tokenReachFeet(token(0,0),token(1,1),square,size,10),10);
});
test('gridless uses bounds, non-square defers to Foundry native measurement',()=>{
 const gridless={isGridless:true,isSquare:false};
 assert.equal(tokenReachFeet(token(0,0),token(1,1),gridless,size,cell),0);
 assert.equal(tokenReachFeet(token(0,0),token(2,0),gridless,size,cell),5);
 const hex={isSquare:false,isHexagonal:true,measurePath:()=>({distance:42})};
 assert.equal(tokenReachFeet(token(0,0),token(1,1),hex,size,cell),42);
});
test('missing position, missing grid scale and invalid token sizes fail closed',()=>{
 assert.equal(tokenReachFeet(null,token(1,1),square,size,cell),Infinity);
 assert.equal(tokenReachFeet(token(0,0),token(1,1),square,0,cell),Infinity);
 assert.equal(tokenReachFeet({document:{x:0,y:0,width:0,height:0}},token(1,1),square,size,cell),Infinity);
});