import { UUID } from 'crypto';

export default interface EmailConfirmationToken {
  userId: UUID;
  token: string;
  expiresAt: Date;
}
