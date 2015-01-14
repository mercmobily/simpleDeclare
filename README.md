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

    console.log( b instanceof A ); // => true

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

The `b` variable is recognised as `instanceof`, as it should.

## Calling the super function with `this.inherited()`

A inherited constructor will often redefine a method; you will often want to run the "super" method that was redefined. SimpleDeclare makes this very possible, offering a very robust implementation of `this.inherited()`:


````Javascript
    var A = declare( null, {

      name: 'A',

      method1: function( parameter ){
        console.log("A::method1() called")
      },

      method2: function( parameter ){
        console.log("A::method2() called")
      },
    })

    var B = declare( A, {

      name: 'B',
 
      method1: function( parameter ){
        console.log("B::method1() called, now calling the 'super' method");
        this.inherited( arguments );
      }
    })

    var b = new B();

    b.method2(); // => B::method2() called

    b.method1();
    /* =>
    B::method1() called, now calling the 'super' method
    A::method1() called
    */
````    

The `this.inherited()` method is available to any object created by a SimpleDeclare constructor. It accepts an array of values, representing the parameters to pass to the super function. Its implementation is very fast (the only CPU-intensive operation is looking for the method itself in the object's own list of prototypes). When ECMA 6, doing this will be trivial.  

## Calling the super function with node-style callback

Calling the super function is just a matter of typing `this.inherited(arguments)`. What if the super function is a node-style async method that accepts a callback as its last parameter? Simple:


````Javascript
  var A = declare( null, {

      name: 'A',

      method1: function( parameter, cb ){
        console.log( "A::method1() called, parameter: ", parameter );
        cb( null, "Returned by A::method1" );
      },

      method2: function( parameter, cb ){
        console.log("A::method2() called, parameter: ", parameter );
        cb( null, "Returned by A::method2" );
      },
    })

    var B = declare( A, {

      name: 'B',
 
      method1: function( parameter, cb ){
        console.log( "B::method1() called with parameter: ", parameter );
        console.log( "Now calling inherited method...");
        this.inheritedAsync( arguments, function( err, res ){

          // Error in the inherited function: propagate err, node style
          if( err ) return cb( err );

          console.log( "Parent function returned:", res );
          cb( null, "Returned by B::method1" );
        });
      }
    })

    var b = new B();

    
    b.method1( 'test parameter', function( err, res ){
      /* =>
      B::method1() called with parameter:  test parameter
      Now calling inherited method...
      A::method1() called, parameter:  test parameter
      Parent function returned: Returned by A::method1
      */

      console.log( "b.method 1 returned:", res );
      /* =>
      b.method 1 returned: Returned by B::method1
      */
    });
````    

`B::method1()` follows Node's callback standards: the last parameter is a callback, which is expected to be called with two parameters: `err` (an Error object if there was an error) and the returned value.

The `this.inheritedAsync()` function accepts two arguments: the `arguments` array, and a new callback. What will actually happen, is that the super method will be called by `inheritedAsync()` with a modified version of `arguments`: a version where the last parameter is changed to the new callback.

This is the easiest possible way to override node-style methods.


## Inheriting from "pure" constructor functions

You can use SimpleDeclare to inherit from constructor functions. In fact, every constructor created with SimpleDeclare is in fact a plain constructor function.

For example:

````Javascript

   var A = declare( null, {

      name: 'A',

      method1: function( parameter ){
        console.log( "A::method1() called, parameter: ", parameter );
        return "Returned by A::method1";
      },
      constructor: function( parameter ){
        console.log( "A's constructor called!" );
      }
    });
    A.classMethod = function(){
      console.log( "This is A's method")
    }

    var B = function(){
      debugger;
      //arguments.callee.prototype.__proto__.constructor.apply( this, arguments );
      A.apply( this, arguments );
      console.log("B's constructor called!");
      

    }
    B.prototype = Object.create( A.prototype, {
      constructor: {
        value: B,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
    B.prototype.name = "B";

    var C = declare( B, {

      name: 'C',

      constructor: function( parameter ){
        console.log( "C's constructor called!" );
      }

    })

    var c = new C();
    /* =>
    A's constructor called!
    B's constructor called!
    C's constructor called!
    */
    c.method1( 10 ); // => A::method1() called, parameter:  10
````

As you can see, everything works 100% fine!
Note that I made sure that `B` behaves like a good citizen, and invokes `A's` constructor. (This happens automatically with SimpleDeclare's constructors, which always invoke the "parent" constructor before invoking their own initialisation function).



## Simple inheritance using `extend()`

## Multiple inheritance

You can easily inherit from multiple constructors:

````Javascript


````

###  SimpleDeclare will only allow to inherit from a constructor once


## Multiple inheritance using `extend()`





## (Not much) Under the hood

SimpleDeclare works with Javascript as much as possible. There is only a small level of trickery used to make things work.

### Attributes to returned constructors

Each constructor has the following attributes:

#### `extend`

This is a function that is attached to each constructor returned. This allows you to write this:

    var A = declare( null, {
      method: function(){
        console.log( "Hello" );
      }
    });

    var B = A.extend( {
      method: function(){
        console.log( "A MUCH BETTER hello!" );
      }
    })

#### `ActualConstructor`

When declaring a constructor, you can pass a `constructor` parameter with initialisation code:

    var A = declare( null, {
      constructor: function(){
        this.something = 10;
      }
    })
    console.log( A.ActualConstructor.toString() );
    /* =>
    function (){
      this.something = 10;
    }
    */

So, `A.ActualConstructor` will have the function passed as `constructor`. When running `a = new A()`, you are actually running a stock function that will 1) Look for, and run, the parent constructor 2) Run `ActualConstructor()`

#### `OriginalConstructor`

When using SimpleDeclare's multiple inheritance features, each constructor is actually cloned and placed in a ad-hoc prototype chain that depends on the second parameter of `declare()`. Each cloned constructor will have an OriginalConstructor attribute. This attrbute is basically never exposed directly (since developers never need direct access to those constructors). However, it's necessary for SimpleDeclare so that 1) Duplication in the prototype chain is avoided properly 2) The `instanceOf()` method can work properly (see below).

### Attributes to returned constructors' prototype (available to objects)

When creating a constructor, a numbe of parameters are made available to the prototpe _if they weren't already available_ (so, unnecessary pollution is avoided).

Here they are.

#### `getInherited()`

Returns the inherited function from the parent prototype, without running it

#### `inherited()`

Runs the inherited function from the parent prototype

#### `inheritedAsync()`

Runs the inherited function from the parent prototype (asynchronous fashion)

#### `instanceOf( Ctor )`

Checks if the current object is anywhere in Ctor's prototype chain. NOTE: to determine descendance, it checks the prototype chain also checking for OriginalConstructor in each case, so that checking on mixin works properly. 
