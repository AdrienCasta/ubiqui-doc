import { randomUUID, UUID } from 'crypto';
import { MockInstance, vi } from 'vitest';
import RegisterProspectiveUserCommandHandler from '../handler/RegisterProspectiveUserCommandHandler';
import SendConfirmationEmailService from '../../domain/service/SendConfirmationEmailService';
import RegisterProspectiveUserCommand from '../../domain/command/RegisterProspectiveUserCommand';
import InMemoryUserRepository from '../../infra/repository/InMemoryUserRepository';
import FakeSendConfirmationEmailService from '../../infra/service/FakeSendConfirmationEmailService';
import UserRepository from '../../domain/repository/UserRepository';
import RegisterProspectiveUser from './UserRegistration';

describe('Successful user registration', () => {
  describe('Given a prospective user wants to register on the platform', () => {
    let registeredProspectiveUserId: UUID;
    let registerProspectiveUserCommand: RegisterProspectiveUserCommand;
    let userRepository: UserRepository;
    let registerProspectiveUserCommandHandler: RegisterProspectiveUserCommandHandler;
    let registerProspectiveUser: RegisterProspectiveUser;
    let sendConfirmationEmailService: SendConfirmationEmailService;
    let sendConfirmationEmailSpy: MockInstance;

    beforeEach(() => {
      sendConfirmationEmailService = new FakeSendConfirmationEmailService();
      sendConfirmationEmailSpy = vi.spyOn(
        sendConfirmationEmailService,
        'execute',
      );
      registeredProspectiveUserId = randomUUID();
      registerProspectiveUserCommand = {
        id: registeredProspectiveUserId,
        email: 'john@doe.com',
        firstName: 'John',
        lastName: 'Doe',
        password: 'SecurePass123',
      };
      userRepository = new InMemoryUserRepository();

      registerProspectiveUserCommandHandler =
        new RegisterProspectiveUserCommandHandler(userRepository);

      registerProspectiveUser = new RegisterProspectiveUser(
        registerProspectiveUserCommandHandler,
        sendConfirmationEmailService,
      );
    });

    it('create a new user account with the following details', async () => {
      await registerProspectiveUser.execute(registerProspectiveUserCommand);

      const registeredProspectiveUser = await userRepository.getUserId(
        registeredProspectiveUserId,
      );

      expect(registeredProspectiveUser).toBeDefined();
      expect(registeredProspectiveUser?.emailConfirmed).toBe(false);
    });
    it('sends a confirmation email to the prospective user', async () => {
      expect(sendConfirmationEmailSpy).not.toHaveBeenCalled();

      await registerProspectiveUser.execute(registerProspectiveUserCommand);

      expect(sendConfirmationEmailSpy).toHaveBeenCalledWith(
        registerProspectiveUserCommand.email,
      );
    });
  });
});
