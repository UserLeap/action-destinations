import { Analytics, Context } from '@segment/analytics-next'
import sprigWebDestination from '../index'
import { identifyUserMock, signoutUserMock, trackEventMock } from '../testHelpers'

describe('signoutUser: e2e test against staging (can see events, visitors, attributes on iOS test account)', () => {
  test('it handles user sign out and tracks event', async () => {
    const anonymousId0 = `anonymous-id-0-${Math.floor(Math.random() * 1000000000)}`
    const anonymousId1 = `anonymous-id-1-${Math.floor(Math.random() * 1000000000)}`
    const userId = `logged-out-before-events-${Math.floor(Math.random() * 1000000000)}`
    const [identifyUser, signoutUser, trackEvent] = await sprigWebDestination({
      envId: 'RpOLQFy3T', // Staging iOS Test Account
      subscriptions: [identifyUserMock, signoutUserMock, trackEventMock]
    })

    await identifyUser.load(Context.system(), {} as Analytics)
    await identifyUser.identify?.(
      new Context({
        type: 'identify',
        anonymousId: anonymousId0,
        userId
      })
    )

    await new Promise((r) => setTimeout(r, 1000))
    const initialVisitorId = window.Sprig.visitorId
    expect(window.Sprig.partnerAnonymousId).toEqual(anonymousId0)
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
        name: 'Button Clicked Anonymously Event',
        event: 'Button Clicked Anonymously Event',
        anonymousId1
      })
    )

    await new Promise((r) => setTimeout(r, 1000))
    expect(window.Sprig.visitorId).not.toEqual(initialVisitorId)
    expect(window.Sprig.userId).toBeNull()
  }, 15000)
})
