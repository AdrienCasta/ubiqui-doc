import { UUID } from 'crypto';
import Result from '../../shared/Result';
import User from '../entity/User';

export default interface UserRepository {
  createUser(user: User): Promise<Result<void, Error>>;
  updateUser(userId: UUID, user: Partial<User>): Promise<void>;
  getUserById(userId: UUID): Promise<User | undefined>;
  findByEmail(email: string): Promise<User | undefined>;
}
