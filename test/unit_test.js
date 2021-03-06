'use strict'

var Plugin = require('../index')
var chai = require('chai'), expect = chai.expect
var chaiAsPromised = require('chai-as-promised')
chai.use(chaiAsPromised)


NoopPlugin.prototype = Object.create(Plugin.prototype)
NoopPlugin.prototype.constructor = NoopPlugin
function NoopPlugin() {
  Plugin.apply(this, arguments)
}
NoopPlugin.prototype.build = function() {}


describe('unit tests', function() {
  it('toString', function() {
    expect(new NoopPlugin([]) + '').to.equal('[NoopPlugin]')
    expect(new NoopPlugin([], { name: 'FooPlugin' }) + '').to.equal('[FooPlugin]')
    expect(new NoopPlugin([], { annotation: 'some note' }) + '').to.equal('[NoopPlugin: some note]')
  })

  describe('usage errors', function() {
    it('requires the base constructor to be called (super)', function() {
      TestPlugin.prototype = Object.create(Plugin.prototype)
      TestPlugin.prototype.constructor = TestPlugin
      function TestPlugin() { /* no Plugin.apply(this, arguments) here */ }
      TestPlugin.prototype.build = function() {}

      return expect(function() {
        (new TestPlugin).__broccoliGetInfo__()
      }).to.throw(Error, /must call the superclass constructor/)
    })

    it('disallows overriding read, cleanup, and rebuild', function() {
      var prohibitedNames = ['read', 'rebuild', 'cleanup']
      for (var i = 0; i < prohibitedNames.length; i++) {
        var BadPlugin = function BadPlugin() {
          Plugin.apply(this, arguments)
        }
        BadPlugin.prototype = Object.create(Plugin.prototype)
        BadPlugin.prototype.constructor = BadPlugin
        BadPlugin.prototype.build = function() {}
        BadPlugin.prototype[prohibitedNames[i]] = function() {}

        expect(function() { new BadPlugin([]) })
          .to.throw(/For compatibility, plugins must not define/)
      }
    })

    it('checks that the inputNodes argument is an array', function() {
      expect(function() { new NoopPlugin('notAnArray') })
        .to.throw(/Expected an array/)
    })

    it('provides a helpful error message on missing `new`', function() {
      expect(function() { NoopPlugin([]) })
        .to.throw(/Missing `new`/)
    })
  })

  describe('__broccoliGetInfo__', function() {
    function expectCorrectInterface(pluginInterface) {
      expect(pluginInterface).to.have.property('nodeType', 'transform')
      expect(pluginInterface).to.have.property('inputNodes').that.deep.equals([])
      expect(pluginInterface).to.have.property('persistentOutput', false)
      expect(pluginInterface).to.have.property('name', 'NoopPlugin')
      expect(pluginInterface).to.have.property('annotation', undefined)
      expect(typeof pluginInterface.setup).to.equal('function')
      expect(typeof pluginInterface.getCallbackObject).to.equal('function')
      expect(typeof pluginInterface.instantiationStack).to.equal('string')
    }

    it('returns a plugin interface with explicit feature flags', function() {
      var node = new NoopPlugin([])
      expectCorrectInterface(node.__broccoliGetInfo__({
        persistentOutputFlag: true,
        sourceDirectories: true
      }))
    })

    it('returns a plugin interface when no feature flags are given', function() {
      var node = new NoopPlugin([])
      expectCorrectInterface(node.__broccoliGetInfo__())
    })

    it('throws an error when not passed enough feature flags', function() {
      var node = new NoopPlugin([])
      expect(function() {
        // Pass empty features object, rather than missing (= default) argument
        node.__broccoliGetInfo__({})
      }).to.throw(/Minimum builderFeatures required/)
    })
  })
})
