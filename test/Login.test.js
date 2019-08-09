import { AuthenticationError, UserInputError } from 'apollo-server-core';
import { expect } from 'chai';
import jwt from 'jsonwebtoken';
import mongoUnit from 'mongo-unit';
import speakeasy from 'speakeasy';
import { authorizeTFA, login } from '../src/modules/Login';
import loginFixture from './fixtures/loginFixture.json';

describe('modules/Login', () => {
  before(() => mongoUnit.load(loginFixture));
  after(() => mongoUnit.clean(loginFixture));

  describe('login', () => {
    context('without two-factor authentication', () => {
      it('should login successfuly when valid credentials are given', async () => {
        var response = await login('jane.doe@example.com', 'test123', false);
        expect(response.requiresTFA, "shouldn't require tfa").to.be.false;
        expect(response.token, 'token should be a string').to.be.a('string');
        expect(response.user, "user object can't be undefined").to.not.be.an('undefined');
        expect(response.user._id, 'user id to be a string').to.be.a('string');
        expect(response.user.name, 'user.name to be Jane Doe').to.be.equals('Jane Doe');
        expect(response.user.email, 'user.email to be jane.doe@example.com').to.be.equals(
          'jane.doe@example.com'
        );
        expect(response.user.username, 'user.username to match /jane-doe-[\\w\\d]{6}/').to.match(
          /jane-doe-[\w\d]{6}/
        );
        expect(
          jwt.verify(response.token, process.env.JWT_SECRET),
          'token payload to contain correct keys'
        )
          .to.be.an('object')
          .that.includes.all.keys('id', 'name', 'username');
      });
      it('should fail if email is wrong', () =>
        expect(login('not.jane.doe@example.com', 'test123', false)).to.be.rejectedWith(
          UserInputError,
          'Wrong email'
        ));
      it('should fail if password is wrong', () =>
        expect(login('jane.doe@example.com', 'wrongpassword', false)).to.be.rejectedWith(
          UserInputError,
          'Wrong password'
        ));
    });
    context('with two-factor-authentication', () => {
      it('should ask for two-factor authentication', async () => {
        var response = await login('john.doe@example.com', 'test123', false);
        expect(response.token, 'token should be a string').to.be.a('string');
        expect(response.requiresTFA, 'response should say TFA is required').to.be.true;
        expect(
          jwt.verify(response.token, process.env.JWT_SECRET),
          'token payload to contain correct keys'
        )
          .to.be.an('object')
          .that.includes.all.keys('id', 'requiresTFA', 'remember');
      });
    });
  });

  describe('authorizeTFA', () => {
    const token = { id: '5d4d496bf11d944e28c574a8', requiresTFA: true, remember: false };
    const secret = 'JBUXI42XH5QUEORJLM4HIQSEOVNSSVDMIN4U4ORFKFIXG7JUGRVQ';

    it('should throw an error when no token is given', () =>
      expect(authorizeTFA(undefined, false, '123456'), 'should be rejected').to.be.rejectedWith(
        AuthenticationError
      ));
    it('should throw an error if token payload does not include requireTFA', () =>
      expect(
        authorizeTFA({ ...token, requiresTFA: false }, false, '123456'),
        'should be rejected'
      ).to.be.rejectedWith(UserInputError));
    it('should authenticate successfully with time generated token', () =>
      expect(
        authorizeTFA(token, false, speakeasy.totp({ secret, encoding: 'base32' })),
        'should return new token'
      )
        .to.eventually.be.an('object')
        .that.has.key('token'));
    it('should authenticate successfully with backup code', () =>
      expect(authorizeTFA(token, true, 'PLLPCCGD'), 'should return new token')
        .to.eventually.be.an('object')
        .that.has.key('token'));
    it('should throw an error when a used backup code is provided', () =>
      expect(authorizeTFA(token, true, 'KU64Y6R5'), 'should throw error').to.be.rejectedWith(
        AuthenticationError
      ));
    it('should throw an error when invalid time generated token is provided', () =>
      expect(authorizeTFA(token, false, '123456'), 'should throw error').to.be.rejectedWith(
        AuthenticationError
      ));
    it('should throw an error when invalid backup code is provided', () =>
      expect(authorizeTFA(token, true, 'GHSI542K'), 'should throw error').to.be.rejectedWith(
        AuthenticationError
      ));
  });
});
