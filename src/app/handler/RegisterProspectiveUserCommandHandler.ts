import { createHash, randomUUID } from 'crypto';
import ProspectiveUser from '../../domain/entity/PropspectiveUser';
import Result from '../../shared/Result';
import RegisterProspectiveUserCommand from '../../domain/command/RegisterProspectiveUserCommand';
import UserRepository from '../../domain/repository/UserRepository';
import CommandHandler from '../../shared/CommandHandler';

export default class RegisterProspectiveUserCommandHandler
  implements
    CommandHandler<RegisterProspectiveUserCommand, Result<void, Error>>
{
  constructor(private readonly userRepository: UserRepository) {}

  async execute(
    RegisterProspectiveUserCommand: RegisterProspectiveUserCommand,
  ): Promise<Result<void, Error>> {
    const user: ProspectiveUser = {
      ...RegisterProspectiveUserCommand,
      id: RegisterProspectiveUserCommand.id ?? randomUUID(),
      passwordHash: hashPassword(RegisterProspectiveUserCommand.password),
      emailConfirmed: false,
    };
    return this.userRepository.save(user);
  }
}

function hashPassword(password: string) {
  return createHash('sha256').update(password).digest('hex');
}
