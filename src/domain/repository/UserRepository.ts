import { UUID } from 'crypto';
import Result from '../../shared/Result';
import ProspectiveUser from '../entity/PropspectiveUser';

export default interface UserRepository {
  save(user: ProspectiveUser): Promise<Result<void, Error>>;
  getUserId(userId: UUID): ProspectiveUser | undefined;
}
