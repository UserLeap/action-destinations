import { Analytics, Context } from '@segment/analytics-next'
import sprigWebDestination from '../index'
import { identifyUserMock, signoutUserMock } from '../testHelpers'

describe('attributes: e2e test against staging (can see events, visitors, attributes on iOS test account)', () => {
  test('it sets attributes', async () => {
    const anonymousId = `anonymous-id-${Math.floor(Math.random() * 1000000000)}`
    const userId = `user-id-${Math.floor(Math.random() * 1000000000)}`
    const email = `has-user-id-and-2-attrs-${Math.floor(Math.random() * 1000000000)}@fakeemail.com`
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

    await new Promise((r) => setTimeout(r, 1000))

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

    await new Promise((r) => setTimeout(r, 2000))

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
})
