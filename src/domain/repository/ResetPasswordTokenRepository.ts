import { UUID } from 'crypto';

export default interface ResetPasswordTokenRepository {
  save(userId: UUID, token: string, expiresAt: Date): Promise<void>;
  getTokenByUserId(
    userId: UUID,
  ): Promise<{ token: string; expiresAt: Date } | null>;
}
