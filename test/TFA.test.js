import { AuthenticationError, UserInputError } from 'apollo-server-core';
import { expect } from 'chai';
import mongoUnit from 'mongo-unit';
import speakeasy from 'speakeasy';
import { disableTFA, enableTFA, generateSecret, getBackupCodes } from '../src/modules/TFA';
import tfaFixture from './fixtures/loginFixture.json';

describe('modules/TFA', () => {
  beforeEach(() => mongoUnit.load(tfaFixture));
  afterEach(() => mongoUnit.clean(tfaFixture));

  const janeDoeToken = {
    id: '5d4c05af6b6f6c4c74184cc8',
    name: 'Jane Doe',
    username: 'jane-doe-f63767',
  };

  const johnDoeToken = {
    id: '5d4d496bf11d944e28c574a8',
    name: 'John Doe',
    username: 'john-doe-e6cb69',
  };

  describe('generateSecret', () => {
    it('should throw an error if user is not logged in', () =>
      expect(generateSecret(undefined), 'should throw an error').to.be.rejectedWith(
        AuthenticationError
      ));

    it('should generate a random secret', async () => {
      const result = await generateSecret(janeDoeToken);
      expect(result.secret, 'secret should be a string').to.be.a('string');
      expect(result.qrcode, 'qrcode should be a base64 encoded image')
        .to.be.a('string')
        .that.matches(/^data:image\/png;base64,[\w/+=]+$/);
    });
  });

  describe('enableTFA', () => {
    it('should throw an error if user is not logged in', () =>
      expect(enableTFA(undefined, '', ''), 'should throw an error').to.be.rejectedWith(
        AuthenticationError
      ));

    it('should throw an error for users with TFA already enabled', async () => {
      const randomSecret = speakeasy.generateSecret();
      await expect(
        enableTFA(
          johnDoeToken,
          randomSecret.base32,
          speakeasy.totp({ secret: randomSecret.ascii })
        ),
        'should throw an error'
      ).to.be.rejectedWith(UserInputError);
    });

    it('should enable TFA when correct data is passed', async () => {
      const randomSecret = speakeasy.generateSecret();
      await expect(
        enableTFA(
          janeDoeToken,
          randomSecret.base32,
          speakeasy.totp({ secret: randomSecret.ascii })
        ),
        'should return backup codes'
      ).to.eventually.be.an('array').that.is.not.empty;
    });
  });

  describe('disableTFA', () => {
    it('should throw an error if user is not logged in', () =>
      expect(disableTFA(undefined, ''), 'should throw an error').to.be.rejectedWith(
        AuthenticationError
      ));

    it('should throw an error if user does not have TFA enabled', () =>
      expect(disableTFA(janeDoeToken, '123456'), 'should throw an error').to.be.rejectedWith(
        UserInputError
      ));

    it('should throw an error if token is wrong', () =>
      expect(disableTFA(johnDoeToken, '123456'), 'should throw an error').to.be.rejectedWith(
        UserInputError
      ));

    it('should disable tfa for correct token', () =>
      expect(
        disableTFA(
          johnDoeToken,
          speakeasy.totp({
            secret: 'JBUXI42XH5QUEORJLM4HIQSEOVNSSVDMIN4U4ORFKFIXG7JUGRVQ',
            encoding: 'base32',
          })
        ),
        'should return user id'
      ).to.eventually.be.equals('5d4d496bf11d944e28c574a8'));
  });

  describe('getBackupCodes', () => {
    it('should throw an error if user is not logged in', () =>
      expect(getBackupCodes(undefined), 'should throw an error').to.be.rejectedWith(
        AuthenticationError
      ));

    it('should throw an error if user does not have TFA enabled', () =>
      expect(getBackupCodes(janeDoeToken), 'should throw an error').to.be.rejectedWith(
        UserInputError
      ));

    it('should return backup codes', async () => {
      const backupCodes = getBackupCodes(johnDoeToken);
      expect(backupCodes, 'must be array with length 10')
        .to.eventually.be.an('array')
        .that.has.length(10);
      for (let i = 0; i < backupCodes.length; i++) {
        let backupCode = backupCodes[i];
        expect(backupCode, 'array children must be an object').to.be.an('object');
        expect(backupCode.code, 'code must be a string').to.be.a('string');
        expect(backupCode.used, 'used must be a boolean').to.be.a('boolean');
      }
    });
  });
});
