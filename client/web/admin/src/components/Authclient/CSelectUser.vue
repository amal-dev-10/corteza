<template>
  <c-input-select
    v-model="user.value"
    data-test-id="select-user"
    :options="user.options"
    :get-option-label="getOptionLabel"
    :get-option-key="getOptionKey"
    :placeholder="placeholder"
    :loading="processing"
    :filterable="false"
    :reduce="o => o.userID"
    v-bind="$attrs"
    @search="search"
    @input="onUserUpdate"
  />
</template>

<script>
import { NoID } from '@cortezaproject/corteza-js'
import { debounce } from 'lodash'

export default {
  props: {
    userID: {
      type: String,
      default: null,
    },

    placeholder: {
      type: String,
      default: '',
    },
  },

  data () {
    return {
      user: {
        options: [],
        value: undefined,

        filter: {
          query: null,
          limit: 10,
        },
      },

      processing: false,
    }
  },

  watch: {
    userID: {
      handler (userID) {
        this.getUserByID(userID)
      },
    },
  },

  created () {
    this.fetchUsers().then(() => {
      this.getUserByID(this.userID)
    })
  },

  methods: {
    search: debounce(function (query) {
      if (query !== this.user.filter.query) {
        this.user.filter.query = query
        this.user.filter.page = 1
      }

      this.fetchUsers()
    }, 300),

    fetchUsers () {
      this.processing = true

      return this.$SystemAPI.userList(this.user.filter).then(({ set }) => {
        this.user.options = set.map(m => Object.freeze(m))
      }).finally(() => {
        setTimeout(() => {
          this.processing = false
        }, 500)
      })
    },

    getUserByID (userID) {
      if (!userID || userID === NoID) {
        this.user.value = userID
        return
      }

      if (this.user.options.some(o => o.userID === userID)) {
        this.user.value = userID
      } else {
        this.$SystemAPI.userRead({ userID }).then(user => {
          this.user.value = user.userID
          this.user.options.push(Object.freeze(user))
        })
      }
    },

    onUserUpdate () {
      this.$emit('input', this.user.value)
    },

    getOptionKey ({ userID }) {
      return userID
    },

    getOptionLabel ({ userID, email, name, username }) {
      return name || username || email || `<@${userID}>`
    },
  },
}
</script>
