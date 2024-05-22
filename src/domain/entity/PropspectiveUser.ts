import { UUID } from 'crypto';

export default interface ProspectiveUser {
  id: UUID;
  email: string;
  firstName: string;
  lastName: string;
  passwordHash: string;
  emailConfirmed: false;
}
