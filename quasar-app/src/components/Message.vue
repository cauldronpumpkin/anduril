<template>
    <li :class="type === 'file' ? (cltype + ' link') : cltype" @click="type === 'file' ? openFile : null">
        <p class="common-message-content" style="white-space: pre-line">{{ payload }}</p>
    </li>
</template>

<script>
export default {

  name: 'Message',
  data () {
    return {
    }
  },

  props: {
    payload: {
      type: String,
      required: true
    },
    type: {
      type: String,
      required: true
    },
    link: {
      type: String,
      default: ''
    },
    cltype: {
      type: String,
      required: true
    }
  },

  methods: {
    openFile () {
    }
  }
}
</script>

<style scoped>
    .common-message {
        position: relative;
        background-color: black;
        width: -moz-fit-content;
        width: fit-content;
        max-width: 600px;
        padding: 8px;
        border-radius: 8px;
        box-shadow: 0 1px 0.5px rgba(0, 0, 0, .13);
        margin-bottom: 10px;
    }
    .common-message.is-you {
        --user-color-message: #FFBF00;
        align-self: flex-end;
        background-color: var(--user-color-message);
    }
    .common-message.is-you::before {
        left: auto;
        right: -28px;
        border-width: 0px 16px 16px 16px;
        border-color: transparent;
        border-left-color: var(--user-color-message);
    }
    .common-message.is-you + .is-you::before {
        display: none;
    }
    .common-message.is-other + .is-other::before {
        background-color: aquamarine;
        display: none;
    }
    .link:hover {
      cursor: pointer;
      color: #FFBF00;
    }
</style>
