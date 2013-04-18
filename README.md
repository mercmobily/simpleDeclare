simpleDeclare
=============

This is a super-simplified implementation of `declare()`, which will help you create Javascript classes^H^H^H^H^H^Hconstructor functions while keeping you code neat.


Here is a code snipset that shows 100% of its features:

    var BaseClass = declare( null, {

      constructor: function( options){
        this.options = options;

        if( this.options.something ){
          this.water = true;
          this.fire = true;
        }
      },

      assignA: function(a){
        this.a = a;
      },
    });
    BaseClass.classMethod = function(){ console.log("Class method"); }


    var DerivedClass = declare( BaseClass, {

      constructor: function( options ){
        if( options.fancy ){
          this.fancy = true;
        }
      },  

      assignA: function(a){
        this.inherited( arguments );
        this.a ++;
      },

      assignB: function(b){
        this.b = b;
      },

    });

    // typeof( DerivedClass.classMethod ) => function

* Only single inheritance is supported. However, Mixins ARE supported

* The function `this.inherited( arguments )` will call the constructor of the first matching class going up the chain, even if its direct parent doesn't implement that method. So, if class `A` defines `m()`, and class `B` inherits from `A`, and class `C` inherits from `B`, then `C` can call `this.inherited(arguments)` in `m()` and expect `A`'s `m()` to be called even if `B` doesn't implement `m()` at all. (You may need to read this sentence a couple of times before it makes perfect sense)

* You can inherit from "normal" classes not defined by `declare()`.

* Class methods are copied over from the parent to the child class. Parent methods are callable via `DerivedClass._super()`.

# Multiple inheritance

Simpledeclare does NOT support multiple inheritace. However, it _does_ support "mixins".

So, for example:

    var Mixin1 = {
      constructor: function(){
        console.log(" Mixin1 constructor!");
      },
      c: 30
    };

     var Mixin2 = {
      constructor: function(){
        console.log(" Mixin2 constructor!");
      },
      d: 40
    };

    var SimpleMixedClass = declare.mixin( DerivedClass, Mixin1 ] ); // Mixin with Mixin1
    var MultiMixedClass = declare.mixin( DerivedClass, [ Mixin1, Mixin2 ] ); // Mixin with both

The returned class from Mixins will be a functional class "enriched" by the mixed in values. Constructors will be honoured (in the right order); you can also use `this.inherited(arguments)` in mixin objects.

Note that the Mixin objects are not classes: they are simple objects.

Internally, the Mixin function uses `declare()`, once for each mixed in object.


# The problem it solves - little read for skeptics

Node.js provides a very basic function to implement classes that inherit from others: `util.inherits()`. This is hardly enough: code often ends up looking like this:

    function BaseClass( options ){
      this.options = options;
    
      if( this.options.something ){
        this.water = true;
        this.fire = true;
      }
    }
    
    BaseClass.prototype.assignA = function(a){
      this.a = a;
    }
    
    function DerivedClass( options ){
    
      // Call the base class' constructor
      BaseClass.call( this, options );
    
      if( options.fancy ){
        this.fancy = true;
      }
    }
    
    util.inherits( DerivedClass, BaseClass );
    
    DerivedClass.prototype.assignA = function(a){
      BaseClass.prototype.assignA.call( this, a);
      this.a ++;
    }
    
    DerivedClass.prototype.assignB = function(b){
      this.b = b;
    }

My problems with this code:

* It's unreadable. It's not clear, by reading it, what is what. It's easy enough here, but try to look at this code where there are several prototype functions and several inherited objects...

* The order in which you call `util.inherits()` matters -- a lot. You must remember to call it _before_ you define any custom prototypes

* Defining the prototype one by one by hand like that is hardly ideal

* You need to call the superclass' constructor by hand, manually

* If you want to call a parent's method from a child's method, you need to do so manually. If your parent doesn't implement that method, but the parent's parents do, you are out of luck.

The equivalent to the code above, which is also the example code provided, is:


    var BaseClass = declare( null, {

      constructor: function( options){
        this.options = options;

        if( this.options.something ){
          this.water = true;
          this.fire = true;
        }
      },

      assignA: function(a){
        this.a = a;
      },
    });


    var DerivedClass = declare( BaseClass, {

      constructor: function( options ){
        if( options.fancy ){
          this.fancy = true;
        }
      },  

      assignA: function(a){
        this.inherited( arguments );
        this.a ++;
      },

      assignB: function(b){
        this.b = b;
      },

    });


Can you see the improvement? If so, you should use `simpleDeclare()`!


