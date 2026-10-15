import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import test from 'node:test';
import { parse } from 'yaml';

const workflow = parse(readFileSync(new URL('../../.github/workflows/deploy.yml', import.meta.url), 'utf8'));
const scripts = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8')).scripts;

test('every production publish waits for successful verification', () => {
	assert.equal(workflow.jobs.deploy.needs, 'verify');
	assert.match(workflow.jobs.deploy.if, /github\.ref == 'refs\/heads\/main'/);
	assert.match(workflow.jobs.deploy.if, /inputs\.verify_only/);
	assert.doesNotMatch(workflow.jobs.deploy.if, /always\(|failure\(/);
	assert.equal(workflow.jobs.verify['continue-on-error'], undefined);
	for (const step of workflow.jobs.verify.steps) {
		assert.equal(step['continue-on-error'], undefined);
	}
});

test('verification covers regressions, production build and local browser behavior without secrets', () => {
	const verification = JSON.stringify(workflow.jobs.verify);
	assert.match(verification, /npm run test:regression/);
	assert.match(verification, /npm run build/);
	assert.match(verification, /npm run test:behavior/);
	assert.doesNotMatch(verification, /secrets\.|wrangler.*deploy|--remote/);
});

test('manual verification is safe by default and pull requests run the gate', () => {
	assert.equal(workflow.on.workflow_dispatch.inputs.verify_only.type, 'boolean');
	assert.equal(workflow.on.workflow_dispatch.inputs.verify_only.default, true);
	assert('pull_request' in workflow.on);
	assert(!('pull_request_target' in workflow.on));
});

test('legacy upstream deploy and sync workflows cannot bypass reviewed releases', () => {
	assert.equal(existsSync(new URL('../../.github/workflows/sync-and-deploy.yml', import.meta.url)), false);
	assert.equal(existsSync(new URL('../../.github/workflows/sync.yml', import.meta.url)), false);
});

test('the local deployment command stops if release checks fail', () => {
	assert.match(scripts.deploy, /^npm run release:check && wrangler pages deploy /);
	assert.equal(scripts['release:check'], 'npm run test:regression && npm run build && npm run test:behavior');
});
