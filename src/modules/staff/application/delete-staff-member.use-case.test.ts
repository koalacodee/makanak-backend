import { beforeEach, describe, expect, it, mock } from 'bun:test'
import type { IUserRepository } from '@/modules/auth/domain/auth.iface'
import type { User } from '@/modules/auth/domain/user.entity'
import { NotFoundError } from '../../../shared/presentation/errors'
import type { StaffMember } from '../domain/staff.entity'
import type { IStaffRepository } from '../domain/staff.iface'
import { DeleteStaffMemberUseCase } from './delete-staff-member.use-case'

describe('DeleteStaffMemberUseCase', () => {
  let useCase: DeleteStaffMemberUseCase
  let mockStaffRepo: IStaffRepository
  let mockUserRepo: IUserRepository

  beforeEach(() => {
    useCase = new DeleteStaffMemberUseCase()
    mockStaffRepo = {
      findAll: mock(() => Promise.resolve([])),
      findById: mock(() => Promise.resolve(null)),
      findByUserId: mock(() => Promise.resolve(null)),
      create: mock(() => Promise.resolve({} as StaffMember)),
      update: mock(() => Promise.resolve({} as StaffMember)),
      delete: mock(() => Promise.resolve()),
    }
    mockUserRepo = {
      findByUsername: mock(() => Promise.resolve(null)),
      findById: mock(() => Promise.resolve(null)),
      create: mock(() => Promise.resolve({} as User)),
      update: mock(() => Promise.resolve({} as User)),
      updateLastLogin: mock(() => Promise.resolve()),
      delete: mock(() => Promise.resolve()),
    }
  })

  it('should delete staff member and associated user successfully', async () => {
    const existingStaff: StaffMember = {
      id: 'staff-1',
      userId: 'user-1',
      name: 'John Doe',
      username: 'johndoe',
      role: 'admin',
      phone: null,
      activeOrders: null,
      specialization: null,
      isOnline: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    mockStaffRepo.findById = mock(() => Promise.resolve(existingStaff))
    mockStaffRepo.delete = mock(() => Promise.resolve())
    mockUserRepo.delete = mock(() => Promise.resolve())

    await useCase.execute('staff-1', mockStaffRepo, mockUserRepo)

    expect(mockStaffRepo.findById).toHaveBeenCalledWith('staff-1')
    expect(mockStaffRepo.delete).toHaveBeenCalledWith('staff-1')
    expect(mockUserRepo.delete).toHaveBeenCalledWith('user-1')
  })

  it('should throw NotFoundError when staff member not found', async () => {
    mockStaffRepo.findById = mock(() => Promise.resolve(null))

    await expect(
      useCase.execute('non-existent-id', mockStaffRepo, mockUserRepo),
    ).rejects.toThrow(NotFoundError)
    try {
      await useCase.execute('non-existent-id', mockStaffRepo, mockUserRepo)
    } catch (error: unknown) {
      if (error instanceof NotFoundError) {
        expect(error.details).toBeDefined()
        expect(error.details[0].message).toBe('Staff member not found')
      } else {
        throw error
      }
    }
    expect(mockStaffRepo.delete).not.toHaveBeenCalled()
    expect(mockUserRepo.delete).not.toHaveBeenCalled()
  })
})
