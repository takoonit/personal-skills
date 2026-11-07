import { IUserService } from './IUserService'
export class UserService implements IUserService {
  async getDisplayName(userId: string): Promise<string> { return `User ${userId}` }
}
