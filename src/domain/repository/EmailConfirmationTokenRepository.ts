import { UUID } from 'crypto';
import EmailConfirmationToken from '../entity/EmailConfirmationToken';

export default interface EmailConfirmationTokenRepository {
  save(emailConfirmationToken: EmailConfirmationToken): Promise<void>;
  getTokensByUserId(userId: UUID): Promise<EmailConfirmationToken[]>;
}
