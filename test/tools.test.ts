import test from 'tape'
import { capitalize } from '../src/tools'

test('tools.capitalize', t => {
  t.equal(capitalize('foo'), 'Foo', 'should capitilize #1')
  t.equal(capitalize('fooBar'), 'FooBar', 'should capitilize #1')
  t.end()
})
