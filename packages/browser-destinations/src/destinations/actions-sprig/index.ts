import type { Settings } from './generated-types'
import type { BrowserDestinationDefinition } from '../../lib/browser-destinations'
import { browserDestination } from '../../runtime/shim'
import { Sprig } from './types'

import trackEvent from './trackEvent'

import identifyUser from './identifyUser'

declare global {
  interface Window {
    Sprig: Sprig
  }
}

export const destination: BrowserDestinationDefinition<Settings, Sprig> = {
  name: 'Sprig',
  slug: 'actions-sprig',
  mode: 'device',

  settings: {
    envId: {
      description: 'Your environment ID (production or development).',
      label: 'Environment ID',
      type: 'string',
      required: true
    },
    debugMode: {
      description: 'Enable debug mode for testing purposes.',
      label: 'Debug mode',
      type: 'boolean',
      required: false,
      default: false
    }
  },

  actions: {
    trackEvent,
    identifyUser
  },

  initialize: async ({ settings }, deps) => {
    console.log('got here')
    if (!window.Sprig || !window.Sprig.envId) {
      window.Sprig = function (...args) {
        S._queue && S._queue.push(args)
      }
      const S = window.Sprig
      S.envId = settings.envId
      S._queue = []
      await deps.loadScript(`https://cdn.sprig.com/shim.js?id=${S.envId}`)
    }

    return window.Sprig
  },

  actions: {}
}

export default browserDestination(destination)
