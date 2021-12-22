import { Analytics, Context } from '@segment/analytics-next'
import sprigWebDestination from '../index'
import { identifyUserMock, signoutUserMock, updateUserIdMock } from '../testHelpers'

describe('updateUserId: e2e test against staging (can see events, visitors, attributes on iOS test account)', () => {
  test('it updates userId without changing visitorId', async () => {
    const anonymousId = `anonymous-id-${Math.floor(Math.random() * 1000000000)}`
    const userId0 = `user-id-0-${Math.floor(Math.random() * 1000000000)}`
    const userId1 = `updated-user-id-${Math.floor(Math.random() * 1000000000)}`
    const email = `has-updated-user-id-${Math.floor(Math.random() * 1000000000)}@fakeemail.com`
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

    await new Promise((r) => setTimeout(r, 1000))

    await identifyUser.identify?.(
      new Context({
        type: 'identify',
        anonymousId,
        userId: userId0,
        traits: {
          email
        }
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
})
