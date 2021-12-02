import { Subscription } from '../../lib/browser-destinations'

export const configResponse = {
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

export const identifyUserMock: Subscription = {
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
}

export const signoutUserMock: Subscription = {
  partnerAction: 'signoutUser',
  name: 'Sign Out User',
  enabled: true,
  subscribe: 'type = "track" and event = "Signed Out"',
  mapping: {}
}

export const trackEventMock: Subscription = {
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
    },
    userId: {
      '@path': '$.userId'
    }
  }
}

export const updateUserIdMock: Subscription = {
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
