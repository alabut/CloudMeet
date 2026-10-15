import test from 'node:test';

test('temporary safety proof: a failing regression must block release', () => {
	throw new Error('Intentional failure for issue #8; remove this fixture before merging.');
});
