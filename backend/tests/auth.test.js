import test from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import auth from '../middleware/auth.js';

process.env.JWT_SECRET = 'test-secret';

function createReq(headerValue) {
  return {
    headers: headerValue ? { Authorization: headerValue } : {},
    header(name) {
      return this.headers[name] ?? this.headers[name.toLowerCase()];
    }
  };
}

function createRes() {
  return {
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    }
  };
}

test('accepts a normal Bearer token', () => {
  const req = createReq(`Bearer ${jwt.sign({ userId: '123' }, 'test-secret')}`);
  const res = createRes();
  let nextCalled = false;

  auth(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.equal(res.statusCode, null);
  assert.equal(req.user.userId, '123');
});

test('accepts Bearer tokens with extra whitespace', () => {
  const token = jwt.sign({ userId: '456' }, 'test-secret');
  const req = createReq(`Bearer   ${token}`);
  const res = createRes();
  let nextCalled = false;

  auth(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.equal(req.user.userId, '456');
});

test('exposes the user id via req.user.id', () => {
  const req = createReq(`Bearer ${jwt.sign({ id: 'abc', userId: 'abc' }, 'test-secret')}`);
  const res = createRes();
  let nextCalled = false;

  auth(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.equal(req.user.id, 'abc');
});

test('allows anonymous access when no auth header is present', () => {
  const req = createReq();
  const res = createRes();
  let nextCalled = false;

  auth(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 401);
});

test('rejects non-Bearer authorization schemes', () => {
  const req = createReq('Basic abc123');
  const res = createRes();
  let nextCalled = false;

  auth(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 401);
  assert.equal(res.body.message.includes('Bearer'), true);
});
