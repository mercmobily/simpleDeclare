simpleDeclare
=============

SimpleDeclare is the Nirvana of OOP implementation in Javascript, working _with_ Javascript rather than against it. Highlights:

* Works with Javascript, as close to the metal as possible, with possibility to inherit from normal Javascript constructors
* Single inheritance and multiple inheritance (via Mixins)
* Strong implementation of `this.inherited()` (works the same way ECMA6 will eventually give us)
* Easy calling of asyncronous super methods with `this.inheritedAsync()`
* Automatic execution of all constructors in the right order
* Automatic inheritance of class-wide methods (they are copied over)
* `extend()` method available to extend specific constructors 
* Minimum amounts of meta-data, none of which is strictly necessary
* Fully unit-tested and currently used as the foundation in [Hotplate](https://github.com/mercmobily/hotplate) as most of Hotplate's foundation modules.

# Guide

## Simple inheritance from Object

````Javascript
    var A = declare( null, {
      method1: function( parameter ){
        console.log("A::method1() called!")
      },
    })

    var a = new A();

    console.log( A.prototype ); 
    /* =>
    { method1: [Function],
      inherited: [Function],
      inheritedAsync: [Function],
      instanceOf: [Function] }
    */

    a.method1(); // => A::method1() called!
    console.log( a.__proto__ === A.prototype ); // => true
    console.log( A.extend ); // => [Function]
````

This is the simplest way to create a constructor function: the first parameter, `null`, tells SimpleDeclare that you are inheriting from `Object()`. The second parameter contains the methods that will be added to the constructor's prototype.
You can ee that A's prototype also contains extra methods: `inherited()` and `inheritedAsync()` (which will call `method1()` of the parent) and `instanceOf()` (which checks if an object is the instance of a constructor, _including mixins_ -- more about this later).


## Simple inheritance from Object with initialisation function

````Javascript
    var A = declare( null, {
      constructor: function( p ){
        console.log("A's constructor called with parameter: " + p )
      },

      method1: function( parameter ){
        console.log("A::method1() called!")
      },
    })

    var a = new A( 10 ); // => A's constructor called with parameter: 10
    a.method1(); // => A::method1() called!
````

Here, a `constructor` attribute is passed: it will be called every time a new instance of A() is created. This is very handy to add initialisation code to your constructors.

## Simple inheritance from another constructor

````Javascript
    var A = declare( null, {

      name: 'A',

      constructor: function( p ){
        console.log("A's constructor called with parameter: " + p )
      },
 
      method1: function( parameter ){
        console.log("A::method1() called")
      },

      method2: function( parameter ){
        console.log("A::method2() called")
      },
    })

    var B = declare( A, {

      name: 'B',

      constructor: function( p ){
        console.log("B's constructor called with parameter: " + p )
      },
 
      method1: function( parameter ){
        console.log("B::method2() called");
      }
    })

    var a = new A( 10 ); // => A's constructor called with parameter: 10
    a.method1(); // => A::method1() called
    a.method2(); // => A::method2() called

    var b = new B( 11 );
    /* =>
    B's constructor called with parameter: 11
    A's constructor called with parameter: 11
    */

    b.method1(); // => B::method1() called

    console.log( a.__proto__ );
    /* =>
    { name: 'A',
      method1: [Function],
      method2: [Function],
      inherited: [Function],
      inheritedAsync: [Function],
      instanceOf: [Function] }
    */
    console.log( a.__proto__.__proto__ ); // => {}
    console.log( a.__proto__.__proto__.constructor === Object ); // true

    console.log( b.__proto__ ); // => { name: 'B', method1: [Function] }
    console.log( b.__proto__.__proto__ );
    /* =>
    { name: 'A',
      method1: [Function],
      method2: [Function],
      inherited: [Function],
      inheritedAsync: [Function],
      instanceOf: [Function] }
    */
    console.log( b.__proto__.__proto__.constructor === A ); // => true
    console.log( b.__proto__.__proto__.__proto__ ); // => {}
    console.log( b.__proto__.__proto__.__proto__.constructor === Object ); // => true 
````

Note that the attribute `name` is only here so that you can clearly recognise which prototype you're looking at. It has no special meaning for SimpleDeclare itself.

Also note that when running `new B()`, _both_ constructors are run, in the right order. This means that when you define a constructor with simpleDeclare you can rest assured that _every_ initialisation function passed as `constructor` will actually be run (with the parameters passed to B() ).


TO DOCUMENT:

* this.inherited()
* this.inheritedAsync()
* Simple inheritance with classic Functions (mention calling parent constructor)
* Simple inheritance using extend()
* Multiple inheritance (explain that anything after 1st if a mixin, `instanceOf()` )
* Multiple inheritance using extend()

## Simple inheritance from normal Javascript objects

````Javascript
  var A = function(){
    console.log("This is A's constructor!")
  }
  A.prototype.method1 = function(){
    console.log("method1() defined the good old Javascript way")
  }
````

# DOCUMENTATION REWRITE ENDS HERE


````Javascript
````

````Javascript
````

````Javascript
````

