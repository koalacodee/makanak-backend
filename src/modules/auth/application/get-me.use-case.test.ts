import { beforeEach, describe, expect, it, mock } from 'bun:test'
import { NotFoundError } from '../../../shared/presentation/errors'
import type { IUserRepository } from '../domain/auth.iface'
import type { User } from '../domain/user.entity'
import { GetMeUseCase } from './get-me.use-case'

describe('GetMeUseCase', () => {
  let useCase: GetMeUseCase
  let mockRepo: IUserRepository

  beforeEach(() => {
    useCase = new GetMeUseCase()
    mockRepo = {
      findById: mock(() => Promise.resolve(null)),
      findByUsername: mock(() => Promise.resolve(null)),
      create: mock(() => Promise.resolve({} as User)),
      update: mock(() => Promise.resolve({} as User)),
      delete: mock(() => Promise.resolve()),
      updateLastLogin: mock(() => Promise.resolve()),
    }
  })

  it('should return user when found', async () => {
    const mockUser: User = {
      id: 'user-1',
      username: 'admin',
      passwordHash: 'hashed',
      role: 'admin',
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLoginAt: null,
    }

    mockRepo.findById = mock(() => Promise.resolve(mockUser))

    const result = await useCase.execute('user-1', mockRepo)

    expect(result).toEqual(mockUser)
    expect(mockRepo.findById).toHaveBeenCalledWith('user-1')
  })

  it('should throw NotFoundError when user not found', async () => {
    mockRepo.findById = mock(() => Promise.resolve(null))

    await expect(useCase.execute('user-1', mockRepo)).rejects.toThrow(
      NotFoundError,
    )
  })
})
