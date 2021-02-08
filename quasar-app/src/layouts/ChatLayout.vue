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
          <q-input autogrow rounded outlined dense class="WAL__field col-grow q-mr-sm" bg-color="white" v-model="chat_send_message" placeholder="Type a message" />
          <q-btn round flat icon="send" @click="sendMessageToServer"/>
        </q-toolbar>
      </q-footer>
    </q-layout>
  </div>
</template>

<script>

import Message from '../components/Message.vue'
import io from 'socket.io-client'

export default {
  name: 'ChatLayout',
  components: { Message },
  data () {
    return {
      socket: null,
      leftDrawerOpen: false,
      search: '',
      chat_send_message: '',
      chat_messages: []
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
    this.socket = await io('http://192.168.29.51:4321/')
    this.socket.on('fromServer', data => {
      const dataList = data.split('$$$')
      this.chat_messages.push({
        from: dataList[0],
        payload: dataList[1].replace(/!!!/g, '\n'),
        cltype: dataList[0] === localStorage.getItem('logged_username') ? 'common-message is-you' : 'common-message is-other'
      })
    })
  },

  methods: {
    async sendMessageToServer () {
      if (/^ *$/.test(this.chat_send_message)) {
        return
      }

      const payload = localStorage.getItem('logged_username').toString() + '$$$' + this.chat_send_message.replace(/\n/g, '!!!')
      await this.socket.emit('toServer', payload)
      this.chat_send_message = ''
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
