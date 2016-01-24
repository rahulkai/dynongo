import test from 'ava';
import sinon from 'sinon';
import db from '../../';

db.connect();

test.before(() => {
	const stub = sinon.stub(db._dynamodb.service, 'listTables');
	stub.onFirstCall().yields(undefined, {LastEvaluatedTableName: 'test.baz', TableNames: ['test.baz']});
	stub.yields(undefined, {TableNames: ['test.foo', 'test.bar', 'prod.foo']});
});

test.after(() => {
	db._dynamodb.service.listTables.restore();
});

test.serial('result', async t => {
	t.same(await db.listTables().exec(), ['test.baz', 'test.foo', 'test.bar', 'prod.foo']);
});

test.serial('filter result on prefix', async t => {
	db._prefix = 'test';

	t.same(await db.listTables().exec(), ['test.foo', 'test.bar']);

	db._prefix = undefined;
});

test.serial('error if not connected', async t => {
	const original = db._dynamodb;
	db._dynamodb = undefined;

	await t.throws(db.listTables().exec(), 'Call .connect() before executing queries.');

	db._dynamodb = original;
});
