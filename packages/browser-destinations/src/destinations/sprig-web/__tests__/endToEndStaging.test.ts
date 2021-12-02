import { Analytics, Context } from '@segment/analytics-next'
import sprigWebDestination from '../index'
import { identifyUserMock, signoutUserMock, trackEventMock, updateUserIdMock } from '../testHelpers'

describe('e2e test against staging (can see events, visitors, attributes on iOS test account)', () => {
  test('it sets attributes', async () => {
    const anonymousId = `anonymous-id-${Math.floor(Math.random() * 1000000000)}`
    const userId = `user-id-${Math.floor(Math.random() * 1000000000)}`
    const email = `email-${Math.floor(Math.random() * 1000000000)}@fakeemail.com`
    const [identifyUser, signoutUser] = await sprigWebDestination({
      envId: 'RpOLQFy3T', // Staging iOS Test Account
      subscriptions: [identifyUserMock, signoutUserMock]
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

    await new Promise((r) => setTimeout(r, 1000))

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

    await new Promise((r) => setTimeout(r, 1000))

    expect(window.Sprig.visitorId).toEqual(initialVisitorId)
    expect(window.Sprig.partnerAnonymousId).toEqual(anonymousId)
    expect(window.Sprig.userId).toEqual(userId)
  }, 15000)

  test('it updates userId without changing visitorId', async () => {
    const anonymousId = `anonymous-id-${Math.floor(Math.random() * 1000000000)}`
    const userId0 = `user-id-0-${Math.floor(Math.random() * 1000000000)}`
    const userId1 = `user-id-1-${Math.floor(Math.random() * 1000000000)}`
    const [identifyUser, signoutUser, updateUserId] = await sprigWebDestination({
      envId: 'RpOLQFy3T', // Staging iOS Test Account
      subscriptions: [identifyUserMock, signoutUserMock, updateUserIdMock]
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

    await new Promise((r) => setTimeout(r, 1000))

    const initialVisitorId = window.Sprig.visitorId
    expect(window.Sprig.userId).toEqual(userId0)

    await updateUserId.alias?.(
      new Context({
        type: 'alias',
        userId: userId1
      })
    )

    await new Promise((r) => setTimeout(r, 1000))

    expect(window.Sprig.visitorId).toEqual(initialVisitorId)
    expect(window.Sprig.userId).toEqual(userId1)
  }, 15000)

  test('it handles user sign out and tracks event', async () => {
    const anonymousId = `anonymous-id-${Math.floor(Math.random() * 1000000000)}`
    const userId = `user-id-${Math.floor(Math.random() * 1000000000)}`
    const [identifyUser, signoutUser, trackEvent] = await sprigWebDestination({
      envId: 'RpOLQFy3T', // Staging iOS Test Account
      subscriptions: [identifyUserMock, signoutUserMock, trackEventMock]
    })

    await identifyUser.load(Context.system(), {} as Analytics)
    await identifyUser.identify?.(
      new Context({
        type: 'identify',
        anonymousId,
        userId
      })
    )

    await new Promise((r) => setTimeout(r, 1000))
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

    await new Promise((r) => setTimeout(r, 1000))
    expect(window.Sprig.visitorId).not.toEqual(initialVisitorId)
    expect(window.Sprig.userId).toBeNull()
  }, 15000)
})
