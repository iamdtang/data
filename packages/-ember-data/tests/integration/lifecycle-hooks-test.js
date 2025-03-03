import { module } from 'qunit';
import { resolve } from 'rsvp';

import { setupTest } from 'ember-qunit';

import JSONAPIAdapter from '@ember-data/adapter/json-api';
import Model, { attr } from '@ember-data/model';
import JSONAPISerializer from '@ember-data/serializer/json-api';
import { deprecatedTest } from '@ember-data/unpublished-test-infra/test-support/deprecated-test';

module('integration/lifecycle_hooks - Lifecycle Hooks', function (hooks) {
  setupTest(hooks);
  let store;
  let adapter;
  hooks.beforeEach(function () {
    let { owner } = this;
    class Person extends Model {
      @attr()
      name;
    }

    owner.register('model:person', Person);
    owner.register('adapter:application', JSONAPIAdapter.extend());
    owner.register('serializer:application', JSONAPISerializer.extend());
    store = owner.lookup('service:store');
    adapter = store.adapterFor('application');
  });

  deprecatedTest(
    'When the adapter acknowledges that a record has been created, a `didCreate` event is triggered.',
    {
      id: 'ember-data:evented-api-usage',
      until: '4.0',
    },
    async function (assert) {
      let done = assert.async();
      assert.expect(3);

      adapter.createRecord = function (store, type, snapshot) {
        return resolve({ data: { id: 99, type: 'person', attributes: { name: 'Yehuda Katz' } } });
      };

      let person = store.createRecord('person', { name: 'Yehuda Katz' });

      person.on('didCreate', function () {
        assert.strictEqual(this, person, 'this is bound to the record');
        assert.strictEqual(this.get('id'), '99', 'the ID has been assigned');
        assert.strictEqual(this.get('name'), 'Yehuda Katz', 'the attribute has been assigned');
        done();
      });

      await person.save();
    }
  );

  deprecatedTest(
    'When the adapter acknowledges that a record has been created without a new data payload, a `didCreate` event is triggered.',
    {
      id: 'ember-data:evented-api-usage',
      count: 1,
      until: '4.0',
    },
    async function (assert) {
      assert.expect(3);

      adapter.createRecord = function (store, type, snapshot) {
        return resolve();
      };

      let person = store.createRecord('person', { id: 99, name: 'Yehuda Katz' });

      person.on('didCreate', function () {
        assert.strictEqual(this, person, 'this is bound to the record');
        assert.strictEqual(this.get('id'), '99', 'the ID has been assigned');
        assert.strictEqual(this.get('name'), 'Yehuda Katz', 'the attribute has been assigned');
      });

      await person.save();
    }
  );
});
