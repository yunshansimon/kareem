var assert = require('assert');
var Kareem = require('../');

describe('wrap()', function() {
  var hooks;

  beforeEach(function() {
    hooks = new Kareem();
  });

  it('handles pre errors', function(done) {
    hooks.pre('cook', function(done) {
      done('error!');
    });

    hooks.post('cook', function(obj) {
      obj.tofu = 'no';
    });

    var obj = { bacon: 0, eggs: 0 };

    var args = [obj];
    args.push(function(error, result) {
      assert.equal('error!', error);
      assert.ok(!result);
      assert.equal(undefined, obj.tofu);
      done();
    });

    hooks.wrap(
      'cook',
      function(o, callback) {
        // Should never get called
        assert.ok(false);
        callback(null, o);
      },
      obj,
      args);
  });

  it('handles pre errors when no callback defined', function(done) {
    hooks.pre('cook', function(done) {
      done('error!');
    });

    hooks.post('cook', function(obj) {
      obj.tofu = 'no';
    });

    var obj = { bacon: 0, eggs: 0 };

    var args = [obj];

    hooks.wrap(
      'cook',
      function(o, callback) {
        // Should never get called
        assert.ok(false);
        callback(null, o);
      },
      obj,
      args);

    setTimeout(
      function() {
        done();
      },
      25);
  });

  it('handles errors in wrapped function', function(done) {
    hooks.pre('cook', function(done) {
      done();
    });

    hooks.post('cook', function(obj) {
      obj.tofu = 'no';
    });

    var obj = { bacon: 0, eggs: 0 };

    var args = [obj];
    args.push(function(error, result) {
      assert.equal('error!', error);
      assert.ok(!result);
      assert.equal(undefined, obj.tofu);
      done();
    });

    hooks.wrap(
      'cook',
      function(o, callback) {
        callback('error!');
      },
      obj,
      args);
  });

  it('handles errors in post', function(done) {
    hooks.pre('cook', function(done) {
      done();
    });

    hooks.post('cook', function(obj, callback) {
      obj.tofu = 'no';
      callback('error!');
    });

    var obj = { bacon: 0, eggs: 0 };

    var args = [obj];
    args.push(function(error, result) {
      assert.equal('error!', error);
      assert.ok(!result);
      assert.equal('no', obj.tofu);
      done();
    });

    hooks.wrap(
      'cook',
      function(o, callback) {
        callback(null, o);
      },
      obj,
      args);
  });

  it('defers errors to post hooks if enabled', function(done) {
    hooks.pre('cook', function(done) {
      done(new Error('fail'));
    });

    hooks.post('cook', function(error, res, callback) {
      callback(new Error('another error occurred'));
    });

    var args = [];
    args.push(function(error) {
      assert.equal(error.message, 'another error occurred');
      done();
    });

    hooks.wrap(
      'cook',
      function(callback) {
        assert.ok(false);
        callback();
      },
      null,
      args,
      { useErrorHandlers: true, numCallbackParams: 1 });
  });

  it('error handlers with no callback', function(done) {
    hooks.pre('cook', function(done) {
      done(new Error('fail'));
    });

    hooks.post('cook', function(error, callback) {
      assert.equal(error.message, 'fail');
      done();
    });

    var args = [];

    hooks.wrap(
      'cook',
      function(callback) {
        assert.ok(false);
        callback();
      },
      null,
      args,
      { useErrorHandlers: true });
  });

  it('error handlers with no error', function(done) {
    hooks.post('cook', function(error, callback) {
      callback(new Error('another error occurred'));
    });

    var args = [];
    args.push(function(error) {
      assert.ifError(error);
      done();
    });

    hooks.wrap(
      'cook',
      function(callback) {
        callback();
      },
      null,
      args,
      { useErrorHandlers: true });
  });

  it('works with no args', function(done) {
    hooks.pre('cook', function(done) {
      done();
    });

    hooks.post('cook', function(callback) {
      obj.tofu = 'no';
      callback();
    });

    var obj = { bacon: 0, eggs: 0 };

    var args = [];

    hooks.wrap(
      'cook',
      function(callback) {
        callback(null);
      },
      obj,
      args);

    setTimeout(
      function() {
        assert.equal('no', obj.tofu);
        done();
      },
      25);
  });

  it('handles pre errors with no args', function(done) {
    hooks.pre('cook', function(done) {
      done('error!');
    });

    hooks.post('cook', function(callback) {
      obj.tofu = 'no';
      callback();
    });

    var obj = { bacon: 0, eggs: 0 };

    var args = [];

    hooks.wrap(
      'cook',
      function(callback) {
        callback(null);
      },
      obj,
      args);

    setTimeout(
      function() {
        assert.equal(undefined, obj.tofu);
        done();
      },
      25);
  });

  it('handles wrapped function errors with no args', function(done) {
    hooks.pre('cook', function(done) {
      obj.waffles = false;
      done();
    });

    hooks.post('cook', function(callback) {
      obj.tofu = 'no';
      callback();
    });

    var obj = { bacon: 0, eggs: 0 };

    var args = [];

    hooks.wrap(
      'cook',
      function(callback) {
        callback('error!');
      },
      obj,
      args);

    setTimeout(
      function() {
        assert.equal(false, obj.waffles);
        assert.equal(undefined, obj.tofu);
        done();
      },
      25);
  });

  it('handles post errors with no args', function(done) {
    hooks.pre('cook', function(done) {
      obj.waffles = false;
      done();
    });

    hooks.post('cook', function(callback) {
      obj.tofu = 'no';
      callback('error!');
    });

    var obj = { bacon: 0, eggs: 0 };

    var args = [];

    hooks.wrap(
      'cook',
      function(callback) {
        callback();
      },
      obj,
      args);

    setTimeout(
      function() {
        assert.equal(false, obj.waffles);
        assert.equal('no', obj.tofu);
        done();
      },
      25);
  });

  it('sync wrappers', function() {
    var calledPre = 0;
    var calledFn = 0;
    var calledPost = 0;
    hooks.pre('cook', function() {
      ++calledPre;
    });

    hooks.post('cook', function() {
      ++calledPost;
    });

    var wrapper = hooks.createWrapperSync('cook', function() { ++calledFn; });

    wrapper();

    assert.equal(calledPre, 1);
    assert.equal(calledFn, 1);
    assert.equal(calledPost, 1);
  });

  it('works with async pre/post/fn', async function(){
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
  });

  it('works with async pre/post/fn with args', async function(){
    var calledPre = 0;
    var calledFn = 0;
    var calledPost = 0;
    hooks.pre('cook', async(done, id)=>{
      assert.equal(1, id);
      calledPre++;
      done();
    });
    hooks.post('cook', async(result)=>{
      assert.equal(2,result);
      calledPost++;
    });
    var wrapper = hooks.createWrapper('cook', async function(id){
      calledFn++;
      return ++id;
    });
    var result = await wrapper(1);
    assert.equal(result, 2);
    assert.equal(calledPre, 1);
    assert.equal(calledFn, 1);
    assert.equal(calledPost, 1);
  })

  it('force wrap, works with the function returns a promise', async function(){
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
        forceWrap:true,
        asyncFunc:true
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
  })

  it("short-cut by pre-hook", async function(){
    var calledPre = 0;
    var calledFn = 0;
    var calledPost = 0;
    hooks.pre('cook', async(done, id)=>{
      assert.equal(1, id);
      calledPre++;
      done(null, 2);
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
    assert.equal(result, 2);
    assert.equal(calledPre, 1);
    assert.equal(calledFn, 0);
    assert.equal(calledPost, 0);
  })
});
