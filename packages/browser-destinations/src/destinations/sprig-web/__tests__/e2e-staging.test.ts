import { Analytics, Context } from '@segment/analytics-next'
import sprigWebDestination from '../index'
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
  test('it sets attributes', async () => {
    const anonymousId = `anonymous-id-${Math.floor(Math.random() * 1000000000)}`
    const userId = `user-id-${Math.floor(Math.random() * 1000000000)}`
    const email = `email-${Math.floor(Math.random() * 1000000000)}@fakeemail.com`
    const [identifyUser, signoutUser, _trackEvent, _updateUserId] = await sprigWebDestination({
      envId: 'RpOLQFy3T', // Staging iOS Test Account
      subscriptions
    })

    await signoutUser.load(Context.system(), {} as Analytics)
    await signoutUser.track?.(
      new Context({
        type: 'track',
        event: 'Signed Out'
      })
    )

    await identifyUser.identify?.(
      new Context({
        type: 'identify',
        anonymousId,
        traits: {
          email,
          state: 'California'
        }
      })
    )

    await new Promise((r) => setTimeout(r, 3000))

    const initialVisitorId = window.Sprig.visitorId
    expect(window.Sprig.partnerAnonymousId).toEqual(anonymousId)
    expect(window.Sprig.userId).toBeNull()

    await identifyUser.identify?.(
      new Context({
        type: 'identify',
        anonymousId,
        userId,
        traits: {
          product: 'premium'
        }
      })
    )

    await new Promise((r) => setTimeout(r, 3000))

    expect(window.Sprig.visitorId).toEqual(initialVisitorId)
    expect(window.Sprig.partnerAnonymousId).toEqual(anonymousId)
    expect(window.Sprig.userId).toEqual(userId)
  }, 30000)

  test('it updates userId without changing visitorId', async () => {
    const anonymousId = `anonymous-id-${Math.floor(Math.random() * 1000000000)}`
    const userId0 = `user-id-0-${Math.floor(Math.random() * 1000000000)}`
    const userId1 = `user-id-1-${Math.floor(Math.random() * 1000000000)}`
    const [identifyUser, signoutUser, _trackEvent, updateUserId] = await sprigWebDestination({
      envId: 'RpOLQFy3T', // Staging iOS Test Account
      subscriptions
    })

    await signoutUser.load(Context.system(), {} as Analytics)
    await signoutUser.track?.(
      new Context({
        type: 'track',
        event: 'Signed Out'
      })
    )

    await identifyUser.identify?.(
      new Context({
        type: 'identify',
        anonymousId,
        userId: userId0
      })
    )

    await new Promise((r) => setTimeout(r, 3000))

    const initialVisitorId = window.Sprig.visitorId
    expect(window.Sprig.userId).toEqual(userId0)

    await updateUserId.alias?.(
      new Context({
        type: 'alias',
        userId: userId1
      })
    )

    await new Promise((r) => setTimeout(r, 3000))

    expect(window.Sprig.visitorId).toEqual(initialVisitorId)
    expect(window.Sprig.userId).toEqual(userId1)
  }, 30000)

  test('it handles user sign out and tracks event', async () => {
    const anonymousId = `anonymous-id-${Math.floor(Math.random() * 1000000000)}`
    const userId = `user-id-${Math.floor(Math.random() * 1000000000)}`
    const [identifyUser, signoutUser, trackEvent, _updateUserId] = await sprigWebDestination({
      envId: 'RpOLQFy3T', // Staging iOS Test Account
      subscriptions
    })

    await identifyUser.load(Context.system(), {} as Analytics)
    await identifyUser.identify?.(
      new Context({
        type: 'identify',
        anonymousId,
        userId
      })
    )

    await new Promise((r) => setTimeout(r, 3000))
    const initialVisitorId = window.Sprig.visitorId
    expect(window.Sprig.partnerAnonymousId).toEqual(anonymousId)
    expect(window.Sprig.userId).toEqual(userId)

    await signoutUser.track?.(
      new Context({
        type: 'track',
        event: 'Signed Out'
      })
    )

    await trackEvent.track?.(
      new Context({
        type: 'track',
        name: 'Button Clicked Event',
        event: 'Button Clicked Event',
        anonymousId
      })
    )

    await new Promise((r) => setTimeout(r, 3000))
    expect(window.Sprig.visitorId).not.toEqual(initialVisitorId)
    expect(window.Sprig.userId).toBeNull()
  }, 30000)

  // test('it correctly sets attributes, anonymous id, user id, and tracks event', async () => {
  //   const anonymousId = `anonymous-id-${Math.floor(Math.random() * 1000000000)}`
  //   const userId0 = `user-id-0-${Math.floor(Math.random() * 1000000000)}`
  //   // const userId1 = `user-id-1-${Math.floor(Math.random() * 1000000000)}`
  //   const x = await sprigWebDestination({
  //     envId: 'RpOLQFy3T', // Staging iOS Test Account
  //     subscriptions
  //   })

  //   // await new Promise((r) => setTimeout(r, 3000))
  //   // console.log('initial load', window.Sprig.visitorId)

  //   console.log(x)
  //   const [identifyUser, signoutUser, trackEvent, _updateUserId] = x

  //   await signoutUser.load(Context.system(), {} as Analytics)
  //   await signoutUser.track?.(
  //     new Context({
  //       type: 'track',
  //       event: 'Signed Out'
  //     })
  //   )

  //   await new Promise((r) => setTimeout(r, 3000))
  //   console.log('after signout 1', window.Sprig.visitorId)
  //   console.log('after signout 1', window.Sprig.logs)

  //   await signoutUser.track?.(
  //     new Context({
  //       type: 'track',
  //       event: 'Signed Out'
  //     })
  //   )

  //   await new Promise((r) => setTimeout(r, 3000))
  //   console.log('after signout 2', window.Sprig.visitorId)
  //   console.log('after signout 2', window.Sprig.logs)

  //   await trackEvent.load(Context.system(), {} as Analytics)
  //   await new Promise((r) => setTimeout(r, 1000))

  //   const visitorId = window.Sprig.visitorId
  //   expect(visitorId).toBeTruthy()

  //   await trackEvent.track?.(
  //     new Context({
  //       type: 'track',
  //       name: 'Button Clicked Event',
  //       event: 'Button Clicked Event',
  //       anonymousId
  //     })
  //   )
  //   // new anonymous ID updates visitor id

  //   await new Promise((r) => setTimeout(r, 3000))
  //   console.log(window.Sprig.visitorId)
  //   console.log('after track', window.Sprig.logs)

  //   await identifyUser.identify?.(
  //     new Context({
  //       type: 'identify',
  //       anonymousId,
  //       userId: userId0,
  //       traits: {
  //         email: 'test-email-1@gmail.com',

  //       }
  //     })
  //   )

  //   await new Promise((r) => setTimeout(r, 3000))

  //   console.log(window.Sprig.visitorId, window.Sprig.userId)
  //   expect(window.Sprig.userId).toEqual(userId0)
  // }, 30000)
})
