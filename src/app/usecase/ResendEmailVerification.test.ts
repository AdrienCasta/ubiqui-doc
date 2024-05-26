import { randomUUID } from 'crypto';
import InMemoryUserRepository from '../../infra/repository/InMemoryUserRepository';
import FakeSendConfirmationEmailService from '../../infra/service/FakeSendConfirmationEmailService';
import RegisterProspectiveUser from './RegisterProspectiveUser';
import InMemoryEmailConfirmationTokenRepository from '../../infra/repository/InMemoryEmailConfirmationTokenRepository';
import ConfirmProspectiveUserEmail from './ConfirmProspectiveUserEmail';
import SystemClock from '../../shared/SystemClock';
import RegisterProspectiveUserCommand from '../../domain/command/RegisterProspectiveUserCommand';
import RegisterProspectiveUserCommandHandler from '../handler/RegisterProspectiveUserCommandHandler';
import { MockInstance, vi } from 'vitest';
import EmailVerificationTokenService from '../services/EmailVerificationTokenService';
import ResendEmailVerification from './ResendEmailVerification';
import ResendEmailVerificationCommandHandler, {
  UserAlreadyConfirmedError,
  UserNotFoundError,
} from '../handler/ResendEmailVerificationCommandHandler';

describe('ResendEmailVerification', () => {
  const clock = new SystemClock();

  let registerProspectiveUser: RegisterProspectiveUser;
  let confirmProspectiveUserEmail: ConfirmProspectiveUserEmail;
  let registerProspectiveUserCommand: RegisterProspectiveUserCommand;
  let resendEmailVerification: ResendEmailVerification;
  let sendConfirmationEmailServiceSpy: MockInstance;

  beforeEach(async () => {
    const emailConfirmationTokenRepository =
      new InMemoryEmailConfirmationTokenRepository();
    const userRepository = new InMemoryUserRepository();

    const sendConfirmationEmailService = new FakeSendConfirmationEmailService();
    sendConfirmationEmailServiceSpy = vi.spyOn(
      sendConfirmationEmailService,
      'execute',
    );
    const oneMinuteFromNow = (date: Date) => new Date(date.getTime() + 60000);
    const emailVerificationTokenService = new EmailVerificationTokenService(
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

    registerProspectiveUser = new RegisterProspectiveUser(
      new RegisterProspectiveUserCommandHandler(
        userRepository,
        emailConfirmationTokenRepository,
        sendConfirmationEmailService,
        emailVerificationTokenService,
      ),
    );

    confirmProspectiveUserEmail = new ConfirmProspectiveUserEmail(
      userRepository,
      emailConfirmationTokenRepository,
      clock,
    );
    resendEmailVerification = new ResendEmailVerification(
      new ResendEmailVerificationCommandHandler(
        userRepository,
        emailConfirmationTokenRepository,
        sendConfirmationEmailService,
        emailVerificationTokenService,
      ),
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
