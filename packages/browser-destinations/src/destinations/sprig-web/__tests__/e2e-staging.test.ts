import { Analytics, Context } from '@segment/analytics-next'
import sprigWebDestination, { destination } from '../index'
import { Subscription } from '../../../lib/browser-destinations'

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

describe('e2e test', () => {
  test('it correctly sets attributes, anonymous id, user id, and tracks event', async () => {
    const anonymousId = `anonymous-id-${Math.floor(Math.random() * 1000000000)}`
    const userId0 = `user-id-0-${Math.floor(Math.random() * 1000000000)}`
    // const userId1 = `user-id-1-${Math.floor(Math.random() * 1000000000)}`
    const x = await sprigWebDestination({
      envId: 'RpOLQFy3T', // Staging iOS Test Account
      subscriptions
    })

    // await new Promise((r) => setTimeout(r, 3000))
    // console.log('initial load', window.Sprig.visitorId)

    console.log(x)
    const [identifyUser, signoutUser, trackEvent, _updateUserId] = x

    await signoutUser.load(Context.system(), {} as Analytics)
    await signoutUser.track?.(
      new Context({
        type: 'track',
        event: 'Signed Out'
      })
    )

    await new Promise((r) => setTimeout(r, 3000))
    console.log('after signout 1', window.Sprig.visitorId)
    console.log('after signout 1', window.Sprig.logs)

    await signoutUser.track?.(
      new Context({
        type: 'track',
        event: 'Signed Out'
      })
    )

    await new Promise((r) => setTimeout(r, 3000))
    console.log('after signout 2', window.Sprig.visitorId)
    console.log('after signout 2', window.Sprig.logs)

    await trackEvent.load(Context.system(), {} as Analytics)
    await new Promise((r) => setTimeout(r, 1000))

    const visitorId = window.Sprig.visitorId
    expect(visitorId).toBeTruthy()

    await trackEvent.track?.(
      new Context({
        type: 'track',
        name: 'Button Clicked Event',
        event: 'Button Clicked Event',
        anonymousId
      })
    )
    // new anonymous ID updates visitor id

    await new Promise((r) => setTimeout(r, 3000))
    console.log(window.Sprig.visitorId)
    console.log('after track', window.Sprig.logs)

    await identifyUser.identify?.(
      new Context({
        type: 'identify',
        anonymousId,
        userId: userId0,
        traits: {
          email: 'test-email-1@gmail.com'
        }
      })
    )

    await new Promise((r) => setTimeout(r, 3000))

    console.log(window.Sprig.visitorId, window.Sprig.userId)
    expect(window.Sprig.userId).toEqual(userId0)
  }, 30000)
})

describe('trackEvent', () => {
  test('it maps event parameters correctly to track function ', async () => {
    const [trackEvent] = await sprigWebDestination({
      envId: 'RpOLQFy3T',
      subscriptions: [subscriptions[2]]
    })

    // destination.actions.trackEvent.perform = jest.fn()
    jest.spyOn(destination.actions.trackEvent, 'perform')
    await trackEvent.load(Context.system(), {} as Analytics)

    await trackEvent.track?.(
      new Context({
        type: 'track',
        name: 'Button Clicked 4',
        anonymousId: 'anonymous-id-2'
      })
    )

    await new Promise((r) => setTimeout(r, 5000))

    console.log(window.Sprig.partnerAnonymousId)
    console.log(window.Sprig.visitorId)
    console.log(window.Sprig)

    expect(destination.actions.trackEvent.perform).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        payload: { name: 'Button Clicked 4', anonymousId: 'anonymous-id-2' }
      })
    )
  }, 15000)
})
