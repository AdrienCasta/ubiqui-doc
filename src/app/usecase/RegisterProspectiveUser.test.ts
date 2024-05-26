import { randomUUID, UUID } from 'crypto';
import { MockInstance, vi } from 'vitest';
import type RegisterProspectiveUserCommand from '../../domain/command/RegisterProspectiveUserCommand';
import type ConfirmProspectiveUserCommand from '../../domain/command/ConfirmProspectiveUserCommand';
import InMemoryUserRepository from '../../infra/repository/InMemoryUserRepository';
import FakeSendConfirmationEmailService from '../../infra/service/FakeSendConfirmationEmailService';
import UserRepository from '../../domain/repository/UserRepository';
import RegisterProspectiveUser from './RegisterProspectiveUser';
import InMemoryEmailConfirmationTokenRepository from '../../infra/repository/InMemoryEmailConfirmationTokenRepository';
import SystemClock from '../../shared/SystemClock';
import RegisterProspectiveUserCommandHandler, {
  RegisterProspectiveUserCommandHandlerErrors,
} from '../handler/RegisterProspectiveUserCommandHandler';
import EmailVerificationTokenService from '../services/EmailVerificationTokenService';

const clock = new SystemClock();
let registeredProspectiveUserId: UUID;
let registerProspectiveUserCommand: RegisterProspectiveUserCommand;
let userRepository: UserRepository;
let registerProspectiveUser: RegisterProspectiveUser;
let sendConfirmationEmailSpy: MockInstance;

describe('RegisterProspectiveUser', () => {
  beforeEach(() => {
    const sendConfirmationEmailService = new FakeSendConfirmationEmailService();
    sendConfirmationEmailSpy = vi.spyOn(
      sendConfirmationEmailService,
      'execute',
    );

    userRepository = new InMemoryUserRepository();

    registerProspectiveUser = new RegisterProspectiveUser(
      new RegisterProspectiveUserCommandHandler(
        userRepository,
        new InMemoryEmailConfirmationTokenRepository(),
        sendConfirmationEmailService,
        new EmailVerificationTokenService(
          () => 'token',
          (date: Date) => date,
          clock,
        ),
      ),
    );
  });

  describe('Successful user registration', () => {
    beforeEach(() => {
      registeredProspectiveUserId = randomUUID();
      registerProspectiveUserCommand = {
        user: {
          id: registeredProspectiveUserId,
          email: 'john@doe.com',
          firstName: 'John',
          lastName: 'Doe',
          password: 'SecurePass123!',
        },
      };
    });

    afterEach(() => {
      expect(sendConfirmationEmailSpy).toHaveBeenCalledTimes(1);
      expect(sendConfirmationEmailSpy).toHaveBeenCalledWith(
        registerProspectiveUserCommand.user.email,
        'token',
      );
    });

    it('creates a new user account with the specified details', async () => {
      await registerProspectiveUser.execute(registerProspectiveUserCommand);
      const registeredProspectiveUser = await userRepository.getUserById(
        registeredProspectiveUserId,
      );
      expect(registeredProspectiveUser).toBeDefined();
      expect(registeredProspectiveUser?.emailConfirmed).toBe(false);
    });

    it('sends a confirmation email to the prospective user', async () => {
      await registerProspectiveUser.execute(registerProspectiveUserCommand);
    });
  });

  describe('Unsuccessful user registration', () => {
    beforeEach(() => {
      registeredProspectiveUserId = randomUUID();
      registerProspectiveUserCommand = {
        user: {
          id: registeredProspectiveUserId,
          email: 'john@doe.com',
          firstName: 'John',
          lastName: 'Doe',
          password: 'SecurePass123!',
        },
      };
    });

    it('fails to register user because email is not valid', async () => {
      const invalidEmailCommand = {
        ...registerProspectiveUserCommand,
        user: {
          ...registerProspectiveUserCommand.user,
          email: 'invalid-email',
        },
      };
      const result = await registerProspectiveUser.execute(invalidEmailCommand);
      expect(result.isFailure()).toBe(true);
      expect(result.getError()).toBeInstanceOf(
        RegisterProspectiveUserCommandHandlerErrors.EmailInvalidError,
      );
      expect(sendConfirmationEmailSpy).not.toHaveBeenCalled();
    });

    it('fails to register user because password is not valid', async () => {
      const weakPasswordCommand = {
        ...registerProspectiveUserCommand,
        user: {
          ...registerProspectiveUserCommand.user,
          password: 'weakpassword',
        },
      };
      const result = await registerProspectiveUser.execute(weakPasswordCommand);
      expect(result.isFailure()).toBe(true);
      expect(result.getError()).toBeInstanceOf(
        RegisterProspectiveUserCommandHandlerErrors.PasswordInvalidError,
      );
      expect(sendConfirmationEmailSpy).not.toHaveBeenCalled();
    });

    it('fails to register user because first name is not valid', async () => {
      const invalidFirstNameCommand = {
        ...registerProspectiveUserCommand,
        user: { ...registerProspectiveUserCommand.user, firstName: '' },
      };
      const result = await registerProspectiveUser.execute(
        invalidFirstNameCommand,
      );
      expect(result.isFailure()).toBe(true);
      expect(result.getError()).toBeInstanceOf(
        RegisterProspectiveUserCommandHandlerErrors.FirstNameInvalidError,
      );
      expect(sendConfirmationEmailSpy).not.toHaveBeenCalled();
    });

    it('fails to register user because last name is not valid', async () => {
      const invalidLastNameCommand = {
        ...registerProspectiveUserCommand,
        user: { ...registerProspectiveUserCommand.user, lastName: '' },
      };
      const result = await registerProspectiveUser.execute(
        invalidLastNameCommand,
      );
      expect(result.isFailure()).toBe(true);
      expect(result.getError()).toBeInstanceOf(
        RegisterProspectiveUserCommandHandlerErrors.LastNameInvalidError,
      );
      expect(sendConfirmationEmailSpy).not.toHaveBeenCalled();
    });

    it('fails to register because an unconfirmed user already exists and user is invited to confirm its email', async () => {
      await registerProspectiveUser.execute(registerProspectiveUserCommand);
      const result = await registerProspectiveUser.execute(
        registerProspectiveUserCommand,
      );
      expect(result.isFailure()).toBe(true);
      expect(result.getError()).toBeInstanceOf(
        RegisterProspectiveUserCommandHandlerErrors.EmailUnconfirmedError,
      );
    });
    it('fails to register because a confirmed user already exists', async () => {
      await registerProspectiveUser.execute(registerProspectiveUserCommand);

      const { user } = registerProspectiveUserCommand;
      const confirmProspectiveUserCommand: ConfirmProspectiveUserCommand = {
        userId: user.id as UUID,
        emailConfirmed: true,
      };

      await userRepository.updateUser(confirmProspectiveUserCommand.userId, {
        emailConfirmed: confirmProspectiveUserCommand.emailConfirmed,
      });

      const result = await registerProspectiveUser.execute(
        registerProspectiveUserCommand,
      );
      expect(result.isFailure()).toBe(true);
      expect(result.getError()).toBeInstanceOf(
        RegisterProspectiveUserCommandHandlerErrors.UserAlreadyExistsError,
      );
    });
  });
});
