import assert from 'node:assert/strict';
import test from 'node:test';
const hooks=new Map(),keybindings=[];
globalThis.Hooks={once(event,fn){hooks.set(event,fn);},on(event,fn){hooks.set(event,fn);}};
const settings=new Map();let readyCalls=0;
globalThis.foundry={applications:{api:{DialogV2:{},ApplicationV2:class {render(){return this;}}}},utils:{randomID:()=>"mockrequest123456"}};
globalThis.game={settings:{register(ns,k,opt){settings.set(k,opt.default);},registerMenu(){},get(ns,k){return settings.get(k);},set(ns,k,val){settings.set(k,val);return Promise.resolve(val);}},user:{id:'gm',isGM:true},users:{activeGM:{id:'gm'}},combat:null,modules:new Map([['averis-bound-system',{}]]),keybindings:{register(ns,id,opt){keybindings.push(id);}},socket:{on(){readyCalls++;}},system:{id:'dnd5e'}};
globalThis.canvas={scene:null,tokens:{placeables:[],controlled:[]}};
globalThis.ui={notifications:{warn(){},info(){},error(){}}};
await import('../scripts/main.js');
test('v14 module bootstrap registers settings, macros, hotkey, UI hooks, and 60 rules',()=>{
 assert.ok(hooks.has('init'));assert.ok(hooks.has('ready'));hooks.get('init')();hooks.get('ready')();
 assert.equal(readyCalls,1);assert.ok(keybindings.includes('open'));
 assert.equal(settings.get('xpPerBound'),15);assert.equal(settings.get('cooldownRounds'),3);
 const api=game.modules.get('averis-bound-system').api;assert.equal(api.getVariants().length,60);
 assert.equal(api.getProgress({getFlag(){return undefined;}}).level,1);
 assert.ok(hooks.has('getHeaderControlsApplicationV2'));assert.ok(hooks.has('renderApplicationV2'));
});