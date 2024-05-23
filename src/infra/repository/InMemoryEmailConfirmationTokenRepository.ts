import { UUID } from 'crypto';
import EmailConfirmationToken from '../../domain/entity/EmailConfirmationToken';
import EmailConfirmationTokenRepository from '../../domain/repository/EmailConfirmationTokenRepository';

export default class InMemoryEmailConfirmationTokenRepository
  implements EmailConfirmationTokenRepository
{
  private tokens: EmailConfirmationToken[] = [];
  async save(emailConfirmationToken: EmailConfirmationToken) {
    this.tokens.push(emailConfirmationToken);
  }
  async getTokensByUserId(userId: UUID) {
    return this.tokens.filter((token) => token.userId === userId);
  }
}
