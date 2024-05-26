import { randomUUID } from 'crypto';
import InMemoryUserRepository from '../../infra/repository/InMemoryUserRepository';
import FakeSendConfirmationEmailService from '../../infra/service/FakeSendConfirmationEmailService';

import RegisterProspectiveUser from './RegisterProspectiveUser';
import InMemoryEmailConfirmationTokenRepository from '../../infra/repository/InMemoryEmailConfirmationTokenRepository';
import ConfirmProspectiveUserEmail from './ConfirmProspectiveUserEmail';
import SystemClock from '../../shared/SystemClock';
import RegisterProspectiveUserCommand from '../../domain/command/RegisterProspectiveUserCommand';
import UserRepository from '../../domain/repository/UserRepository';
import EmailConfirmationTokenRepository from '../../domain/repository/EmailConfirmationTokenRepository';
import SendConfirmationEmailService from '../../domain/service/SendConfirmationEmailService';
import RegisterProspectiveUserCommandHandler from '../handler/RegisterProspectiveUserCommandHandler';
import Result from '../../shared/Result';
import { MockInstance, vi } from 'vitest';
import EmailVerificationTokenService from '../services/EmailVerificationTokenService';

describe('ResendEmailVerification', () => {
  let sendConfirmationEmailService: FakeSendConfirmationEmailService;
  let userRepository: InMemoryUserRepository;
  let emailConfirmationTokenRepository: InMemoryEmailConfirmationTokenRepository;
  let resendEmailVerificationCommandHandler: ResendEmailVerificationCommandHandler;
  let registerProspectiveUserCommandHandler: RegisterProspectiveUserCommandHandler;
  let registerProspectiveUser: RegisterProspectiveUser;
  let confirmProspectiveUserEmail: ConfirmProspectiveUserEmail;
  let registerProspectiveUserCommand: RegisterProspectiveUserCommand;
  let resendEmailVerification: ResendEmailVerification;
  let sendConfirmationEmailServiceSpy: MockInstance;
  let emailVerificationTokenService: EmailVerificationTokenService;

  const clock = new SystemClock();

  beforeEach(async () => {
    sendConfirmationEmailService = new FakeSendConfirmationEmailService();
    sendConfirmationEmailServiceSpy = vi.spyOn(
      sendConfirmationEmailService,
      'execute',
    );
    userRepository = new InMemoryUserRepository();
    const oneMinuteFromNow = (date: Date) => new Date(date.getTime() + 60000);
    emailVerificationTokenService = new EmailVerificationTokenService(
      () => 'token',
      oneMinuteFromNow,
      clock,
    );
    registerProspectiveUserCommand = {
      user: {
        id: randomUUID(),
        email: 'john@doe.com',
        firstName: 'John',
        lastName: 'Doe',
        password: 'SecurePass123!',
      },
    };
    emailConfirmationTokenRepository =
      new InMemoryEmailConfirmationTokenRepository();
    resendEmailVerificationCommandHandler =
      new ResendEmailVerificationCommandHandler(
        userRepository,
        emailConfirmationTokenRepository,
        sendConfirmationEmailService,
        emailVerificationTokenService,
      );
    registerProspectiveUserCommandHandler =
      new RegisterProspectiveUserCommandHandler(
        userRepository,
        emailConfirmationTokenRepository,
        sendConfirmationEmailService,
        emailVerificationTokenService,
      );
    registerProspectiveUser = new RegisterProspectiveUser(
      registerProspectiveUserCommandHandler,
    );
    confirmProspectiveUserEmail = new ConfirmProspectiveUserEmail(
      userRepository,
      emailConfirmationTokenRepository,
      clock,
    );
    resendEmailVerification = new ResendEmailVerification(
      resendEmailVerificationCommandHandler,
    );
  });

  it('resends email verification to the prospective user', async () => {
    await registerProspectiveUser.execute(registerProspectiveUserCommand);
    const resendEmailVerificationOrError =
      await resendEmailVerification.execute({ email: 'john@doe.com' });
    expect(resendEmailVerificationOrError.isSuccess()).toBeTruthy();
  });

  it('does not resend email verification if user does not exist', async () => {
    await registerProspectiveUser.execute(registerProspectiveUserCommand);
    const resendEmailVerificationOrError =
      await resendEmailVerification.execute({
        email: 'unknown@doe.com',
      });
    expect(resendEmailVerificationOrError.isFailure()).toBeTruthy();
    expect(resendEmailVerificationOrError.getError()).toBeInstanceOf(
      UserNotFoundError,
    );
    expect(sendConfirmationEmailServiceSpy).not.toHaveBeenCalledWith(
      'unknown@doe.com',
      'token',
    );
  });

  it('does not resend email verification if user is already confirmed', async () => {
    await registerProspectiveUser.execute(registerProspectiveUserCommand);

    await confirmProspectiveUserEmail.execute(
      registerProspectiveUserCommand.user.email,
      'token',
    );

    expect(sendConfirmationEmailServiceSpy).toHaveBeenCalledTimes(1);

    const resendEmailVerificationOrError =
      await resendEmailVerification.execute({
        email: registerProspectiveUserCommand.user.email,
      });

    expect(resendEmailVerificationOrError.isFailure()).toBeTruthy();
    expect(resendEmailVerificationOrError.getError()).toBeInstanceOf(
      UserAlreadyConfirmedError,
    );
    expect(sendConfirmationEmailServiceSpy).toHaveBeenCalledTimes(1);
  });
});

class ResendEmailVerification {
  constructor(
    private readonly resendEmailVerificationCommandHandler: ResendEmailVerificationCommandHandler,
  ) {}

  execute(command: ResendEmailVerificationCommand) {
    return this.resendEmailVerificationCommandHandler.execute(command);
  }
}

class ResendEmailVerificationCommandHandler {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly emailConfirmationTokenRepository: EmailConfirmationTokenRepository,
    private readonly sendConfirmationEmailService: SendConfirmationEmailService,
    private readonly emailVerificationTokenService: EmailVerificationTokenService,
  ) {}

  async execute(command: ResendEmailVerificationCommand) {
    const user = await this.userRepository.findByEmail(command.email);

    if (!user) {
      return Result.Failure(new UserNotFoundError());
    }

    if (user.emailConfirmed) {
      return Result.Failure(new UserAlreadyConfirmedError());
    }

    const { token, expiresAt } = this.emailVerificationTokenService.execute();

    await this.emailConfirmationTokenRepository.save({
      userId: user.id,
      token,
      expiresAt,
    });
    return this.sendConfirmationEmailService.execute(command.email, token);
  }
}

class UserNotFoundError extends Error {
  constructor() {
    super('User not found');
  }
}

class UserAlreadyConfirmedError extends Error {
  constructor() {
    super('User already confirmed');
  }
}

interface ResendEmailVerificationCommand {
  email: string;
}
