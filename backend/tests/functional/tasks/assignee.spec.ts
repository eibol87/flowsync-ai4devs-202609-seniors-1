import Task from '#models/task'
import User from '#models/user'
import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'

/**
 * Lo que cada tarea muestra de su responsable. Cubre los tres scenarios del
 * requisito «Lo que cada tarea muestra de su responsable» de
 * `openspec/specs/tasks/spec.md`: el responsable identificable, la tarea que
 * no filtra datos de cuenta y el responsable sin nombre.
 */
test.group('Tareas | responsable', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  const HOY = '2026-10-07'
  const DATOS_DE_ACCESO = ['email', 'password', 'rememberMeToken', 'token', 'tokens']

  async function sesion(client: any, email = 'ada@example.com') {
    const response = await client.post('/api/v1/auth/login').json({ email, password: 'secreto123' })

    return response.body().data.token as string
  }

  async function tareaDe(fullName: string | null, email = 'ada@example.com') {
    const user = await User.create({ fullName, email, password: 'secreto123' })
    const tarea = await Task.create({
      title: 'Escribir el informe',
      status: 'pending',
      assigneeId: user.id,
    })

    return { user, tarea }
  }

  test('el responsable de una tarea trae su nombre y sus iniciales', async ({ client, assert }) => {
    const { tarea } = await tareaDe('Ada Lovelace')
    const token = await sesion(client)

    const suelta = await client
      .get(`/api/v1/tasks/${tarea.id}`)
      .qs({ today: HOY })
      .header('Authorization', `Bearer ${token}`)
    const lista = await client.get('/api/v1/tasks').header('Authorization', `Bearer ${token}`)

    suelta.assertStatus(200)
    lista.assertStatus(200)

    for (const assignee of [suelta.body().data.assignee, lista.body().data[0].assignee]) {
      assert.equal(assignee.fullName, 'Ada Lovelace')
      assert.equal(assignee.initials, 'AL')
    }
  })

  test('el responsable de una tarea no incluye el email ni datos de acceso', async ({
    client,
    assert,
  }) => {
    const { tarea } = await tareaDe('Ada Lovelace')
    const token = await sesion(client)

    const suelta = await client
      .get(`/api/v1/tasks/${tarea.id}`)
      .qs({ today: HOY })
      .header('Authorization', `Bearer ${token}`)
    const lista = await client.get('/api/v1/tasks').header('Authorization', `Bearer ${token}`)

    suelta.assertStatus(200)
    lista.assertStatus(200)

    for (const assignee of [suelta.body().data.assignee, lista.body().data[0].assignee]) {
      for (const campo of DATOS_DE_ACCESO) {
        assert.notProperty(assignee, campo)
      }
      assert.notInclude(JSON.stringify(assignee), 'ada@example.com')
    }
  })

  test('un responsable sin nombre llega con nombre nulo e iniciales', async ({
    client,
    assert,
  }) => {
    const { tarea } = await tareaDe(null)
    const token = await sesion(client)

    const suelta = await client
      .get(`/api/v1/tasks/${tarea.id}`)
      .qs({ today: HOY })
      .header('Authorization', `Bearer ${token}`)
    const lista = await client.get('/api/v1/tasks').header('Authorization', `Bearer ${token}`)

    suelta.assertStatus(200)
    lista.assertStatus(200)

    for (const assignee of [suelta.body().data.assignee, lista.body().data[0].assignee]) {
      assert.isNull(assignee.fullName)
      assert.equal(assignee.initials, 'AE')
    }
  })
})
