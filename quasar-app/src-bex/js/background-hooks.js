/* eslint-disable */

import Peer from 'peerjs'

export default function attachBackgroundHooks (bridge /* , allActiveConnections */) {

  let peer = null
  let conn = null

  bridge.on('storage.get', event => {
    const payload = event.data
    if (payload.key === null) {
      chrome.storage.local.get(null, r => {
        const result = []

        // Group the items up into an array to take advantage of the bridge's chunk splitting.
        for (const itemKey in r) {
          result.push(r[itemKey])
        }
        bridge.send(event.eventResponseKey, result)
      })
    } else {
      chrome.storage.local.get([payload.key], r => {
        bridge.send(event.eventResponseKey, r[payload.key])
      })
    }
  })

  bridge.on('storage.set', event => {
    const payload = event.data
    chrome.storage.local.set({ [payload.key]: payload.data }, () => {
      bridge.send(event.eventResponseKey, payload.data)
    })
  })

  bridge.on('storage.remove', event => {
    const payload = event.data
    chrome.storage.local.remove(payload.key, () => {
      bridge.send(event.eventResponseKey, payload.data)
    })
  })

  bridge.on('peer.start', event => {
    peer = new Peer(event.data.peerId)
    peer.on('connection', connection => {
      conn = connection
      bridge.send('peer.connected')
      conn.on('data', data => {
        bridge.send('peer.data', data)
      })
      conn.on('close', () => {
        bridge.send('peer.closed')
      })
      conn.on('error', () => {
        bridge.send('peer.error')
      })
    })
  })

  bridge.on('send.data', async (event) => {
    const payload = event.data
    await conn.send(payload)
  })

  bridge.on('open.link', event => {
    chrome.tabs.create({ url: event.data.url });
  })

  bridge.on('stop.app', () => {
    conn.close()
  })

  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({ id: 'tab', title: 'Send Tab to Device', contexts: ['page'] })
    chrome.contextMenus.create({ id: 'text', title: 'Send Text To Device', contexts: ['selection', 'link'] })
    chrome.contextMenus.onClicked.addListener(async (tab) => {
      const payload = {
        type: tab.menuItemId === 'tab' ? 'link' : 'clipboard',
        text: tab.menuItemId === 'tab' ? tab.pageUrl : tab.selectionText
      }
      try {
        await conn.send(payload)
      } catch (err) {
        console.log(err)
      }
    })
  })

  chrome.tabs.onRemoved.addListener((tab, info) => {
    alert(Object.getOwnPropertyNames(info))
    // alert(info.windowId)
    conn.close()
  })
}
