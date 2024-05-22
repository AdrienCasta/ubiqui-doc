import { UUID } from 'crypto';
import ProspectiveUser from '../../domain/entity/PropspectiveUser';
import UserRepository from '../../domain/repository/UserRepository';
import Result from '../../shared/Result';

export default class InMemoryUserRepository implements UserRepository {
  users: ProspectiveUser[] = [];
  async save(user: ProspectiveUser): Promise<Result<void, Error>> {
    this.users.push(user);
    return Result.Success();
  }
  getUserId(userId: UUID): ProspectiveUser | undefined {
    return this.users.find((user) => user.id === userId);
  }
}
