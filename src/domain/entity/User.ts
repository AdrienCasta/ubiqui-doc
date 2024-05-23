import { UUID } from 'crypto';

export default interface User {
  id: UUID;
  email: string;
  firstName: string;
  lastName: string;
  passwordHash: string;
  emailConfirmed: boolean;
}
