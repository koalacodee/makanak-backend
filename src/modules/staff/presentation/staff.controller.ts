import { Elysia, t } from 'elysia'
import { authGuard } from '../../auth/presentation/auth.guard'
import { staffModule } from '../infrastructure/staff.module'
import {
  StaffMemberDto,
  StaffMemberInputDto,
  StaffMemberUpdateDto,
  StaffQueryDto,
  StaffStatusUpdateDto,
} from './staff.dto'

export const staffController = new Elysia({ prefix: '/staff' })
  .use(staffModule)
  .use(authGuard(['admin', 'cs']))
  .get(
    '/',
    async ({ query, getStaffUC, staffRepo }) => {
      const staff = await getStaffUC.execute(query.role, staffRepo)
      return staff.map((member) => ({
        id: member.id,
        name: member.name,
        username: member.username,
        role: member.role,
        phone: member.phone ?? undefined,
        activeOrders: member.activeOrders ?? undefined,
        specialization: member.specialization ?? undefined,
        isOnline: member.isOnline ?? undefined,
      }))
    },
    {
      query: StaffQueryDto,
      response: t.Array(StaffMemberDto),
    },
  )
  .get(
    '/:id',
    async ({ params, getStaffMemberUC, staffRepo }) => {
      const member = await getStaffMemberUC.execute(params.id, staffRepo)
      return {
        id: member.id,
        name: member.name,
        username: member.username,
        role: member.role,
        phone: member.phone ?? undefined,
        activeOrders: member.activeOrders ?? undefined,
        specialization: member.specialization ?? undefined,
        isOnline: member.isOnline ?? undefined,
      }
    },
    {
      params: t.Object({
        id: t.String({ format: 'uuid' }),
      }),
      response: StaffMemberDto,
    },
  )
  .post(
    '/',
    async ({ body, createStaffMemberUC, staffRepo, userRepo }) => {
      const member = await createStaffMemberUC.execute(
        {
          name: body.name,
          username: body.username,
          password: body.password,
          role: body.role,
          phone: body.phone,
          specialization: body.specialization,
        },
        staffRepo,
        userRepo,
      )
      return {
        id: member.id,
        name: member.name,
        username: member.username,
        role: member.role,
        phone: member.phone ?? undefined,
        activeOrders: member.activeOrders ?? undefined,
        specialization: member.specialization ?? undefined,
        isOnline: member.isOnline ?? undefined,
      }
    },
    {
      body: StaffMemberInputDto,
      response: StaffMemberDto,
    },
  )
  .put(
    '/:id',
    async ({ params, body, updateStaffMemberUC, staffRepo, userRepo }) => {
      const updateData: {
        name?: string
        username?: string
        password?: string
        role?: 'admin' | 'driver' | 'cs' | 'inventory'
        phone?: string
        specialization?: string
      } = {}
      if (body.name !== undefined) updateData.name = body.name
      if (body.username !== undefined) updateData.username = body.username
      if (body.password !== undefined) updateData.password = body.password
      if (body.role !== undefined) updateData.role = body.role
      if (body.phone !== undefined) updateData.phone = body.phone
      if (body.specialization !== undefined)
        updateData.specialization = body.specialization

      const member = await updateStaffMemberUC.execute(
        params.id,
        updateData,
        staffRepo,
        userRepo,
      )
      return {
        id: member.id,
        name: member.name,
        username: member.username,
        role: member.role,
        phone: member.phone ?? undefined,
        activeOrders: member.activeOrders ?? undefined,
        specialization: member.specialization ?? undefined,
        isOnline: member.isOnline ?? undefined,
      }
    },
    {
      params: t.Object({
        id: t.String({ format: 'uuid' }),
      }),
      body: StaffMemberUpdateDto,
      response: StaffMemberDto,
    },
  )
  .delete(
    '/:id',
    async ({ params, deleteStaffMemberUC, staffRepo, userRepo }) => {
      await deleteStaffMemberUC.execute(params.id, staffRepo, userRepo)
      return new Response(null, { status: 204 })
    },
    {
      params: t.Object({
        id: t.String({ format: 'uuid' }),
      }),
    },
  )
  .patch(
    '/:id/status',
    async ({ params, body, updateStaffStatusUC, staffRepo }) => {
      const member = await updateStaffStatusUC.execute(
        params.id,
        body.isOnline,
        staffRepo,
      )
      return {
        id: member.id,
        name: member.name,
        username: member.username,
        role: member.role,
        phone: member.phone ?? undefined,
        activeOrders: member.activeOrders ?? undefined,
        specialization: member.specialization ?? undefined,
        isOnline: member.isOnline ?? undefined,
      }
    },
    {
      params: t.Object({
        id: t.String({ format: 'uuid' }),
      }),
      body: StaffStatusUpdateDto,
      response: StaffMemberDto,
    },
  )
