import 'whatwg-fetch'

let instance: {
  router: Object,
  loginPromise: Promise<any>,
  enableLoginRecovery: boolean,
  endpoints: any[],
} = null

const defaultEndPoint = {
  request(req, url, options): string {
    return url
  },
  websocket(url, options): string {
    return url
  },
  login(req, res, url, options): Promise<any> {
    return null
  },
  feedback(req, res, url, options) {
  },
}

function getInstance() {
  if (!instance) {
    instance = {
      router: null,
      loginPromise: null,
      enableLoginRecovery: true,
      endpoints: [],
    }
  }
  return instance
}

function makeWebsocketUrl(url) {
  if (url[0] === '/') {
    url = window.location.origin + url
  }
  return url.replace("http", "ws")
}

function findEndPoint(protocol, url) {
  if (url[0] === "#") {
    return defaultEndPoint
  }
  const match = url.match(/[a-zA-Z0-9\-_@]*/)
  if (match) {
    const scheme = match[0]
    if (url[scheme.length] === ':') {
      for (const endpoint of instance.endpoints) {
        if (!endpoint.name || endpoint.name === scheme) return endpoint
      }
    }
  }
  return defaultEndPoint
}

export function addAPIEndPoints(new_endpoints: any) {
  const instance = getInstance()
  instance.endpoints.push(...new_endpoints)
}

export function websocketAPI(url, options): WebSocket {
  const endpoint = findEndPoint("ws", url) || defaultEndPoint
  return new WebSocket(makeWebsocketUrl(endpoint.websocket(url, options)))
}

export function fetchAPI(url, options): Promise<any> {
  const instance = getInstance()

  let hasLoginRecovery = instance.enableLoginRecovery && (!options || !options.noCredentials)
  const endpoint = findEndPoint("http", url) || defaultEndPoint

  const req = Object.assign({}, options)
  req.headers = {
    "Accept": "application/json",
    ...req.headers,
  }
  if (req.body) {
    req.method = req.method || "POST"
    if (req.body instanceof File) {
      req.headers["Content-Type"] = req.body.type
    }
    else if (req.body instanceof Object) {
      req.headers["Content-Type"] = "application/json"
      req.body = JSON.stringify(req.body)
    }
    else if (!req.headers["Content-Type"]) {
      req.headers["Content-Type"] = "text/plain"
    }
  }
  else {
    req.method = req.method || "GET"
  }

  const handleResponse = (res) => {
    return new Promise((resolve, reject) => {

      const respondError = function (error) {
        reject({ status: res.status, headers: res.headers, error })
      }

      const contentType = res.headers && res.headers.get("content-type")
      const isJson = contentType && contentType.toLowerCase().indexOf("application/json") !== -1

      if (res.status >= 200 && res.status < 300) {
        if (endpoint.feedback) {
          endpoint.feedback(req, res, url, options)
        }
        if (res.status === 204) {
          resolve({ status: res.status, headers: res.headers, json: isJson ? {} : undefined })
        }
        else if (req.useBlob) {
          return res.blob().then((blob) => {
            return resolve({ status: res.status, headers: res.headers, blob })
          }, respondError)
        }
        else {
          return res.text().then(function (text) {
            let json
            if (isJson) {
              try { json = isJson && JSON.parse(text) }
              catch (e) { return respondError(e) }
            }
            return resolve({ status: res.status, headers: res.headers, text, json })
          }, respondError)
        }
      }
      else if (res.status === 401 && hasLoginRecovery && endpoint.login) {
        if (!instance.loginPromise) {
          instance.loginPromise = endpoint.login(req, res, url, options)
          if (!instance.loginPromise) throw new Error()
        }
        instance.loginPromise.then(() => {
          instance.loginPromise = null
          hasLoginRecovery = false
          resolve(fetch(endpoint.request(req, url, options), req).then(handleResponse, handleResponse))
        }, (error) => {
          instance.loginPromise = null
          instance.enableLoginRecovery = false
          respondError(error)
        })
      }
      else if (isJson && res.json instanceof Function) {
        return res.json().then(respondError, () => {
          instance.enableLoginRecovery = false
          respondError(res.error)
        })
      }
      else {
        return respondError(res.error)
      }
    })
  }

  url = endpoint.prepare(url, req)
  return window.fetch(url, options).then(handleResponse, handleResponse)
}
