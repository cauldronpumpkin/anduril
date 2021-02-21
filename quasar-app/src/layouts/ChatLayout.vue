<template>
  <div class="WAL position-relative bg-grey-10" :style="style">
    <q-layout view="lHh Lpr lFf" class="WAL__layout shadow-3 bg-grey-10 text-white" container ref="scroll">
      <q-header elevated>
        <q-toolbar class="bg-amber-5 text-black">

          <q-btn round flat>
            <q-avatar>
              <!-- <img :src="currentConversation.avatar"> -->
            </q-avatar>
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
          <q-btn flat round icon="attachment" size="md" onclick="document.getElementById('selectedFile').click()"/>
          <q-input autogrow rounded outlined dense class="WAL__field col-grow q-mr-sm" bg-color="white" v-model="chat_send_message" placeholder="Type a message" />
          <q-btn round flat icon="send" @click="sendMessageToPeer"/>
        </q-toolbar>
      </q-footer>
    </q-layout>
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
      fileBase64: [],
      fileIdx: 0,
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

  async created () {
    this.$store.state.conn.on('data', data => {
      if (data.type === 'file') {
        if (data.chunk_num === 0) {
          this.fileBase64.push('')
          this.fileIdx = 0
          this.chat_messages.push({
            payload: data.name,
            type: 'file',
            loading: true,
            cltype: 'common-message is-other'
          })
        }
        if (!data.more) {
          for (let i = this.chat_messages.length - 1; i >= 0; i--) {
            if (this.chat_messages[i].payload === data.name) {
              this.chat_messages[i].loading = false
              break
            }
          }
          this.fileBase64.forEach(el => {
            console.log(el.length)
          })
          this.checkForMIMEType({
            content: this.fileBase64.join(''),
            mimetype: data.mimetype
          })
          this.fileBase64 = []
          this.fileIdx = 0
        } else {
          if (this.fileBase64[this.fileIdx].length > this.limit) {
            this.fileBase64.push('')
            this.fileIdx++
          }
          this.fileBase64[this.fileIdx] += data.data
        }
      } else if (data.type === 'chat') {
        this.chat_messages.push({
          payload: data.text,
          type: 'chat',
          cltype: 'common-message is-other'
        })
      } else if (data.type === 'notification') {
        this.recieveNotification(data)
      }
    })

    this.$store.state.conn.on('close', () => {
      alert('The Connection was Closed!')
      this.$router.replace('/')
    })

    this.$store.state.conn.on('error', () => {
      alert('The Connection was interrupted!')
      this.$router.replace('/')
    })

    if (this.$q.platform.is.electron) {
      this.$q.electron.ipcRenderer.on('clipboard-changed', (_, data) => {
        this.$store.state.conn.send({
          type: 'clipboard',
          data: data
        })
      })
    }
  },

  beforeDestroy () {
    this.$store.state.conn.close()
    // this.$store.state.peer.destroy()
    if (this.$q.platform.is.electron) {
      this.$q.electron.clipboard.stopWatching()
    }
  },

  methods: {
    recieveNotification (data) {
      const options = {
        subtitle: 'Subtitle of the Notification',
        body: data.text,
        silent: false,
        icon: 'https://cdn1.bbcode0.com/uploads/2021/2/15/50b43af9f89b93b56fe05ac7a426618f-full.png',
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
      await this.$store.state.conn.send(payload)
      this.chat_messages.push({
        payload: this.chat_send_message,
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
      console.log(file)
      let num = 0
      const chunkSize = 8 * 1024
      let buffer = await this.toBase64(file)
      while (buffer.length > 0) {
        const chunk = buffer.slice(0, chunkSize)
        buffer = buffer.slice(chunkSize, buffer.byteLength)
        await this.$store.state.conn.send({
          type: 'file',
          chunk_num: num,
          data: chunk,
          more: true
        })
        num++
      }
      await this.$store.state.conn.send({
        type: 'file',
        name: file.name,
        mimetype: file.type,
        more: false
      })
    },

    checkForMIMEType (data) {
      // let blob
      // if (response.mimetype === 'pdf') {
      const blob = this.converBase64toBlob(data.content, data.mimetype)
      // } else if (response.mimetype === 'doc') {
      //   blob = this.converBase64toBlob(response.content, 'application/msword')
      // }
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
