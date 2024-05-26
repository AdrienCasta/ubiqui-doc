import { createHash, randomUUID } from 'crypto';
import User from '../../domain/entity/User';
import Result from '../../shared/Result';
import RegisterProspectiveUserCommand from '../../domain/command/RegisterProspectiveUserCommand';
import UserRepository from '../../domain/repository/UserRepository';
import CommandHandler from '../../shared/CommandHandler';
import EmailConfirmationTokenRepository from '../../domain/repository/EmailConfirmationTokenRepository';
import SendConfirmationEmailService from '../../domain/service/SendConfirmationEmailService';
import EmailVerificationTokenService from '../services/EmailVerificationTokenService';

export default class RegisterProspectiveUserCommandHandler
  implements
    CommandHandler<RegisterProspectiveUserCommand, Result<User, Error>>
{
  constructor(
    private readonly userRepository: UserRepository,
    private readonly emailConfirmationTokenRepository: EmailConfirmationTokenRepository,
    private readonly sendConfirmationEmailService: SendConfirmationEmailService,
    private readonly emailVerificationTokenService: EmailVerificationTokenService,
  ) {}

  async execute(
    registerProspectiveUserCommand: RegisterProspectiveUserCommand,
  ): Promise<Result<User, Error>> {
    const { user: prospectiveUser } = registerProspectiveUserCommand;

    const userByEmailExist = await this.userRepository.findByEmail(
      prospectiveUser.email,
    );

    if (userByEmailExist) {
      if (userByEmailExist.emailConfirmed) {
        return Result.Failure(new UserAlreadyExistsError());
      }
      return Result.Failure(new EmailUnconfirmedError());
    }

    if (!isEmailValid(prospectiveUser.email)) {
      return Result.Failure(new EmailInvalidError());
    }

    if (!isPasswordValid(prospectiveUser.password)) {
      return Result.Failure(new PasswordInvalidError());
    }

    if (!isFirstNameValid(prospectiveUser.firstName)) {
      return Result.Failure(new FirstNameInvalidError());
    }

    if (!isLastNameValid(prospectiveUser.lastName)) {
      return Result.Failure(new LastNameInvalidError());
    }

    const user: User = {
      ...prospectiveUser,
      id: prospectiveUser.id ?? randomUUID(),
      passwordHash: hashPassword(prospectiveUser.password),
      emailConfirmed: false,
    };
    await this.userRepository.createUser(user);

    const { token, expiresAt } = this.emailVerificationTokenService.execute();

    await this.emailConfirmationTokenRepository.save({
      userId: user.id,
      expiresAt,
      token,
    });

    await this.sendConfirmationEmailService.execute(user.email, token);

    return Result.Success(user);
  }
}

function hashPassword(password: string) {
  return createHash('sha256').update(password).digest('hex');
}

function expireIn24Hours(date: Date) {
  return new Date(date.getTime() + 24 * 60 * 60 * 1000);
}

function isEmailValid(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isPasswordValid(password: string) {
  return (
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[^A-Za-z0-9]/.test(password)
  );
}

function isFirstNameValid(firstName: string) {
  return firstName.length > 0;
}

function isLastNameValid(lastName: string) {
  return lastName.length > 0;
}

class UserAlreadyExistsError extends Error {
  constructor() {
    super('User already exists');
    this.name = 'UserAlreadyExistsError';
  }
}

class EmailUnconfirmedError extends Error {
  constructor() {
    super('Email unconfirmed');
    this.name = 'EmailUnconfirmedError';
  }
}

class EmailInvalidError extends Error {
  constructor() {
    super('Email invalid');
    this.name = 'EmailInvalidError';
  }
}

class PasswordInvalidError extends Error {
  constructor() {
    super('Password invalid');
    this.name = 'PasswordInvalidError';
  }
}

class FirstNameInvalidError extends Error {
  constructor() {
    super('First name invalid');
    this.name = 'FirstNameInvalidError';
  }
}

class LastNameInvalidError extends Error {
  constructor() {
    super('Last name invalid');
    this.name = 'LastNameInvalidError';
  }
}

export const RegisterProspectiveUserCommandHandlerErrors = {
  UserAlreadyExistsError,
  EmailUnconfirmedError,
  EmailInvalidError,
  PasswordInvalidError,
  FirstNameInvalidError,
  LastNameInvalidError,
};
