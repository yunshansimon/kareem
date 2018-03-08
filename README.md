# kareem

  [![Build Status](https://travis-ci.org/vkarpov15/kareem.svg?branch=master)](https://travis-ci.org/vkarpov15/kareem)
  [![Coverage Status](https://img.shields.io/coveralls/vkarpov15/kareem.svg)](https://coveralls.io/r/vkarpov15/kareem)

Re-imagined take on the [hooks](http://npmjs.org/package/hooks) module, meant to offer additional flexibility in allowing you to execute hooks whenever necessary, as opposed to simply wrapping a single function.

Named for the NBA's all-time leading scorer Kareem Abdul-Jabbar, known for his mastery of the [hook shot](http://en.wikipedia.org/wiki/Kareem_Abdul-Jabbar#Skyhook)

<img src="http://upload.wikimedia.org/wikipedia/commons/0/00/Kareem-Abdul-Jabbar_Lipofsky.jpg" width="220">

# API

## pre hooks

Much like [hooks](https://npmjs.org/package/hooks), kareem lets you define
pre and post hooks: pre hooks are called before a given function executes.
Unlike hooks, kareem stores hooks and other internal state in a separate
object, rather than relying on inheritance. Furthermore, kareem exposes
an `execPre()` function that allows you to execute your pre hooks when
appropriate, giving you more fine-grained control over your function hooks.


#### It runs without any hooks specified

```javascript

    hooks.execPre('cook', null, function() {
      done();
    });

```

#### It runs basic serial pre hooks

pre hook functions take one parameter, a "done" function that you execute
when your pre hook is finished.


```javascript

    var count = 0;

    hooks.pre('cook', function(done) {
      ++count;
      done();
    });

    hooks.execPre('cook', null, function() {
      assert.equal(1, count);
      done();
    });

```

#### It can run multipe pre hooks

```javascript

    var count1 = 0;
    var count2 = 0;

    hooks.pre('cook', function(done) {
      ++count1;
      done();
    });

    hooks.pre('cook', function(done) {
      ++count2;
      done();
    });

    hooks.execPre('cook', null, function() {
      assert.equal(1, count1);
      assert.equal(1, count2);
      done();
    });

```

#### It can run fully synchronous pre hooks

If your pre hook function takes no parameters, its assumed to be
fully synchronous.


```javascript

    var count1 = 0;
    var count2 = 0;

    hooks.pre('cook', function() {
      ++count1;
    });

    hooks.pre('cook', function() {
      ++count2;
    });

    hooks.execPre('cook', null, function(error) {
      assert.equal(null, error);
      assert.equal(1, count1);
      assert.equal(1, count2);
      done();
    });

```

#### It properly attaches context to pre hooks

Pre save hook functions are bound to the second parameter to `execPre()`


```javascript

    hooks.pre('cook', function(done) {
      this.bacon = 3;
      done();
    });

    hooks.pre('cook', function(done) {
      this.eggs = 4;
      done();
    });

    var obj = { bacon: 0, eggs: 0 };

    // In the pre hooks, `this` will refer to `obj`
    hooks.execPre('cook', obj, function(error) {
      assert.equal(null, error);
      assert.equal(3, obj.bacon);
      assert.equal(4, obj.eggs);
      done();
    });

```

#### It can execute parallel (async) pre hooks

Like the hooks module, you can declare "async" pre hooks - these take two
parameters, the functions `next()` and `done()`. `next()` passes control to
the next pre hook, but the underlying function won't be called until all
async pre hooks have called `done()`.


```javascript

    hooks.pre('cook', true, function(next, done) {
      this.bacon = 3;
      next();
      setTimeout(function() {
        done();
      }, 5);
    });

    hooks.pre('cook', true, function(next, done) {
      next();
      var _this = this;
      setTimeout(function() {
        _this.eggs = 4;
        done();
      }, 10);
    });

    hooks.pre('cook', function(next) {
      this.waffles = false;
      next();
    });

    var obj = { bacon: 0, eggs: 0 };

    hooks.execPre('cook', obj, function() {
      assert.equal(3, obj.bacon);
      assert.equal(4, obj.eggs);
      assert.equal(false, obj.waffles);
      done();
    });

```

#### It supports returning a promise

You can also return a promise from your pre hooks instead of calling
`next()`. When the returned promise resolves, kareem will kick off the
next middleware.


```javascript

    hooks.pre('cook', function() {
      return new Promise(resolve => {
        setTimeout(() => {
          this.bacon = 3;
          resolve();
        }, 100);
      });
    });

    var obj = { bacon: 0 };

    hooks.execPre('cook', obj, function() {
      assert.equal(3, obj.bacon);
      done();
    });

```

## post hooks

#### It runs without any hooks specified

```javascript

    hooks.execPost('cook', null, [1], function(error, eggs) {
      assert.ifError(error);
      assert.equal(1, eggs);
      done();
    });

```

#### It executes with parameters passed in

```javascript

    hooks.post('cook', function(eggs, bacon, callback) {
      assert.equal(1, eggs);
      assert.equal(2, bacon);
      callback();
    });

    hooks.execPost('cook', null, [1, 2], function(error, eggs, bacon) {
      assert.ifError(error);
      assert.equal(1, eggs);
      assert.equal(2, bacon);
      done();
    });

```

#### It can use synchronous post hooks

```javascript

    var execed = {};

    hooks.post('cook', function(eggs, bacon) {
      execed.first = true;
      assert.equal(1, eggs);
      assert.equal(2, bacon);
    });

    hooks.post('cook', function(eggs, bacon, callback) {
      execed.second = true;
      assert.equal(1, eggs);
      assert.equal(2, bacon);
      callback();
    });

    hooks.execPost('cook', null, [1, 2], function(error, eggs, bacon) {
      assert.ifError(error);
      assert.equal(2, Object.keys(execed).length);
      assert.ok(execed.first);
      assert.ok(execed.second);
      assert.equal(1, eggs);
      assert.equal(2, bacon);
      done();
    });

```

## wrap()

#### It wraps pre and post calls into one call

```javascript

    hooks.pre('cook', true, function(next, done) {
      this.bacon = 3;
      next();
      setTimeout(function() {
        done();
      }, 5);
    });

    hooks.pre('cook', true, function(next, done) {
      next();
      var _this = this;
      setTimeout(function() {
        _this.eggs = 4;
        done();
      }, 10);
    });

    hooks.pre('cook', function(next) {
      this.waffles = false;
      next();
    });

    hooks.post('cook', function(obj) {
      obj.tofu = 'no';
    });

    var obj = { bacon: 0, eggs: 0 };

    var args = [obj];
    args.push(function(error, result) {
      assert.ifError(error);
      assert.equal(null, error);
      assert.equal(3, obj.bacon);
      assert.equal(4, obj.eggs);
      assert.equal(false, obj.waffles);
      assert.equal('no', obj.tofu);

      assert.equal(obj, result);
      done();
    });

    hooks.wrap(
      'cook',
      function(o, callback) {
        assert.equal(3, obj.bacon);
        assert.equal(4, obj.eggs);
        assert.equal(false, obj.waffles);
        assert.equal(undefined, obj.tofu);
        callback(null, o);
      },
      obj,
      args);

```

## createWrapper()

#### It wraps wrap() into a callable function

```javascript

    hooks.pre('cook', true, function(next, done) {
      this.bacon = 3;
      next();
      setTimeout(function() {
        done();
      }, 5);
    });

    hooks.pre('cook', true, function(next, done) {
      next();
      var _this = this;
      setTimeout(function() {
        _this.eggs = 4;
        done();
      }, 10);
    });

    hooks.pre('cook', function(next) {
      this.waffles = false;
      next();
    });

    hooks.post('cook', function(obj) {
      obj.tofu = 'no';
    });

    var obj = { bacon: 0, eggs: 0 };

    var cook = hooks.createWrapper(
      'cook',
      function(o, callback) {
        assert.equal(3, obj.bacon);
        assert.equal(4, obj.eggs);
        assert.equal(false, obj.waffles);
        assert.equal(undefined, obj.tofu);
        callback(null, o);
      },
      obj);

    cook(obj, function(error, result) {
      assert.ifError(error);
      assert.equal(3, obj.bacon);
      assert.equal(4, obj.eggs);
      assert.equal(false, obj.waffles);
      assert.equal('no', obj.tofu);

      assert.equal(obj, result);
      done();
    });

```

## clone()

#### It clones a Kareem object

```javascript

    var k1 = new Kareem();
    k1.pre('cook', function() {});
    k1.post('cook', function() {});

    var k2 = k1.clone();
    assert.deepEqual(['cook'], Object.keys(k2._pres));
    assert.deepEqual(['cook'], Object.keys(k2._posts));

```

## merge()

#### It pulls hooks from another Kareem object

```javascript

    var k1 = new Kareem();
    var test1 = function() {};
    k1.pre('cook', test1);
    k1.post('cook', function() {});

    var k2 = new Kareem();
    var test2 = function() {};
    k2.pre('cook', test2);
    var k3 = k2.merge(k1);
    assert.equal(k3._pres['cook'].length, 2);
    assert.equal(k3._pres['cook'][0].fn, test2);
    assert.equal(k3._pres['cook'][1].fn, test1);
    assert.equal(k3._posts['cook'].length, 1);

```

# Works with Promise/async function

## Wrap an async function:

```javascript
  var calledPre = 0;
  var calledFn = 0;
  var calledPost = 0;
  hooks.pre('cook', async(done)=>++calledPre && done());
  hooks.post('cook', async(callback)=>++calledPost);
  var wrapper = hooks.createWrapper('cook', async function(){ ++calledFn});
  await wrapper();
  assert.equal(calledPre, 1);
  assert.equal(calledFn, 1);
  assert.equal(calledPost, 1);
```

## Wrap a function which returns a promise

#### Set options.asyncFunc = true;
#### Set options.forceWrap = ture, to fore wrap the function for bonding the pre/post hooks later.

```javascript
    var calledPre = 0;
    var calledFn = 0;
    var calledPost = 0;
    var wrapper = hooks.createWrapper('cook',
      function(a,b){return new Promise((resolve, rejece)=>{
        ++calledFn;
        b.a++;
        resolve([++a, b]);
      })},
      null,
      {
        forceWrap:true,  // wrap the function before setting hooks.
        asyncFunc:true   //tell the wrapper the function will return a promise.
      }
    );
    hooks.pre('cook', async(done)=>++calledPre && done());
    hooks.post('cook', async(result)=>{
      ++calledPost;
      assert.equal(result[0], 2);
      assert.equal(result[1].a, 3);
    });
    await wrapper(1,{a:2});
    assert.equal(calledPre, 1);
    assert.equal(calledFn, 1);
    assert.equal(calledPost, 1);

```

## ShortCut by pre-hooks

Sometime the pre-hook got the result(by cache), and need to terminate the
wrapped function and return the result.

#### send the result to done() function

```javascript
    var calledPre = 0;
    var calledFn = 0;
    var calledPost = 0;
    hooks.pre('cook', async(done, id)=>{
      assert.equal(1, id);
      calledPre++;
      done(null, 2);  //short-cut and return 2;
    });
    hooks.post('cook', async(result)=>{
      assert.ok(false);
      calledPost++;
    });
    var wrapper = hooks.createWrapper('cook', async function(id){
      calledFn++;
      return ++id;
    });
    var result = await wrapper(1);
    assert.equal(result, 2); //got the right result by pre-hooks.
    assert.equal(calledPre, 1);
    assert.equal(calledFn, 0); //the wrapped function never run.
    assert.equal(calledPost, 0);
  })
```