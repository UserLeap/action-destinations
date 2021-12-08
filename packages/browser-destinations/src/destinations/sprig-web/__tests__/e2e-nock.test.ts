import nock from 'nock'
import { Analytics, Context } from '@segment/analytics-next'
import sprigWebDestination from '../index'
import { Subscription } from '../../../lib/browser-destinations'

const configResponse = {
  border: '#cccccc',
  pageUrlEvents: [],
  interactiveEvents: [],
  maxAttrNameLength: 255,
  maxAttrValueLength: 255,
  maxEventLength: 255,
  maxEmailLength: 255,
  maxUserIdLength: 255,
  showSurveyBrand: true,
  dismissOnPageChange: true,
  framePosition: 'center',
  customStyles: '',
  overlayStyle: 'dark',
  exitOnOverlayClick: true,
  slugName: 'ios_test_account',
  marketingUrl: 'https://sprig.com/index.html'
}

const subscriptions: Subscription[] = [
  {
    partnerAction: 'identifyUser',
    name: 'Identify User',
    enabled: true,
    subscribe: 'type = "identify"',
    mapping: {
      anonymousId: {
        '@path': '$.anonymousId'
      },
      userId: {
        '@path': '$.userId'
      },
      traits: {
        '@path': '$.traits'
      }
    }
  },
  {
    partnerAction: 'signoutUser',
    name: 'Sign Out User',
    enabled: true,
    subscribe: 'type = "track" and event = "Signed Out"',
    mapping: {}
  },
  {
    partnerAction: 'trackEvent',
    name: 'Track Event',
    enabled: true,
    subscribe: 'type = "track" and event != "Signed Out"',
    mapping: {
      name: {
        '@path': '$.name'
      },
      anonymousId: {
        '@path': '$.anonymousId'
      }
    }
  },
  {
    partnerAction: 'updateUserId',
    name: 'Update User ID',
    enabled: true,
    subscribe: 'type = "alias"',
    mapping: {
      anonymousId: {
        '@path': '$.anonymousId'
      },
      userId: {
        '@path': '$.userId'
      }
    }
  }
]

describe('e2e test with mocked requests', () => {
  test('it sets attributes', async () => {
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

    const [identifyUser, _signoutUser, _trackEvent, _updateUserId] = await sprigWebDestination({
      envId: 'testEnvId', // fake account
      subscriptions
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

  // test('it updates userId without changing visitorId', async () => {
  //   const anonymousId = `anonymous-id-${Math.floor(Math.random() * 1000000000)}`
  //   const userId0 = `user-id-0-${Math.floor(Math.random() * 1000000000)}`
  //   const userId1 = `user-id-1-${Math.floor(Math.random() * 1000000000)}`
  //   const [identifyUser, signoutUser, _trackEvent, updateUserId] = await sprigWebDestination({
  //     envId: 'RpOLQFy3T', // Staging iOS Test Account
  //     subscriptions
  //   })

  //   await signoutUser.load(Context.system(), {} as Analytics)
  //   await signoutUser.track?.(
  //     new Context({
  //       type: 'track',
  //       event: 'Signed Out'
  //     })
  //   )

  //   await identifyUser.identify?.(
  //     new Context({
  //       type: 'identify',
  //       anonymousId,
  //       userId: userId0
  //     })
  //   )

  //   await new Promise((r) => setTimeout(r, 1000))

  //   const initialVisitorId = window.Sprig.visitorId
  //   expect(window.Sprig.userId).toEqual(userId0)

  //   await updateUserId.alias?.(
  //     new Context({
  //       type: 'alias',
  //       userId: userId1
  //     })
  //   )

  //   await new Promise((r) => setTimeout(r, 1000))

  //   expect(window.Sprig.visitorId).toEqual(initialVisitorId)
  //   expect(window.Sprig.userId).toEqual(userId1)
  // }, 15000)

  // test('it handles user sign out and tracks event', async () => {
  //   const anonymousId = `anonymous-id-${Math.floor(Math.random() * 1000000000)}`
  //   const userId = `user-id-${Math.floor(Math.random() * 1000000000)}`
  //   const [identifyUser, signoutUser, trackEvent, _updateUserId] = await sprigWebDestination({
  //     envId: 'RpOLQFy3T', // Staging iOS Test Account
  //     subscriptions
  //   })

  //   await identifyUser.load(Context.system(), {} as Analytics)
  //   await identifyUser.identify?.(
  //     new Context({
  //       type: 'identify',
  //       anonymousId,
  //       userId
  //     })
  //   )

  //   await new Promise((r) => setTimeout(r, 1000))
  //   const initialVisitorId = window.Sprig.visitorId
  //   expect(window.Sprig.partnerAnonymousId).toEqual(anonymousId)
  //   expect(window.Sprig.userId).toEqual(userId)

  //   await signoutUser.track?.(
  //     new Context({
  //       type: 'track',
  //       event: 'Signed Out'
  //     })
  //   )

  //   await trackEvent.track?.(
  //     new Context({
  //       type: 'track',
  //       name: 'Button Clicked Event',
  //       event: 'Button Clicked Event',
  //       anonymousId
  //     })
  //   )

  //   await new Promise((r) => setTimeout(r, 1000))
  //   expect(window.Sprig.visitorId).not.toEqual(initialVisitorId)
  //   expect(window.Sprig.userId).toBeNull()
  // }, 15000)
})
