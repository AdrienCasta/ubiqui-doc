import { MockInstance, vi } from 'vitest';
import SystemClock from '../../shared/SystemClock';
import ConfirmProspectiveUserEmail from './ConfirmProspectiveUserEmail';
import RegisterProspectiveUser from './RegisterProspectiveUser';
import InMemoryEmailConfirmationTokenRepository from '../../infra/repository/InMemoryEmailConfirmationTokenRepository';
import InMemoryUserRepository from '../../infra/repository/InMemoryUserRepository';
import InMemoryResetPasswordTokenRepository from '../../infra/repository/InMemoryResetPasswordTokenRepository';
import FakeSendConfirmationEmailService from '../../infra/service/FakeSendConfirmationEmailService';
import FakeSendResetPasswordEmailService from '../../infra/service/FakeSendResetPasswordEmailService';
import EmailVerificationTokenService from '../services/EmailVerificationTokenService';
import { randomUUID, UUID } from 'crypto';
import RegisterProspectiveUserCommandHandler from '../handler/RegisterProspectiveUserCommandHandler';
import UserRepository from '../../domain/repository/UserRepository';
import Result from '../../shared/Result';
import ResetPasswordTokenService from '../services/ResetPassordTokenService';
import SendResetPasswordEmailService from '../../domain/service/SendResetPasswordEmailService';
import ResetPasswordTokenRepository from '../../domain/repository/ResetPasswordTokenRepository';
import RequestPasswordReset, {
  SendResetPasswordEmailServiceError,
  UserNotConfirmedError,
  UserNotFoundError,
} from './RequestPasswordReset';

describe('RequestPasswordReset', () => {
  const clock = new SystemClock();
  const expireIn5Min = (date: Date) => new Date(date.getTime() - 1000 * 60 * 5);
  const registerProspectiveUserCommand = {
    user: {
      id: randomUUID(),
      email: 'john@doe.com',
      firstName: 'John',
      lastName: 'Doe',
      password: 'SecurePass123!',
    },
  };

  let registerProspectiveUser: RegisterProspectiveUser;
  let confirmProspectiveUserEmail: ConfirmProspectiveUserEmail;
  let sendResetPasswordEmailServiceSpy: MockInstance;
  let sendResetPasswordEmailService: SendResetPasswordEmailService;
  let userRepository: UserRepository;
  let resetPasswordTokenService: ResetPasswordTokenService;
  let resetPasswordTokenRepository: ResetPasswordTokenRepository;

  beforeEach(async () => {
    resetPasswordTokenService = new ResetPasswordTokenService(
      () => 'reset-password-token',
      expireIn5Min,
      clock,
    );
    resetPasswordTokenRepository = new InMemoryResetPasswordTokenRepository();
    const emailConfirmationTokenRepository =
      new InMemoryEmailConfirmationTokenRepository();
    userRepository = new InMemoryUserRepository();

    const sendConfirmationEmailService = new FakeSendConfirmationEmailService();

    sendResetPasswordEmailService = new FakeSendResetPasswordEmailService();
    sendResetPasswordEmailServiceSpy = vi.spyOn(
      sendResetPasswordEmailService,
      'execute',
    );

    const oneMinuteFromNow = (date: Date) => new Date(date.getTime() + 60000);
    const emailVerificationTokenService = new EmailVerificationTokenService(
      () => 'token',
      oneMinuteFromNow,
      clock,
    );

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
  });

  it('sends a way to reset the password by email', async () => {
    await registerProspectiveUser.execute(registerProspectiveUserCommand);
    await confirmProspectiveUserEmail.execute(
      registerProspectiveUserCommand.user.email,
      'token',
    );
    const requestPasswordReset = new RequestPasswordReset(
      userRepository,
      resetPasswordTokenRepository,
      sendResetPasswordEmailService,
      resetPasswordTokenService,
    );
    const result = await requestPasswordReset.execute(
      registerProspectiveUserCommand.user.email,
    );

    expect(result.isSuccess()).toBeTruthy();
    expect(sendResetPasswordEmailServiceSpy).toHaveBeenCalledWith(
      registerProspectiveUserCommand.user.email,
      'reset-password-token',
    );
  });
  it('ensures the reset token has a 5-minute expiration time', async () => {
    await registerProspectiveUser.execute(registerProspectiveUserCommand);
    await confirmProspectiveUserEmail.execute(
      registerProspectiveUserCommand.user.email,
      'token',
    );

    const requestPasswordReset = new RequestPasswordReset(
      userRepository,
      resetPasswordTokenRepository,
      sendResetPasswordEmailService,
      resetPasswordTokenService,
    );
    const result = await requestPasswordReset.execute(
      registerProspectiveUserCommand.user.email,
    );

    expect(result.isSuccess()).toBeTruthy();
    expect(sendResetPasswordEmailServiceSpy).toHaveBeenCalledWith(
      registerProspectiveUserCommand.user.email,
      'reset-password-token',
    );
    expect(
      await resetPasswordTokenRepository.getTokenByUserId(
        registerProspectiveUserCommand.user.id as UUID,
      ),
    ).toEqual({
      token: 'reset-password-token',
      expiresAt: expireIn5Min(clock.now()),
    });
  });
  it('does not send a way to reset the password by email because user does not exist', async () => {
    const requestPasswordReset = new RequestPasswordReset(
      userRepository,
      resetPasswordTokenRepository,
      sendResetPasswordEmailService,
      resetPasswordTokenService,
    );
    const result = await requestPasswordReset.execute(
      'non-existent-email@example.com',
    );

    expect(result.isFailure()).toBeTruthy();
    expect(result.getError()).toBeInstanceOf(UserNotFoundError);

    expect(sendResetPasswordEmailServiceSpy).not.toHaveBeenCalledWith(
      'non-existent-email@example.com',
      'reset-password-token',
    );
  });
  it('does not send a way to reset the password by email because user does not exist', async () => {
    const requestPasswordReset = new RequestPasswordReset(
      userRepository,
      resetPasswordTokenRepository,
      sendResetPasswordEmailService,
      resetPasswordTokenService,
    );

    const result = await requestPasswordReset.execute(
      'non-existent-email@example.com',
    );

    expect(result.isFailure()).toBeTruthy();
    expect(result.getError()).toBeInstanceOf(UserNotFoundError);

    expect(sendResetPasswordEmailServiceSpy).not.toHaveBeenCalledWith(
      'non-existent-email@example.com',
      'reset-password-token',
    );
  });
  it('does not send a way to reset the password by email because user is not confirmed', async () => {
    await registerProspectiveUser.execute(registerProspectiveUserCommand);

    const requestPasswordReset = new RequestPasswordReset(
      userRepository,
      resetPasswordTokenRepository,
      sendResetPasswordEmailService,
      resetPasswordTokenService,
    );

    const result = await requestPasswordReset.execute(
      registerProspectiveUserCommand.user.email,
    );

    expect(result.isFailure()).toBeTruthy();
    expect(result.getError()).toBeInstanceOf(UserNotConfirmedError);

    expect(sendResetPasswordEmailServiceSpy).not.toHaveBeenCalledWith(
      registerProspectiveUserCommand.user.email,
      'reset-password-token',
    );
  });

  it('alerts user if email the reset email has not been sent due to an error', async () => {
    await registerProspectiveUser.execute(registerProspectiveUserCommand);
    await confirmProspectiveUserEmail.execute(
      registerProspectiveUserCommand.user.email,
      'token',
    );

    const mockSendResetPasswordEmailService = vi
      .fn()
      .mockResolvedValue(Result.Failure(new Error()));

    sendResetPasswordEmailService.execute = mockSendResetPasswordEmailService;

    const requestPasswordReset = new RequestPasswordReset(
      userRepository,
      resetPasswordTokenRepository,
      sendResetPasswordEmailService,
      resetPasswordTokenService,
    );
    const result = await requestPasswordReset.execute(
      registerProspectiveUserCommand.user.email,
    );
    expect(mockSendResetPasswordEmailService).toHaveBeenCalledWith(
      registerProspectiveUserCommand.user.email,
      'reset-password-token',
    );

    expect(result.isFailure()).toBeTruthy();
    expect(result.getError()).toBeInstanceOf(
      SendResetPasswordEmailServiceError,
    );
  });
});
