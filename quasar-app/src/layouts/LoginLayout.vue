<template>
    <q-container class="bg-light-blue window-height window-width row justify-center items-center add-font">
        <div class="column">
        <div class="row">
            <h5 class="text-h5 text-white q-my-md">Open Anduril App</h5>
        </div>
        <div class="row">
            <q-card square bordered class="q-pa-lg shadow-1">
              <q-card-section>
                <canvas id="qrcode"></canvas>
              </q-card-section>
            </q-card>
        </div>
        </div>
    </q-container>
</template>

<script>
import QRious from 'qrious'

export default {

  data () {
    return {
      id: localStorage.getItem('peer_id')
    }
  },

  created () {
    if (!this.id) {
      this.id = Math.floor(Math.random() * Math.pow(10, 5))
    }
    this.$q.bex.send('peer.start', { peerId: this.id })
    this.$q.bex.on('peer.connected', () => {
      this.$router.replace('/chat')
    })
  },

  mounted () {
    const _ = new QRious({
      element: document.getElementById('qrcode'),
      value: this.id.toString()
    })
    if (Notification.permission !== 'granted') {
      Notification.requestPermission().then(permission => {
        console.log(permission)
      })
    }
  },

  beforeDestroy () {
    this.$q.bex.off('peer.connected')
  },

  methods: {
  }
}
</script>

<style scoped>
    .add-font {
        font-family: Helvetica;
    }
</style>
