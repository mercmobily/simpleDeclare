var declare = require('simpledeclare');


var A = declare( null, { 
  one: 1,
  two: 2,
  func: function(){ console.log("A's func() called!") },
  constructor: function(){ console.log("A's constructor!");} 
});
var a = new A();
console.log( '\nDOING A');
console.log( a.one );
console.log( a.two );
a.func();


var B = declare( A, { 
  three: 3,
  func: function(){ console.log("B's func() called!");
  this.inherited(arguments); },
  constructor: function(){ console.log("B's constructor!"); } 
});
var b = new B();
console.log( '\nDOING B');
console.log( b );
console.log( b.one );
console.log( b.two );
console.log( b.three );
b.func();

var Mixin1 = { 
  one: 'ONE', 
  four: '4', 
  func: function(){ console.log("MIXIN1's func() called!"); this.inherited(arguments); },
  constructor: function(){ console.log("Mixin1's constructor!"); } 
};

C = declare.mixin( B, Mixin1 );
console.log( '\nDOING C');
var c = new C();
console.log( c );
console.log( c.one );
console.log( c.two );
console.log( c.three );
console.log( c.four );
c.func();

var Mixin2 = { 
  one: 'ONE-BIS', 
  five: '5', 
  func: function(){ console.log("MIXIN2's func() called!"); this.inherited(arguments); },
  constructor: function(){ console.log("Mixin2's constructor!"); } 
};


//D = declare.mixin( B, Mixin1 );
//D = declare.mixin( D, Mixin2 );
D = declare.mixin( B, [ Mixin1, Mixin2 ] );

console.log( '\nDOING D');
var d = new D();
console.log( d );
console.log( d.one );
console.log( d.two );
console.log( d.three );
console.log( d.four );
d.func();



