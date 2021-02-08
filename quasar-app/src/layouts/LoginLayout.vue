<template>
    <q-container class="bg-light-blue window-height window-width row justify-center items-center add-font">
        <div class="column">
        <div class="row">
            <h5 class="text-h5 text-white q-my-md">Enter Your Name</h5>
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
                        v-model="name"
                        label="Your name *"
                        lazy-rules
                        :rules="[ val => val && val.length > 0 || 'Please type something']"
                    />

                    <div>
                        <q-btn xlabel="Submit" type="submit" color="primary">Submit</q-btn>
                        <q-btn label="Reset" type="reset" color="primary" flat class="q-ml-sm" />
                    </div>
            </q-form>
            </q-card-section>
            </q-card>
        </div>
        </div>
    </q-container>
</template>

<script>
export default {
  data () {
    return {
      name: null,
      age: null,

      accept: false
    }
  },

  methods: {
    onSubmit () {
      localStorage.setItem('logged_username', this.name)
      this.$router.push({ path: '/chat' })
    },

    onReset () {
      this.name = null
      this.age = null
      this.accept = false
    }
  }
}
</script>

<style scoped>
    .add-font {
        font-family: Helvetica;
    }
</style>
