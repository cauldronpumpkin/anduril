<template>
    <q-container class="bg-light-blue window-height window-width row justify-center items-center add-font">
        <div class="column">
        <div class="row">
            <h5 class="text-h5 text-white q-my-md">Connect to a Peer</h5>
        </div>
        <div class="row">
            <q-card square bordered class="q-pa-lg shadow-1">
            <q-card-section>
                <q-form
                    @submit="onSubmit"
                    @reset="onReset"
                    class="q-gutter-md"
                >
                    <q-input
                        filled
                        v-model="otherPeerId"
                        label="Connect to a Peer ID"
                        lazy-rules
                        :rules="[ val => val && val.length > 0 || 'Please type something']"
                    />

                    <div>
                        <q-btn xlabel="Submit" type="submit" color="primary">Submit</q-btn>
                        <q-btn label="Reset" type="reset" color="primary" flat class="q-ml-sm" />
                        <q-btn label="My ID" color="primary" flat class="q-ml-sm">
                          <q-tooltip content-class="bg-black" content-style="font-size: 15px">{{ myPeerId }}</q-tooltip>
                        </q-btn>
                    </div>
            </q-form>
            </q-card-section>
            </q-card>
        </div>
        </div>
    </q-container>
</template>

<script>
import Peer from 'peerjs'

export default {
  data () {
    return {
      myPeerId: localStorage.getItem('my_peer_id'),
      otherPeerId: localStorage.getItem('recent_peer_id')
    }
  },

  created () {
    if (this.myPeerId == null) {
      this.$router.push('/')
    }
    this.$store.state.peer = new Peer(this.myPeerId)
    this.$store.state.peer.on('connection', conn => {
      this.$store.state.conn = conn
      this.$router.push('/chat')
    })
  },

  methods: {
    onSubmit () {
      localStorage.setItem('recent_peer_id', this.otherPeerId)
      try {
        this.$store.state.conn = this.$store.state.peer.connect(this.otherPeerId)
        this.$store.state.conn.on('open', () => {
          this.$router.push('/chat')
        })
      } catch (err) {
        alert('This Peer ID is not active currently')
      }
    },

    onReset () {
      this.otherPeerId = null
    }
  }
}
</script>

<style scoped>
    .add-font {
        font-family: Helvetica;
    }
</style>
