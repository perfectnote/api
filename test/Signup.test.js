import { UserInputError } from 'apollo-server-core';
import { compare as comparePassword } from 'bcrypt';
import { expect } from 'chai';
import jwt from 'jsonwebtoken';
import mongoUnit from 'mongo-unit';
import { signup } from '../src/modules/Signup';
import signupFixture from './fixtures/signupFixture.json';

describe('modules/Signup', () => {
  before(() => mongoUnit.load(signupFixture));
  after(() => mongoUnit.clean(signupFixture));

  it('should register a pre-defined user correctly', async () => {
    var data = await signup('john.doe@example.com', 'password123456', 'John Doe');

    expect(data.token).to.be.a('string', 'token is not a string');
    expect(data.user).to.not.be.a('undefined', "user object can't be undefined");
    expect(data.user._id).to.be.a('string', 'id is not a swtring');
    expect(data.user.name).to.be.equal('John Doe', "name doesn't match what was provided");
    expect(data.user.email).to.be.equals(
      'john.doe@example.com',
      "email doesn't match what was provided"
    );
    await expect(comparePassword('password123456', data.user.password), 'passwords should match').to
      .eventually.be.true;
    expect(data.user.username).to.match(/john-doe-[\d\w]{6}/, "username isn't correctly setup");

    expect(jwt.verify(data.token, process.env.JWT_SECRET))
      .to.be.an('object')
      .that.includes.all.keys('id', 'name', 'username');
  });

  it('should throw error for invalid email', () =>
    expect(signup('john.doe', 'password123456', 'John Doe')).to.be.rejectedWith(UserInputError));

  it('should throw error for duplicate email', () =>
    expect(signup('john.doe@example.com', 'password123456', 'John Doe')).to.be.rejectedWith(Error));
});
