import nock from 'nock'
import { Analytics, Context } from '@segment/analytics-next'
import sprigWebDestination from '../index'
import { configResponse, identifyUserMock } from '../testHelpers'

describe('identifyUser test with mocked requests', () => {
  test('it loads and sets attributes including email and userId', async () => {
    const anonymousId = `anonymous-id-${Math.floor(Math.random() * 1000000000)}`
    const userId = `user-id-${Math.floor(Math.random() * 1000000000)}`
    const email = `email-${Math.floor(Math.random() * 1000000000)}@fakeemail.com`

    nock('https://api-staging.sprig.com')
      .persist()
      .options(/.*/)
      .reply(200, '', [
        'Date',
        'Wed, 08 Dec 2021 00:48:40 GMT',
        'Connection',
        'keep-alive',
        'vary',
        'Origin',
        'Access-Control-Allow-Origin',
        '*',
        'Access-Control-Allow-Headers',
        'Accept,Content-Type,authorization,*',
        'Access-Control-Allow-Methods',
        'GET,POST,PUT,PATCH,DELETE,OPTIONS,HEAD',
        'Access-Control-Max-Age',
        '3600',
        'Content-Length',
        '0'
      ])

    nock('https://api-staging.sprig.com')
      .get('/sdk/1/environments/testEnvId/config')
      .reply(200, configResponse, ['Access-Control-Allow-Origin', '*'])

    nock('https://api-staging.sprig.com', {
      reqheaders: {
        'x-ul-user-id': userId
      }
    })
      .put(/\/sdk\/1\/environments\/testEnvId\/visitors\/[\w-]*$/, { userId: userId })
      .reply(204, '', ['Access-Control-Allow-Origin', '*'])

    nock('https://api-staging.sprig.com', {
      reqheaders: {
        'x-ul-user-id': userId,
        'x-ul-anonymous-id': anonymousId
      }
    })
      .put(/\/sdk\/1\/environments\/testEnvId\/visitors\/[\w-]*\/attributes$/, { product: 'premium', '!email': email })
      .reply(204, '', ['Access-Control-Allow-Origin', '*'])

    const [identifyUser] = await sprigWebDestination({
      envId: 'testEnvId', // fake account
      subscriptions: [identifyUserMock]
    })

    await identifyUser.load(Context.system(), {} as Analytics)
    await identifyUser.identify?.(
      new Context({
        type: 'identify',
        anonymousId,
        userId,
        traits: {
          email,
          product: 'premium'
        }
      })
    )

    await new Promise((r) => setTimeout(r, 1000))
    expect(nock.isDone()).toBeTruthy()
    nock.cleanAll()
  })
})
