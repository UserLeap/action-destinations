import { Analytics, Context } from '@segment/analytics-next'
import sprigWebDestination, { destination } from '../../index'
import { Subscription } from '../../../../lib/browser-destinations'

const subscriptions: Subscription[] = [
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

describe('trackEvent', () => {
  test('it maps event parameters correctly to track function ', async () => {
    const [trackEvent] = await sprigWebDestination({
      envId: 'RpOLQFy3T',
      subscriptions
    })

    // destination.actions.trackEvent.perform = jest.fn()
    jest.spyOn(destination.actions.trackEvent, 'perform')
    await trackEvent.load(Context.system(), {} as Analytics)

    await trackEvent.track?.(
      new Context({
        type: 'track',
        name: 'Button Clicked',
        anonymousId: 'anonymous-id-0'
      })
    )

    await new Promise((r) => setTimeout(r, 3000))

    console.log(window.Sprig.partnerAnonymousId)

    expect(destination.actions.trackEvent.perform).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        payload: { name: 'Button Clicked', anonymousId: 'anonymous-id-0' }
      })
    )
  })
})
