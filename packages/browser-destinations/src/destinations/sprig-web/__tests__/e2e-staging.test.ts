import { Analytics, Context } from '@segment/analytics-next'
import sprigWebDestination from '../index'
import { Subscription } from '../../../lib/browser-destinations'

const subscriptions: Subscription[] = [
  {
    partnerAction: 'aliasUser',
    name: 'Alias User',
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
  },
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
    partnerAction: 'trackEvent',
    name: 'Track Event',
    enabled: true,
    subscribe: 'type = "track"',
    mapping: {
      name: {
        '@path': '$.name'
      },
      anonymousId: {
        '@path': '$.anonymousId'
      }
    }
  }
]

describe('e2e test', () => {
  test('it correctly sets attributes, anonymous id, user id, and tracks event', async () => {
    const anonymousId = `anonymous-id-${Math.floor(Math.random() * 1000000000)}`
    const userId0 = `user-id-0-${Math.floor(Math.random() * 1000000000)}`
    // const userId1 = `user-id-1-${Math.floor(Math.random() * 1000000000)}`
    const [_, identifyUser, trackEvent] = await sprigWebDestination({
      envId: 'RpOLQFy3T', // Staging iOS Test Account
      subscriptions
    })

    await trackEvent.load(Context.system(), {} as Analytics)
    await new Promise((r) => setTimeout(r, 1000))

    const visitorId = window.Sprig.visitorId
    expect(visitorId).toBeTruthy()

    await trackEvent.track?.(
      new Context({
        type: 'track',
        name: 'Button Clicked Anonymously',
        anonymousId
      })
    )

    await new Promise((r) => setTimeout(r, 3000))
    console.log(window.Sprig)
    expect(window.Sprig.partnerAnonymousId).toEqual(anonymousId)
    expect(window.Sprig.visitorId).toEqual(visitorId)

    await identifyUser.identify?.(
      new Context({
        type: 'identify',
        anonymousId,
        userId: userId0,
        traits: {
          email: 'test-email-0@gmail.com'
        }
      })
    )

    await new Promise((r) => setTimeout(r, 1000))

    expect(window.Sprig.userId).toEqual(userId0)
    expect(window.Sprig.visitorId).toEqual(visitorId)
  })
})
