import { UUID } from 'crypto';
import ResetPasswordTokenRepository from '../../domain/repository/ResetPasswordTokenRepository';

export default class InMemoryResetPasswordTokenRepository
  implements ResetPasswordTokenRepository
{
  private tokens: { userId: UUID; token: string; expiresAt: Date }[] = [];

  async save(userId: UUID, token: string, expiresAt: Date): Promise<void> {
    this.tokens.push({ userId, token, expiresAt });
  }
  async getTokenByUserId(userId: UUID) {
    const token = this.tokens.find((token) => token.userId === userId);
    return token ? { token: token.token, expiresAt: token.expiresAt } : null;
  }
}
