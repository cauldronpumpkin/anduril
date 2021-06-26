<template>
  <div class="row">
    <div class="col-6">
      <div>
        hi
      </div>
    </div>
    <div class="col-6 WAL position-relative bg-grey-10" :style="style">
      <q-layout view="lHh Lpr lFf" class="WAL__layout shadow-3 bg-grey-10 text-white" container ref="scroll">
        <q-header elevated>
          <q-toolbar class="bg-amber-5 text-black">
            <q-btn round flat>
            </q-btn>
            <q-space/>
          </q-toolbar>
        </q-header>
        <div class="messanger">
          <ul class="messanger-list" style="list-style-type:none;">
            <Message v-for="(mess, i) in chat_messages" :key="i" v-bind="mess" />
          </ul>
        </div>
        <q-footer>
          <q-toolbar class="bg-grey-9 text-black row">
            <input type="file" id="selectedFile" style="display: none;" @change="sendFileToPeer"/>
            <q-btn flat round icon="attachment" size="md" @click="clickFilePicker"/>
            <q-input autogrow rounded outlined dense class="WAL__field col-grow q-mr-sm" bg-color="white" v-model="chat_send_message" placeholder="Type a message" />
            <q-btn round flat icon="send" @click="sendMessageToPeer"/>
          </q-toolbar>
        </q-footer>
      </q-layout>
    </div>
  </div>
</template>

<script>
import Message from '../components/Message.vue'

export default {
  name: 'ChatLayout',
  components: { Message },
  data () {
    return {
      socket: null,
      leftDrawerOpen: false,
      search: '',
      chat_send_message: '',
      chat_messages: [],
      fileBase64: {},
      limit: Math.pow(2, 20)
    }
  },

  computed: {
    style () {
      return {
        height: this.$q.screen.height + 'px'
      }
    }
  },

  created () {
    this.$q.bex.on('peer.data', async (event) => {
      const data = event.data
      if (data.type === 'file') {
        if (data.chunk_num === 0) {
          this.fileBase64[data.name] = ['']
        }
        if (!data.more) {
          this.chat_messages.push({
            payload: data.name,
            type: 'file',
            cltype: 'common-message is-other'
          })
          this.checkForMIMEType({
            content: this.fileBase64[data.name].join(''),
            mimetype: data.mimetype
          })
          delete this.fileBase64[data.name]
        } else {
          if (this.fileBase64[data.name][this.fileBase64[data.name].length - 1].length > this.limit) {
            this.fileBase64[data.name].push('')
          }
          this.fileBase64[data.name][this.fileBase64[data.name].length - 1] += data.data
        }
      } else if (data.type === 'chat') {
        this.chat_messages.push({
          payload: data.text,
          type: 'chat',
          cltype: 'common-message is-other'
        })
      } else if (data.type === 'notification') {
        this.recieveNotification(data)
      } else if (data.type === 'link') {
        this.$q.bex.send('open.link', { url: data.text })
        this.chat_messages.push({
          payload: data.text,
          type: 'link',
          cltype: 'common-message is-other'
        })
      } else if (data.type === 'clipboard') {
        await navigator.clipboard.writeText(data.text)
      } else if (data.type === 'fs') {
        console.log('received fs info')
      }
    })

    this.$q.bex.on('peer.closed', () => {
      alert('The Connection was Closed!')
      this.$router.replace('/')
    })

    this.$q.bex.on('peer.error', () => {
      alert('The Connection was interrupted!')
      this.$router.replace('/')
    })
  },

  beforeDestroy () {
    this.$q.bex.send('stop.app')
    this.$q.bex.off('peer.data')
    this.$q.bex.off('peer.closed')
    this.$q.bex.off('peer.error')
  },

  methods: {
    recieveNotification (data) {
      const options = {
        subtitle: 'Subtitle of the Notification',
        body: data.text,
        silent: false,
        icon: 'https://firebasestorage.googleapis.com/v0/b/social-media-d825a.appspot.com/o/logo.png?alt=media&token=1687eac3-c04b-4085-954d-ac64cb92d9d7',
        urgency: 'critical',
        closeButtonText: 'Close Button'
      }
      const _ = new Notification(data.title, options)
    },

    async sendMessageToPeer () {
      if (/^ *$/.test(this.chat_send_message)) {
        return
      }
      const payload = {
        type: 'chat',
        text: this.chat_send_message
      }
      this.$q.bex.send('send.data', payload)
      this.chat_messages.push({
        payload: this.chat_send_message,
        type: 'chat',
        cltype: 'common-message is-you'
      })
      this.chat_send_message = ''
    },

    toBase64 (file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.readAsDataURL(file)
        reader.onload = () => resolve(reader.result)
        reader.onerror = error => reject(error)
      })
    },

    async sendFileToPeer () {
      const file = document.getElementById('selectedFile').files[0]
      let num = 0
      const chunkSize = 12 * 1024
      const name = Math.floor(Math.random() * Math.pow(10, 5)).toString() + file.name
      let buffer = await this.toBase64(file)
      while (buffer.length > 0) {
        const chunk = buffer.slice(0, chunkSize)
        buffer = buffer.slice(chunkSize, buffer.byteLength)
        this.$q.bex.send('send.data', {
          type: 'file',
          name: name,
          chunk_num: num,
          data: chunk,
          more: true
        })
        num++
      }
      this.$q.bex.send('send.data', {
        type: 'file',
        name: name,
        mimetype: file.type,
        more: false
      })
    },

    checkForMIMEType (data) {
      const blob = this.converBase64toBlob(data.content, data.mimetype)
      const blobUrl = URL.createObjectURL(blob)
      window.open(blobUrl)
    },

    converBase64toBlob (content, contentType) {
      const sliceSize = 512
      var byteCharacters = window.atob(content)
      const byteArrays = [
      ]
      for (var offset = 0; offset < byteCharacters.length; offset += sliceSize) {
        const slice = byteCharacters.slice(offset, offset + sliceSize)
        const byteNumbers = new Array(slice.length)
        for (let i = 0; i < slice.length; i++) {
          byteNumbers[i] = slice.charCodeAt(i)
        }
        const byteArray = new Uint8Array(byteNumbers)
        byteArrays.push(byteArray)
      }
      const blob = new Blob(byteArrays, {
        type: contentType
      })

      return blob
    },

    clickFilePicker () {
      document.getElementById('selectedFile').click()
    }
  }
}
</script>

<style lang="sass">
::-webkit-scrollbar
  width: 10px
::-webkit-scrollbar-track
  background: #f1f1f1
::-webkit-scrollbar-thumb
  background: #888
::-webkit-scrollbar-thumb:hover
  background: #555
.WAL
  width: 100%
  height: 100%
  padding-top: 20px
  padding-bottom: 20px
  &:before
    content: ''
    height: 127px
    position: fixed
    top: 0
    width: 100%
  &__layout
    margin: 0 auto
    z-index: 4000
    height: 100%
    width: 90%
    max-width: 950px
    border-radius: 5px
  &__field.q-field--outlined .q-field__control:before
    border: none
  .q-drawer--standard
    .WAL__drawer-close
      display: none
@media (max-width: 850px)
  .WAL
    padding: 0
    &__layout
      width: 100%
      border-radius: 0
@media (min-width: 691px)
  .WAL
    &__drawer-open
      display: none
.conversation__summary
  margin-top: 4px
.conversation__more
  margin-top: 0!important
  font-size: 1.4rem
.messanger
  overflow: hidden
  flex: 1
  margin-top: 30px
.messanger-list
  display: flex
  flex-direction: column
  padding: 20px 7%
</style>
