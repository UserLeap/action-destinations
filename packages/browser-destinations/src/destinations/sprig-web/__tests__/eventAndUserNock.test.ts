import nock from 'nock'
import { Analytics, Context } from '@segment/analytics-next'
import sprigWebDestination from '../index'
import { configResponse, signoutUserMock, trackEventMock, updateUserIdMock } from '../testHelpers'

describe('updateUserId, trackEvent, signoutUser test with mocked requests', () => {
  test('it tracks events and removes userId after signout', async () => {
    const anonymousId0 = `anonymous-id-0-${Math.floor(Math.random() * 1000000000)}`
    const anonymousId1 = `anonymous-id-1-${Math.floor(Math.random() * 1000000000)}`
    const userId = `user-id-${Math.floor(Math.random() * 1000000000)}`

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
        'x-ul-anonymous-id': anonymousId0
      }
    })
      .post(/\/sdk\/1\/visitors\/[\w-]*\/events$/, { event: 'Button Clicked', metadata: { url: /.+/i } })
      .reply(200, {}, ['Access-Control-Allow-Origin', '*'])

    nock('https://api-staging.sprig.com', {
      reqheaders: {
        'x-ul-anonymous-id': anonymousId1
      },
      badheaders: ['x-ul-user-id']
    })
      .post(/\/sdk\/1\/visitors\/[\w-]*\/events$/, { event: 'Button Clicked Anonymously', metadata: { url: /.+/i } })
      .reply(200, {}, ['Access-Control-Allow-Origin', '*'])

    const [signoutUser, trackEvent, updateUserId] = await sprigWebDestination({
      envId: 'testEnvId', // Staging iOS Test Account
      subscriptions: [signoutUserMock, trackEventMock, updateUserIdMock]
    })

    await updateUserId.load(Context.system(), {} as Analytics)
    await updateUserId.alias?.(
      new Context({
        type: 'alias',
        userId
      })
    )

    await trackEvent.track?.(
      new Context({
        type: 'track',
        name: 'Button Clicked',
        event: 'Button Clicked',
        anonymousId: anonymousId0,
        userId
      })
    )

    await signoutUser.track?.(
      new Context({
        type: 'track',
        event: 'Signed Out'
      })
    )

    await trackEvent.track?.(
      new Context({
        type: 'track',
        name: 'Button Clicked Anonymously',
        event: 'Button Clicked Anonymously',
        anonymousId: anonymousId1
      })
    )

    await new Promise((r) => setTimeout(r, 1000))
    expect(nock.isDone()).toBeTruthy()
    nock.cleanAll()
  }, 15000)
})
